// Marcas del día. Solo se puede escribir sobre hoy (las reglas usan la hora del servidor).
// Sin transacción para que funcione sin conexión.
import type { DateKey } from '@ascua/shared';
import { FieldPath, serverTimestamp, setDoc, updateDoc, type Firestore } from 'firebase/firestore';

import { dailyLogRef, newDocumentFields } from '../data/documents';

export interface HabitCompletion {
  today: DateKey;
  habitId: string;
  completed: boolean;
  /** Si el documento de hoy ya existe (lo dice la suscripción); la primera marca lo crea. */
  logExists: boolean;
}

export function setHabitCompletion(
  db: Firestore,
  uid: string,
  { today, habitId, completed, logExists }: HabitCompletion,
): Promise<void> {
  const ref = dailyLogRef(db, uid, today).withConverter(null);
  const entry = { completed, updatedAt: serverTimestamp() };

  if (!logExists) {
    return setDoc(ref, {
      dateKey: today,
      entries: { [habitId]: entry },
      status: 'open',
      summary: null,
      ...newDocumentFields(),
    });
  }
  // FieldPath: el ID del hábito nunca se interpreta como una ruta con puntos.
  return updateDoc(ref, new FieldPath('entries', habitId), entry, 'updatedAt', serverTimestamp());
}
