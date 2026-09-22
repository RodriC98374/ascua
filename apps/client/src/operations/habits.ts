// Hábitos: escrituras libres, validadas en forma por las reglas. No usan transacciones para que
// funcionen sin conexión: la escritura queda en cola y se sincroniza al volver la red.
import {
  todayDateKey,
  type DateKey,
  type HabitCategory,
  type HabitColor,
  type HabitRecord,
  type HabitTier,
} from '@ascua/shared';
import {
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { habitRef, habitsCollection, newDocumentFields } from '../data/documents';

/** El ícono por hábito todavía no se elige en la interfaz: se guarda con un valor fijo. */
export const DEFAULT_HABIT_ICON = 'check';

export interface HabitInput {
  name: string;
  description: string | null;
  tier: HabitTier;
  category: HabitCategory;
  color: HabitColor;
}

function clean({ name, description, tier, category, color }: HabitInput): HabitInput {
  const trimmedDescription = description?.trim() ?? '';
  return { name: name.trim(), description: trimmedDescription || null, tier, category, color };
}

/** Crea un hábito que cuenta desde hoy. Devuelve su ID al instante y la escritura en curso. */
export function createHabit(
  db: Firestore,
  uid: string,
  input: HabitInput,
  sortOrder: number,
  today: DateKey = todayDateKey(),
): { habitId: string; write: Promise<void> } {
  const ref = doc(habitsCollection(db, uid)).withConverter(null);
  const write = setDoc(ref, {
    ...clean(input),
    icon: DEFAULT_HABIT_ICON,
    schedule: { type: 'daily' },
    status: 'active',
    sortOrder,
    startDateKey: today,
    archivedDateKey: null,
    ...newDocumentFields(),
  });
  return { habitId: ref.id, write };
}

export function updateHabit(
  db: Firestore,
  uid: string,
  habitId: string,
  input: HabitInput,
): Promise<void> {
  return updateDoc(habitRef(db, uid, habitId).withConverter(null), {
    ...clean(input),
    updatedAt: serverTimestamp(),
  });
}

/**
 * Los hábitos guardados antes de que existieran las categorías no traen `category` y las reglas
 * la exigen en todo el documento, así que cualquier escritura la completa. El converter ya la
 * rellenó al leerlos, de modo que aquí siempre hay un valor válido.
 */
function appearance(habit: HabitRecord): { category: HabitCategory; color: HabitColor } {
  return { category: habit.category, color: habit.color };
}

/** Archivar: hoy es el último día en que cuenta. No se puede deshacer (ver data-model §3). */
export function archiveHabit(
  db: Firestore,
  uid: string,
  habit: HabitRecord,
  today: DateKey = todayDateKey(),
): Promise<void> {
  return updateDoc(habitRef(db, uid, habit.id).withConverter(null), {
    ...appearance(habit),
    status: 'archived',
    archivedDateKey: today,
    updatedAt: serverTimestamp(),
  });
}

/** Guarda el orden: la posición en la lista pasa a ser su sortOrder. */
export function reorderHabits(
  db: Firestore,
  uid: string,
  orderedHabitIds: string[],
  habits: readonly HabitRecord[],
): Promise<void> {
  const batch = writeBatch(db);
  orderedHabitIds.forEach((habitId, index) => {
    const habit = habits.find((candidate) => candidate.id === habitId);
    if (!habit) return;
    batch.update(habitRef(db, uid, habitId).withConverter(null), {
      ...appearance(habit),
      sortOrder: index,
      updatedAt: serverTimestamp(),
    });
  });
  return batch.commit();
}
