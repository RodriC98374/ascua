// Las operaciones reales de gasto contra el emulador y las reglas reales.
import {
  initialGamificationState,
  MAX_STREAK_FREEZES,
  STREAK_FREEZE_COST,
  toMonthKey,
  type GamificationState,
} from '@ascua/shared';
import { collection, doc, getDoc, getDocs, type Firestore } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  purchaseStreakFreeze,
  redeemReward,
  SpendNotAllowedError,
} from '../../../../apps/client/src/operations/spending';
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

function withBalance(pointsBalance: number, overrides: Partial<GamificationState> = {}) {
  return {
    ...initialGamificationState(TODAY),
    lastClosedDateKey: YESTERDAY,
    pointsBalance,
    lifetimePointsEarned: pointsBalance,
    ...overrides,
  };
}

async function seed(state: GamificationState, rewards = [ANIME]) {
  await seedDocs({
    [paths.gamification()]: gamificationDoc(state),
    ...Object.fromEntries(rewards.map((reward) => [paths.reward(reward.id), rewardDoc(reward)])),
  });
}

async function read(db: Firestore, path: string) {
  return (await getDoc(doc(db, path))).data();
}

async function movementCount(db: Firestore) {
  return (await getDocs(collection(db, `users/${OWNER}/pointTransactions`))).size;
}

const monthPath = paths.monthlySummary(toMonthKey(TODAY));

describe('purchaseStreakFreeze', () => {
  it('charges the cost, adds a freeze and records the movement and the monthly spend', async () => {
    await seed(withBalance(200));
    const db = ownerDb();

    await expect(purchaseStreakFreeze(db, OWNER, 'req-1', TODAY)).resolves.toBe('done');

    expect(await read(db, paths.gamification())).toMatchObject({
      pointsBalance: 200 - STREAK_FREEZE_COST,
      lifetimePointsSpent: STREAK_FREEZE_COST,
      streakFreezesAvailable: 1,
      lastSpendTransactionId: 'freeze_req-1',
    });
    expect(await read(db, paths.transaction('freeze_req-1'))).toMatchObject({
      type: 'streak_freeze_purchase',
      amount: -STREAK_FREEZE_COST,
      balanceAfter: 200 - STREAK_FREEZE_COST,
      dateKey: TODAY,
    });
    expect(await read(db, monthPath)).toMatchObject({ pointsSpent: STREAK_FREEZE_COST });
  });

  it('refuses without enough points and says how many are missing', async () => {
    await seed(withBalance(100));
    const db = ownerDb();

    const attempt = purchaseStreakFreeze(db, OWNER, 'req-1', TODAY);
    await expect(attempt).rejects.toBeInstanceOf(SpendNotAllowedError);
    await expect(attempt).rejects.toMatchObject({
      check: { reason: 'insufficient_points', missingPoints: 50 },
    });
    expect(await movementCount(db)).toBe(0);
  });

  it('refuses when the maximum of freezes is reached', async () => {
    await seed(withBalance(500, { streakFreezesAvailable: MAX_STREAK_FREEZES }));

    await expect(purchaseStreakFreeze(ownerDb(), OWNER, 'req-1', TODAY)).rejects.toMatchObject({
      check: { reason: 'max_freezes_reached' },
    });
  });

  it('charges once when the same request is retried', async () => {
    await seed(withBalance(400));
    const db = ownerDb();

    await expect(purchaseStreakFreeze(db, OWNER, 'req-1', TODAY)).resolves.toBe('done');
    await expect(purchaseStreakFreeze(db, OWNER, 'req-1', TODAY)).resolves.toBe('already_done');

    expect(await read(db, paths.gamification())).toMatchObject({
      pointsBalance: 400 - STREAK_FREEZE_COST,
      streakFreezesAvailable: 1,
    });
    expect(await movementCount(db)).toBe(1);
  });

  it('charges once on a double tap (same request at the same time)', async () => {
    await seed(withBalance(400));

    const results = await Promise.allSettled([
      purchaseStreakFreeze(ownerDb(), OWNER, 'req-1', TODAY),
      purchaseStreakFreeze(ownerDb(), OWNER, 'req-1', TODAY),
    ]);

    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);
    const db = ownerDb();
    expect(await read(db, paths.gamification())).toMatchObject({
      pointsBalance: 400 - STREAK_FREEZE_COST,
    });
    expect(await movementCount(db)).toBe(1);
  });
});

describe('redeemReward', () => {
  it('charges the reward and saves the redemption with a snapshot and the note', async () => {
    await seed(withBalance(620));
    const db = ownerDb();

    await expect(
      redeemReward(
        db,
        OWNER,
        { requestId: 'req-1', rewardId: ANIME.id, note: '  Con amigos ' },
        TODAY,
      ),
    ).resolves.toBe('done');

    expect(await read(db, paths.gamification())).toMatchObject({
      pointsBalance: 620 - ANIME.cost,
      lifetimePointsSpent: ANIME.cost,
      lastSpendTransactionId: 'redemption_req-1',
    });
    expect(await read(db, paths.redemption('req-1'))).toMatchObject({
      rewardId: ANIME.id,
      rewardSnapshot: { name: ANIME.name, tier: ANIME.tier, cost: ANIME.cost },
      pointTransactionId: 'redemption_req-1',
      dateKey: TODAY,
      note: 'Con amigos',
    });
    expect(await read(db, paths.transaction('redemption_req-1'))).toMatchObject({
      type: 'reward_redemption',
      amount: -ANIME.cost,
    });
    expect(await read(db, monthPath)).toMatchObject({ pointsSpent: ANIME.cost });
  });

  it('refuses without enough points', async () => {
    await seed(withBalance(20));

    await expect(
      redeemReward(ownerDb(), OWNER, { requestId: 'req-1', rewardId: ANIME.id, note: null }, TODAY),
    ).rejects.toMatchObject({ check: { reason: 'insufficient_points', missingPoints: 40 } });
  });

  it('refuses an archived reward', async () => {
    await seed(withBalance(620), [{ ...ANIME, status: 'archived' }]);

    await expect(
      redeemReward(ownerDb(), OWNER, { requestId: 'req-1', rewardId: ANIME.id, note: null }, TODAY),
    ).rejects.toMatchObject({ check: { reason: 'reward_archived' } });
  });

  it('charges once when the same request is retried, and again for a new request', async () => {
    await seed(withBalance(620));
    const db = ownerDb();
    const redeem = (requestId: string) =>
      redeemReward(db, OWNER, { requestId, rewardId: ANIME.id, note: null }, TODAY);

    await expect(redeem('req-1')).resolves.toBe('done');
    await expect(redeem('req-1')).resolves.toBe('already_done');
    await expect(redeem('req-2')).resolves.toBe('done');

    expect(await read(db, paths.gamification())).toMatchObject({
      pointsBalance: 620 - 2 * ANIME.cost,
    });
    expect(await movementCount(db)).toBe(2);
  });

  it('charges once on a double tap', async () => {
    await seed(withBalance(620));
    const redeem = () =>
      redeemReward(ownerDb(), OWNER, { requestId: 'req-1', rewardId: ANIME.id, note: null }, TODAY);

    const results = await Promise.allSettled([redeem(), redeem()]);

    expect(results.map((result) => result.status)).toEqual(['fulfilled', 'fulfilled']);
    expect(await read(ownerDb(), paths.gamification())).toMatchObject({
      pointsBalance: 620 - ANIME.cost,
    });
  });
});
