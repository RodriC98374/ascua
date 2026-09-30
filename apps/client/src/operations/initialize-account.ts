// initializeAccount: crea el perfil y el estado de gamificación la primera vez que el usuario
// inicia sesión. Es idempotente: se llama después de cada inicio de sesión y solo crea lo que
// falte. La transacción evita duplicados si la app se abre a la vez en el celular y en la PC.
import {
  initialGamificationState,
  initialUserProfile,
  todayDateKey,
  type DateKey,
} from '@ascua/shared';
import { getDocFromCache, runTransaction, type Firestore } from 'firebase/firestore';

import { gamificationRef, newDocumentFields, userProfileRef } from '../data/documents';

export interface AccountUser {
  uid: string;
  email: string;
}

export type InitializeAccountResult = 'created' | 'already_initialized';

/**
 * La cuenta ya está lista en este dispositivo: el perfil y el estado de puntos están en la caché
 * local (nunca se borran). Así la app abre sin conexión (fase 19), porque la transacción de
 * `initializeAccount` necesita el servidor.
 */
export async function isAccountCached(db: Firestore, uid: string): Promise<boolean> {
  try {
    const [profile, state] = await Promise.all([
      getDocFromCache(userProfileRef(db, uid)),
      getDocFromCache(gamificationRef(db, uid)),
    ]);
    return profile.exists() && state.exists();
  } catch {
    // Sin copia local de alguno de los dos.
    return false;
  }
}

export function initializeAccount(
  db: Firestore,
  user: AccountUser,
  today: DateKey = todayDateKey(),
): Promise<InitializeAccountResult> {
  const profileRef = userProfileRef(db, user.uid);
  const stateRef = gamificationRef(db, user.uid);

  return runTransaction(db, async (transaction) => {
    const profile = await transaction.get(profileRef);
    const state = await transaction.get(stateRef);

    // Se escribe sin converter: los metadatos (timestamps del servidor) no son parte del dominio.
    if (!profile.exists()) {
      transaction.set(profileRef.withConverter(null), {
        ...initialUserProfile(user.email),
        ...newDocumentFields(),
      });
    }
    if (!state.exists()) {
      transaction.set(stateRef.withConverter(null), {
        ...initialGamificationState(today),
        ...newDocumentFields(),
      });
    }
    return profile.exists() && state.exists() ? 'already_initialized' : 'created';
  });
}
