// Marcas y check-in del día. Las marcas se escriben sobre hoy o sobre ayer (el día de gracia, D29); el
// check-in, solo sobre hoy. Las reglas usan la hora del servidor. Sin transacción para que funcione
// sin conexión.
import type { CheckInDimension, DateKey } from '@ascua/shared';
import {
  deleteField,
  FieldPath,
  serverTimestamp,
  setDoc,
  updateDoc,
  type Firestore,
} from 'firebase/firestore';

import { dailyLogRef, newDocumentFields } from '../data/documents';

export interface HabitCompletion {
  /** El día que se marca: hoy o ayer (el día de gracia). */
  dateKey: DateKey;
  habitId: string;
  completed: boolean;
  /**
   * Lo hecho ese día de un hábito con cantidad (3 de 8). `completed` va igual, calculado con la meta:
   * al cerrar el día manda `count`.
   */
  count?: number;
  /**
   * Los pasos hechos ese día de un hábito con pasos (fase 21). `completed` va igual, calculado con
   * los pasos del hábito: al cerrar el día mandan los pasos.
   */
  doneSteps?: readonly string[];
  /** Si el documento del día ya existe (lo dice la suscripción); la primera marca lo crea. */
  logExists: boolean;
}

export function setHabitCompletion(
  db: Firestore,
  uid: string,
  { dateKey, habitId, completed, count, doneSteps, logExists }: HabitCompletion,
): Promise<void> {
  const ref = dailyLogRef(db, uid, dateKey).withConverter(null);
  const entry = {
    completed,
    ...(count === undefined ? {} : { count }),
    ...(doneSteps === undefined ? {} : { doneSteps: [...doneSteps] }),
    updatedAt: serverTimestamp(),
  };

  if (!logExists) {
    return setDoc(ref, {
      dateKey,
      entries: { [habitId]: entry },
      status: 'open',
      summary: null,
      ...newDocumentFields(),
    });
  }
  // FieldPath: el ID del hábito nunca se interpreta como una ruta con puntos.
  return updateDoc(ref, new FieldPath('entries', habitId), entry, 'updatedAt', serverTimestamp());
}

export interface CheckInAnswer {
  today: DateKey;
  dimension: CheckInDimension;
  /** 1 a 5; null borra la respuesta. */
  value: number | null;
  logExists: boolean;
}

/**
 * Contesta (o borra) una escala del check-in de hoy. Cada escala se escribe sola, así dos
 * dispositivos que contestan escalas distintas no se pisan.
 */
export function setCheckIn(
  db: Firestore,
  uid: string,
  { today, dimension, value, logExists }: CheckInAnswer,
): Promise<void> {
  const ref = dailyLogRef(db, uid, today).withConverter(null);
  if (!logExists) {
    return setDoc(ref, {
      dateKey: today,
      entries: {},
      status: 'open',
      summary: null,
      checkIn: value === null ? {} : { [dimension]: value },
      ...newDocumentFields(),
    });
  }
  return updateDoc(
    ref,
    new FieldPath('checkIn', dimension),
    value ?? deleteField(),
    'updatedAt',
    serverTimestamp(),
  );
}
