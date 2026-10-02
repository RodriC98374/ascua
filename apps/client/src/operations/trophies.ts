// Trofeos (fase 21): "Utilizado" marca un canje con la hora del servidor, una sola vez. Es la
// única escritura de `rewardRedemptions` fuera de `redeemReward`; las reglas no dejan cambiar nada más.
import { serverTimestamp, updateDoc, type Firestore } from 'firebase/firestore';

import { redemptionRef } from '../data/documents';

export function markTrophyUsed(db: Firestore, uid: string, redemptionId: string): Promise<void> {
  return updateDoc(redemptionRef(db, uid, redemptionId).withConverter(null), {
    usedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}
