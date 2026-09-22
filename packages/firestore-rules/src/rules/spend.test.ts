import { initialGamificationState, toMonthKey, type GamificationState } from '@ascua/shared';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { describe, it } from 'vitest';

import { ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  ANIME,
  commit,
  EMPTY_MONTH,
  monthlyDoc,
  paths,
  planFreeze,
  planRedeem,
  rewardDoc,
  seedDocs,
  seedState,
  tamper,
  TODAY,
  without,
} from '../support/fixtures';

useRulesTestEnvironment();

function rich(overrides: Partial<GamificationState> = {}): GamificationState {
  return {
    ...initialGamificationState(TODAY),
    pointsBalance: 400,
    lifetimePointsEarned: 400,
    ...overrides,
  };
}

const gamificationPath = paths.gamification();
const monthPath = paths.monthlySummary(toMonthKey(TODAY));
const freezePath = (requestId: string) => paths.transaction(`freeze_${requestId}`);
const redemptionTxPath = (requestId: string) => paths.transaction(`redemption_${requestId}`);

describe('purchaseStreakFreeze', () => {
  it('charges exactly 150 and adds one freeze', async () => {
    await seedState(rich());
    await assertSucceeds(commit(ownerDb(), planFreeze(rich(), 'req-1')));
  });

  it('updates an existing monthly summary', async () => {
    const monthly = { ...EMPTY_MONTH, closedDays: 3, pointsEarned: 60, pointsSpent: 10 };
    await seedState(rich());
    await seedDocs({ [monthPath]: monthlyDoc(toMonthKey(TODAY), monthly) });
    await assertSucceeds(commit(ownerDb(), planFreeze(rich(), 'req-1', monthly)));
  });

  it('rejects buying with 2 freezes already', async () => {
    const full = rich({ streakFreezesAvailable: 1 });
    const writes = planFreeze(full, 'req-1');
    await seedState({ ...full, streakFreezesAvailable: 2 });
    await assertFails(
      commit(ownerDb(), tamper(writes, gamificationPath, { streakFreezesAvailable: 3 })),
    );
  });

  it('rejects buying without enough points', async () => {
    const writes = planFreeze(rich(), 'req-1');
    await seedState(rich({ pointsBalance: 100, lifetimePointsEarned: 100 }));
    await assertFails(commit(ownerDb(), writes));
  });

  it('rejects an amount other than -150', async () => {
    await seedState(rich());
    const writes = tamper(
      tamper(planFreeze(rich(), 'req-1'), freezePath('req-1'), { amount: -100, balanceAfter: 300 }),
      gamificationPath,
      { pointsBalance: 300, lifetimePointsSpent: 100 },
    );
    await assertFails(commit(ownerDb(), tamper(writes, monthPath, { pointsSpent: 100 })));
  });

  it('rejects reusing the same requestId', async () => {
    await seedState(rich());
    await assertSucceeds(commit(ownerDb(), planFreeze(rich(), 'req-1')));
    const afterFirst = rich({
      pointsBalance: 250,
      lifetimePointsSpent: 150,
      streakFreezesAvailable: 1,
      lastSpendTransactionId: 'freeze_req-1',
    });
    await assertFails(
      commit(ownerDb(), planFreeze(afterFirst, 'req-1', { ...EMPTY_MONTH, pointsSpent: 150 })),
    );
  });

  it('rejects charging the balance without recording the transaction', async () => {
    await seedState(rich());
    await assertFails(commit(ownerDb(), without(planFreeze(rich(), 'req-1'), freezePath('req-1'))));
  });

  it('rejects a transaction without charging the balance', async () => {
    await seedState(rich());
    await assertFails(commit(ownerDb(), without(planFreeze(rich(), 'req-1'), gamificationPath)));
  });
});

describe('redeemReward', () => {
  async function seedReward(overrides = {}) {
    await seedDocs({ [paths.reward(ANIME.id)]: rewardDoc(ANIME, overrides) });
  }

  it('charges exactly the reward cost and records the redemption', async () => {
    await seedState(rich());
    await seedReward();
    await assertSucceeds(commit(ownerDb(), planRedeem(rich(), ANIME, 'req-2')));
  });

  it('rejects an archived reward', async () => {
    await seedState(rich());
    await seedReward({ status: 'archived' });
    await assertFails(commit(ownerDb(), planRedeem(rich(), ANIME, 'req-2')));
  });

  it('rejects redeeming without enough points', async () => {
    const writes = planRedeem(rich(), ANIME, 'req-2');
    await seedState(rich({ pointsBalance: 50, lifetimePointsEarned: 50 }));
    await seedReward();
    await assertFails(commit(ownerDb(), writes));
  });

  it('rejects an amount different from the reward cost', async () => {
    await seedState(rich());
    await seedReward({ cost: 80 });
    await assertFails(commit(ownerDb(), planRedeem(rich(), ANIME, 'req-2')));
  });

  it('rejects a snapshot that does not match the reward', async () => {
    await seedState(rich());
    await seedReward();
    const writes = planRedeem(rich(), ANIME, 'req-2');
    await assertFails(
      commit(
        ownerDb(),
        tamper(writes, paths.redemption('req-2'), {
          rewardSnapshot: { name: 'Otra cosa', tier: 'small', cost: 60 },
        }),
      ),
    );
  });

  it('rejects reusing the same requestId', async () => {
    await seedState(rich());
    await seedReward();
    await assertSucceeds(commit(ownerDb(), planRedeem(rich(), ANIME, 'req-2')));
    const afterFirst = rich({
      pointsBalance: 340,
      lifetimePointsSpent: 60,
      lastSpendTransactionId: 'redemption_req-2',
    });
    await assertFails(
      commit(
        ownerDb(),
        planRedeem(afterFirst, ANIME, 'req-2', { ...EMPTY_MONTH, pointsSpent: 60 }),
      ),
    );
  });

  it('rejects a redemption without its charge', async () => {
    await seedState(rich());
    await seedReward();
    const writes = planRedeem(rich(), ANIME, 'req-2');
    await assertFails(commit(ownerDb(), without(writes, redemptionTxPath('req-2'))));
  });

  it('rejects a charge without its redemption', async () => {
    await seedState(rich());
    await seedReward();
    const writes = planRedeem(rich(), ANIME, 'req-2');
    await assertFails(commit(ownerDb(), without(writes, paths.redemption('req-2'))));
  });
});
