// Restaurar la configuración desde un respaldo (fase 19, D26). Crea lo elegido en la vista previa
// con la misma forma que los formularios, así que las reglas lo validan igual que siempre: sin
// puertas especiales. Los vínculos de las metas pasan de los IDs del respaldo a los nuevos.
import {
  todayDateKey,
  type DateKey,
  type GoalLink,
  type PlannedRestoreItem,
  type RestorePlan,
} from '@ascua/shared';
import {
  doc,
  writeBatch,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Firestore,
} from 'firebase/firestore';

import {
  goalsCollection,
  habitsCollection,
  newDocumentFields,
  rewardsCollection,
  tasksCollection,
  weeklyReflectionRef,
} from '../data/documents';
import { DEFAULT_REWARD_ICON } from './rewards';

/** Un lote de Firestore admite 500 escrituras; se deja margen. */
const BATCH_SIZE = 400;

/** Desde qué `sortOrder` se agregan, para que lo restaurado quede después de lo que ya hay. */
export interface RestoreSortOrders {
  habits: number;
  rewards: number;
  goals: number;
}

export type RestoreCounts = Record<
  'habits' | 'rewards' | 'tasks' | 'goals' | 'reflections',
  number
>;

interface Write {
  ref: DocumentReference;
  data: Record<string, unknown>;
}

/** Documento nuevo con ID propio, sin converter: se escribe con la forma de Firestore. */
function newRef<A, D extends DocumentData>(
  collection: CollectionReference<A, D>,
): DocumentReference {
  return doc(collection).withConverter(null);
}

function selected<T>(items: readonly PlannedRestoreItem<T>[]): PlannedRestoreItem<T>[] {
  return items.filter((item) => item.isSelected);
}

/**
 * Crea lo elegido del plan. Va en lotes: si uno falla, lo ya escrito queda y, al volver a
 * intentar, la vista previa lo muestra como repetido.
 */
export async function restoreConfiguration(
  db: Firestore,
  uid: string,
  plan: RestorePlan,
  sortOrders: RestoreSortOrders,
  today: DateKey = todayDateKey(),
): Promise<RestoreCounts> {
  const habits = selected(plan.habits);
  const rewards = selected(plan.rewards);
  const tasks = selected(plan.tasks);
  const goals = selected(plan.goals);
  const reflections = selected(plan.reflections);

  // IDs nuevos antes de escribir, para que las metas apunten a ellos.
  const habitRefs = habits.map((item) => ({ ...item, ref: newRef(habitsCollection(db, uid)) }));
  const taskRefs = tasks.map((item) => ({ ...item, ref: newRef(tasksCollection(db, uid)) }));
  const habitIds = new Map(habitRefs.map(({ sourceId, ref }) => [sourceId, ref.id]));
  const taskIds = new Map(taskRefs.map(({ sourceId, ref }) => [sourceId, ref.id]));
  const idsOf = (links: readonly GoalLink[], newIds: ReadonlyMap<string, string>) =>
    links.flatMap((link) => {
      const id = link.kind === 'existing' ? link.id : newIds.get(link.sourceId);
      return id ? [id] : [];
    });

  const writes: Write[] = [
    ...habitRefs.map(({ ref, value }, index) => ({
      ref,
      data: {
        ...value,
        status: 'active',
        sortOrder: sortOrders.habits + index,
        startDateKey: today,
        archivedDateKey: null,
      },
    })),
    ...rewards.map(({ value }, index) => ({
      ref: newRef(rewardsCollection(db, uid)),
      data: {
        ...value,
        icon: DEFAULT_REWARD_ICON,
        status: 'active',
        sortOrder: sortOrders.rewards + index,
      },
    })),
    ...taskRefs.map(({ ref, value }) => ({
      ref,
      data: { ...value, completedDateKey: null, completedAt: null },
    })),
    ...reflections.map(({ value }) => ({
      ref: weeklyReflectionRef(db, uid, value.weekStartDateKey).withConverter(null),
      data: { ...value },
    })),
    // Al final: si un lote falla, una meta nunca queda apuntando a algo que no se escribió.
    ...goals.map(({ value }, index) => ({
      ref: newRef(goalsCollection(db, uid)),
      data: {
        title: value.title,
        description: value.description,
        targetDateKey: value.targetDateKey,
        habitIds: idsOf(value.habits, habitIds),
        taskIds: idsOf(value.tasks, taskIds),
        status: 'active',
        startDateKey: today,
        achievedDateKey: null,
        sortOrder: sortOrders.goals + index,
      },
    })),
  ];

  for (let start = 0; start < writes.length; start += BATCH_SIZE) {
    const batch = writeBatch(db);
    for (const { ref, data } of writes.slice(start, start + BATCH_SIZE)) {
      batch.set(ref, { ...data, ...newDocumentFields() });
    }
    await batch.commit();
  }

  return {
    habits: habits.length,
    rewards: rewards.length,
    tasks: tasks.length,
    goals: goals.length,
    reflections: reflections.length,
  };
}
