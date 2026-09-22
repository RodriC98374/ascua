// Hábitos: escrituras libres, validadas en forma por las reglas. No usan transacciones para que
// funcionen sin conexión: la escritura queda en cola y se sincroniza al volver la red.
import { todayDateKey, type DateKey, type HabitTier } from '@ascua/shared';
import {
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { habitRef, habitsCollection, newDocumentFields } from '../data/documents';

/** El diseño aprobado no muestra ícono ni color por hábito: se guardan con valores fijos. */
export const DEFAULT_HABIT_ICON = 'check';
export const DEFAULT_HABIT_COLOR = '#FF6B35';

export interface HabitInput {
  name: string;
  description: string | null;
  tier: HabitTier;
}

function clean({ name, description, tier }: HabitInput): HabitInput {
  const trimmedDescription = description?.trim() ?? '';
  return { name: name.trim(), description: trimmedDescription || null, tier };
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
    color: DEFAULT_HABIT_COLOR,
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

/** Archivar: hoy es el último día en que cuenta. No se puede deshacer (ver data-model §3). */
export function archiveHabit(
  db: Firestore,
  uid: string,
  habitId: string,
  today: DateKey = todayDateKey(),
): Promise<void> {
  return updateDoc(habitRef(db, uid, habitId).withConverter(null), {
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
): Promise<void> {
  const batch = writeBatch(db);
  orderedHabitIds.forEach((habitId, index) => {
    batch.update(habitRef(db, uid, habitId).withConverter(null), {
      sortOrder: index,
      updatedAt: serverTimestamp(),
    });
  });
  return batch.commit();
}
