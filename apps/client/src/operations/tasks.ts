// Tareas (fase 14): escrituras libres, validadas en forma por las reglas. Sin transacciones para
// que funcionen sin conexión. Marcar o desmarcar solo vale para hoy, y una tarea cumplida en un día
// ya pasado no se toca: sus puntos son parte del cierre de ese día.
import { todayDateKey, type DateKey, type TaskSize } from '@ascua/shared';
import {
  deleteDoc,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';

import { newDocumentFields, taskRef, tasksCollection } from '../data/documents';

export interface TaskInput {
  title: string;
  size: TaskSize;
  /** Hoy o un día que viene. */
  dueDateKey: DateKey;
}

function clean({ title, size, dueDateKey }: TaskInput): TaskInput {
  return { title: title.trim(), size, dueDateKey };
}

/** Crea una tarea pendiente. Devuelve su ID al instante y la escritura en curso. */
export function createTask(
  db: Firestore,
  uid: string,
  input: TaskInput,
): { taskId: string; write: Promise<void> } {
  const ref = doc(tasksCollection(db, uid)).withConverter(null);
  const write = setDoc(ref, {
    ...clean(input),
    completedDateKey: null,
    completedAt: null,
    ...newDocumentFields(),
  });
  return { taskId: ref.id, write };
}

export function updateTask(
  db: Firestore,
  uid: string,
  taskId: string,
  input: TaskInput,
): Promise<void> {
  return updateDoc(taskRef(db, uid, taskId).withConverter(null), {
    ...clean(input),
    updatedAt: serverTimestamp(),
  });
}

/** Cambia solo la fecha: "mover a mañana" o pasar una vencida a otro día. */
export function moveTask(
  db: Firestore,
  uid: string,
  taskId: string,
  dueDateKey: DateKey,
): Promise<void> {
  return updateDoc(taskRef(db, uid, taskId).withConverter(null), {
    dueDateKey,
    updatedAt: serverTimestamp(),
  });
}

/** Marca (hoy, con la hora del servidor) o desmarca una tarea. */
export function setTaskCompletion(
  db: Firestore,
  uid: string,
  taskId: string,
  completed: boolean,
  today: DateKey = todayDateKey(),
): Promise<void> {
  return updateDoc(taskRef(db, uid, taskId).withConverter(null), {
    completedDateKey: completed ? today : null,
    completedAt: completed ? serverTimestamp() : null,
    updatedAt: serverTimestamp(),
  });
}

export function deleteTask(db: Firestore, uid: string, taskId: string): Promise<void> {
  return deleteDoc(taskRef(db, uid, taskId));
}
