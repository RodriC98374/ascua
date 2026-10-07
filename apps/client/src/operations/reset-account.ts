// resetAccount (fase 22, D30): borra todo lo del usuario (hábitos, recompensas, tareas, metas,
// puntos, racha e historial) y deja la cuenta como nueva. Es lo único que borra el historial: las
// reglas solo lo permiten con el marcador `meta/reset`, escrito justo antes (ver `isResetting`).
// No toca al usuario de acceso (Auth): tras borrar, la cuenta se vuelve a crear en cero.
import {
  collection,
  deleteDoc,
  doc,
  getDocsFromServer,
  serverTimestamp,
  setDoc,
  writeBatch,
  type Firestore,
} from 'firebase/firestore';

import { initializeAccount, type AccountUser } from './initialize-account';

/** Subcolecciones de `users/{uid}`. Una colección nueva de la app debe sumarse aquí. */
export const RESET_COLLECTIONS = [
  'habits',
  'dailyLogs',
  'monthlySummaries',
  'pointTransactions',
  'rewards',
  'rewardRedemptions',
  'tasks',
  'goals',
  'weeklyReflections',
] as const;

/** Documentos sueltos de `users/{uid}/meta`, aparte del marcador. */
const RESET_META_DOCS = ['gamification', 'savings'] as const;

/** Borrados por lote; Firestore admite 500 y las reglas leen el marcador una sola vez por lote. */
const BATCH_SIZE = 200;

export async function resetAccount(db: Firestore, user: AccountUser): Promise<void> {
  const { uid } = user;
  const marker = doc(db, 'users', uid, 'meta', 'reset');
  // Con la hora del servidor: las reglas solo dejan borrar durante los 15 minutos siguientes.
  await setDoc(marker, { requestedAt: serverTimestamp() });

  for (const name of RESET_COLLECTIONS) {
    // Del servidor y no de la caché: una copia parcial dejaría datos sin borrar sin avisar.
    const snapshot = await getDocsFromServer(collection(db, 'users', uid, name));
    for (let start = 0; start < snapshot.docs.length; start += BATCH_SIZE) {
      const batch = writeBatch(db);
      for (const document of snapshot.docs.slice(start, start + BATCH_SIZE)) {
        batch.delete(document.ref);
      }
      await batch.commit();
    }
  }
  for (const name of RESET_META_DOCS) {
    await deleteDoc(doc(db, 'users', uid, 'meta', name));
  }
  await deleteDoc(doc(db, 'users', uid));
  await deleteDoc(marker);

  // La cuenta nace de nuevo en cero, con "ayer" como último día cerrado.
  await initializeAccount(db, user);
}
