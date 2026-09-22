// Catálogo de recompensas: escrituras libres, validadas en forma por las reglas. Sin transacciones
// para que funcionen sin conexión. Las recompensas nunca se borran: se archivan.
import type { RewardTier } from '@ascua/shared';
import { doc, serverTimestamp, setDoc, updateDoc, type Firestore } from 'firebase/firestore';

import { newDocumentFields, rewardRef, rewardsCollection } from '../data/documents';

/** El diseño no muestra ícono por recompensa: se guarda uno fijo. */
export const DEFAULT_REWARD_ICON = 'star';

export interface RewardInput {
  name: string;
  description: string | null;
  tier: RewardTier;
  cost: number;
}

function clean({ name, description, tier, cost }: RewardInput): RewardInput {
  const trimmedDescription = description?.trim() ?? '';
  return { name: name.trim(), description: trimmedDescription || null, tier, cost };
}

/** Crea una recompensa activa. Devuelve su ID al instante y la escritura en curso. */
export function createReward(
  db: Firestore,
  uid: string,
  input: RewardInput,
  sortOrder: number,
): { rewardId: string; write: Promise<void> } {
  const ref = doc(rewardsCollection(db, uid)).withConverter(null);
  const write = setDoc(ref, {
    ...clean(input),
    icon: DEFAULT_REWARD_ICON,
    status: 'active',
    sortOrder,
    ...newDocumentFields(),
  });
  return { rewardId: ref.id, write };
}

export function updateReward(
  db: Firestore,
  uid: string,
  rewardId: string,
  input: RewardInput,
): Promise<void> {
  return updateDoc(rewardRef(db, uid, rewardId).withConverter(null), {
    ...clean(input),
    updatedAt: serverTimestamp(),
  });
}

/** Los canjes ya hechos conservan su foto de la recompensa. */
export function archiveReward(db: Firestore, uid: string, rewardId: string): Promise<void> {
  return updateDoc(rewardRef(db, uid, rewardId).withConverter(null), {
    status: 'archived',
    updatedAt: serverTimestamp(),
  });
}
