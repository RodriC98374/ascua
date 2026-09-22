// Las operaciones reales del catálogo de recompensas contra el emulador y las reglas reales.
import { getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { rewardRef } from '../../../../apps/client/src/data/documents';
import {
  archiveReward,
  createReward,
  updateReward,
} from '../../../../apps/client/src/operations/rewards';
import { OWNER, ownerDb, useRulesTestEnvironment } from '../support/env';

useRulesTestEnvironment();

const input = { name: '  Ir al cine ', description: '  ', tier: 'large' as const, cost: 550 };

describe('rewards', () => {
  it('creates an active reward, trimming the text', async () => {
    const db = ownerDb();
    const { rewardId, write } = createReward(db, OWNER, input, 0);
    await write;

    expect((await getDoc(rewardRef(db, OWNER, rewardId))).data()).toEqual({
      id: rewardId,
      name: 'Ir al cine',
      description: null,
      icon: 'star',
      tier: 'large',
      cost: 550,
      status: 'active',
      sortOrder: 0,
    });
  });

  it('updates and archives a reward', async () => {
    const db = ownerDb();
    const { rewardId, write } = createReward(db, OWNER, input, 0);
    await write;

    await updateReward(db, OWNER, rewardId, { ...input, name: 'Cine con palomitas', cost: 600 });
    await archiveReward(db, OWNER, rewardId);

    expect((await getDoc(rewardRef(db, OWNER, rewardId))).data()).toMatchObject({
      name: 'Cine con palomitas',
      cost: 600,
      status: 'archived',
    });
  });
});
