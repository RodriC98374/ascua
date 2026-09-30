// Reflexión semanal (fase 18, D25): un documento por semana (el ID es su lunes), que se escribe
// desde el domingo de esa semana y se puede editar cuando sea. Sin transacción: funciona sin
// conexión.
import type { DateKey, ReflectionQuestion } from '@ascua/shared';
import { serverTimestamp, setDoc, updateDoc, type Firestore } from 'firebase/firestore';

import { newDocumentFields, weeklyReflectionRef } from '../data/documents';

export type ReflectionAnswers = Record<ReflectionQuestion, string>;

function clean({ wentWell, wasHard, nextFocus }: ReflectionAnswers): ReflectionAnswers {
  return { wentWell: wentWell.trim(), wasHard: wasHard.trim(), nextFocus: nextFocus.trim() };
}

/** Crea la reflexión de la semana o, si ya existe, cambia sus respuestas. */
export function saveReflection(
  db: Firestore,
  uid: string,
  weekStartDateKey: DateKey,
  answers: ReflectionAnswers,
  exists: boolean,
): Promise<void> {
  const ref = weeklyReflectionRef(db, uid, weekStartDateKey).withConverter(null);
  return exists
    ? updateDoc(ref, { ...clean(answers), updatedAt: serverTimestamp() })
    : setDoc(ref, { weekStartDateKey, ...clean(answers), ...newDocumentFields() });
}
