// Perfil: escritura libre, validada en forma por las reglas. Sin transacción para que funcione
// sin conexión, como los hábitos.
import type { ReminderSettings } from '@ascua/shared';
import { serverTimestamp, updateDoc, type Firestore } from 'firebase/firestore';

import { userProfileRef } from '../data/documents';

/** Guarda los horarios de los recordatorios; el celular los aplica al leerlos. */
export function updateReminderSettings(
  db: Firestore,
  uid: string,
  settings: ReminderSettings,
): Promise<void> {
  const { enabled, dailyReminderTime, streakRiskReminderTime } = settings;
  return updateDoc(userProfileRef(db, uid).withConverter(null), {
    reminderSettings: { enabled, dailyReminderTime, streakRiskReminderTime },
    updatedAt: serverTimestamp(),
  });
}
