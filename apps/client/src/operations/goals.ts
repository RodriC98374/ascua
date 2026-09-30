// Metas (fase 18, D25): escrituras libres, validadas en forma por las reglas. Sin transacciones para
// que funcionen sin conexión. Una meta no da puntos: sus tareas y hábitos ya los dan.
import { todayDateKey, type DateKey, type GoalStatus } from '@ascua/shared';
import {
  arrayRemove,
  arrayUnion,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { goalRef, goalsCollection, newDocumentFields, tasksCollection } from '../data/documents';
import type { TaskInput } from './tasks';

export interface GoalInput {
  title: string;
  description: string | null;
  targetDateKey: DateKey | null;
  habitIds: string[];
}

function clean({ title, description, targetDateKey, habitIds }: GoalInput): GoalInput {
  return {
    title: title.trim(),
    description: description?.trim() || null,
    targetDateKey,
    habitIds: [...new Set(habitIds)],
  };
}

/** Crea una meta activa que empieza hoy. Devuelve su ID al instante y la escritura en curso. */
export function createGoal(
  db: Firestore,
  uid: string,
  input: GoalInput,
  sortOrder: number,
  today: DateKey = todayDateKey(),
): { goalId: string; write: Promise<void> } {
  const ref = doc(goalsCollection(db, uid)).withConverter(null);
  const write = setDoc(ref, {
    ...clean(input),
    taskIds: [],
    status: 'active',
    startDateKey: today,
    achievedDateKey: null,
    sortOrder,
    ...newDocumentFields(),
  });
  return { goalId: ref.id, write };
}

export function updateGoal(
  db: Firestore,
  uid: string,
  goalId: string,
  input: GoalInput,
): Promise<void> {
  return updateDoc(goalRef(db, uid, goalId).withConverter(null), {
    ...clean(input),
    updatedAt: serverTimestamp(),
  });
}

/** Lograda (hoy), reabierta o archivada. */
export function setGoalStatus(
  db: Firestore,
  uid: string,
  goalId: string,
  status: GoalStatus,
  today: DateKey = todayDateKey(),
): Promise<void> {
  return updateDoc(goalRef(db, uid, goalId).withConverter(null), {
    status,
    achievedDateKey: status === 'achieved' ? today : null,
    updatedAt: serverTimestamp(),
  });
}

/** Crea una tarea y la suma a la meta en el mismo lote: nunca queda una sin la otra. */
export function createGoalTask(
  db: Firestore,
  uid: string,
  goalId: string,
  input: TaskInput,
): { taskId: string; write: Promise<void> } {
  const taskRef = doc(tasksCollection(db, uid)).withConverter(null);
  const batch = writeBatch(db);
  batch.set(taskRef, {
    title: input.title.trim(),
    size: input.size,
    dueDateKey: input.dueDateKey,
    completedDateKey: null,
    completedAt: null,
    ...newDocumentFields(),
  });
  batch.update(goalRef(db, uid, goalId).withConverter(null), {
    taskIds: arrayUnion(taskRef.id),
    updatedAt: serverTimestamp(),
  });
  return { taskId: taskRef.id, write: batch.commit() };
}

/** Quita una tarea de la meta; la tarea sigue en Hoy. */
export function unlinkGoalTask(
  db: Firestore,
  uid: string,
  goalId: string,
  taskId: string,
): Promise<void> {
  return updateDoc(goalRef(db, uid, goalId).withConverter(null), {
    taskIds: arrayRemove(taskId),
    updatedAt: serverTimestamp(),
  });
}
