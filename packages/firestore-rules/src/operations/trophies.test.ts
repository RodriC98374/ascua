// Trofeos (fase 21): marcar un canje como usado, con la operación real y las reglas reales.
import { initialGamificationState } from '@ascua/shared';
import { getDoc, getDocs } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { redemptionRef, redemptionsCollection } from '../../../../apps/client/src/data/documents';
import { redeemReward } from '../../../../apps/client/src/operations/spending';
import { markTrophyUsed } from '../../../../apps/client/src/operations/trophies';
import { OWNER, ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  ANIME,
  gamificationDoc,
  paths,
  rewardDoc,
  seedDocs,
  TODAY,
  YESTERDAY,
} from '../support/fixtures';

useRulesTestEnvironment();

async function redeemAnime() {
  await seedDocs({
    [paths.gamification()]: gamificationDoc({
      ...initialGamificationState(TODAY),
      lastClosedDateKey: YESTERDAY,
      pointsBalance: 500,
      lifetimePointsEarned: 500,
    }),
    [paths.reward(ANIME.id)]: rewardDoc(ANIME),
  });
  const db = ownerDb();
  await redeemReward(db, OWNER, { requestId: 'req-1', rewardId: ANIME.id, note: null }, TODAY);
  return db;
}

describe('markTrophyUsed', () => {
  it('reads a new redemption as not used yet', async () => {
    const db = await redeemAnime();

    const trophies = (await getDocs(redemptionsCollection(db, OWNER))).docs.map((d) => d.data());
    expect(trophies).toEqual([expect.objectContaining({ id: 'req-1', usedDateKey: null })]);
  });

  it('marks it as used today', async () => {
    const db = await redeemAnime();

    await markTrophyUsed(db, OWNER, 'req-1');

    const trophy = (await getDoc(redemptionRef(db, OWNER, 'req-1'))).data();
    expect(trophy).toMatchObject({ id: 'req-1', usedDateKey: TODAY, dateKey: TODAY });
    expect(trophy).not.toHaveProperty('usedAt');
    expect(trophy).not.toHaveProperty('redeemedAt');
  });

  it('cannot mark it a second time', async () => {
    const db = await redeemAnime();
    await markTrophyUsed(db, OWNER, 'req-1');

    await expect(markTrophyUsed(db, OWNER, 'req-1')).rejects.toMatchObject({
      code: 'permission-denied',
    });
  });
});
