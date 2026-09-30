// Operaciones de la fase 18 (metas, reflexión y alcancía) contra el emulador y las reglas reales.
import {
  addDays,
  initialGamificationState,
  startOfWeek,
  type GamificationState,
  type Reward,
} from '@ascua/shared';
import { doc, getDoc, type Firestore } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  goalRef,
  savingsRef,
  taskRef,
  weeklyReflectionRef,
} from '../../../../apps/client/src/data/documents';
import {
  createGoal,
  createGoalTask,
  setGoalStatus,
  unlinkGoalTask,
  updateGoal,
} from '../../../../apps/client/src/operations/goals';
import { saveReflection } from '../../../../apps/client/src/operations/reflections';
import {
  cancelSavings,
  depositSavings,
  SavingsNotAllowedError,
} from '../../../../apps/client/src/operations/savings';
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
  TOMORROW,
  YESTERDAY,
} from '../support/fixtures';

useRulesTestEnvironment();

async function read(db: Firestore, path: string) {
  return (await getDoc(doc(db, path))).data();
}

describe('goal operations', () => {
  const input = {
    title: '  Aprobar Cálculo ',
    description: '  ',
    targetDateKey: TOMORROW,
    habitIds: ['read', 'read', 'run'],
  };

  it('creates an active goal that starts today, with clean text and no repeated habits', async () => {
    const db = ownerDb();
    const { goalId, write } = createGoal(db, OWNER, input, 2, TODAY);
    await write;
    expect((await getDoc(goalRef(db, OWNER, goalId))).data()).toEqual({
      id: goalId,
      title: 'Aprobar Cálculo',
      description: null,
      targetDateKey: TOMORROW,
      habitIds: ['read', 'run'],
      taskIds: [],
      status: 'active',
      startDateKey: TODAY,
      achievedDateKey: null,
      sortOrder: 2,
    });
  });

  it('edits it, adds and removes a task, and achieves it', async () => {
    const db = ownerDb();
    const { goalId, write } = createGoal(db, OWNER, input, 0, TODAY);
    await write;
    await updateGoal(db, OWNER, goalId, { ...input, title: 'Aprobar Física', habitIds: [] });

    const task = createGoalTask(db, OWNER, goalId, {
      title: ' Resolver la práctica 3 ',
      size: 'large',
      dueDateKey: TOMORROW,
    });
    await task.write;
    expect((await getDoc(taskRef(db, OWNER, task.taskId))).data()).toMatchObject({
      title: 'Resolver la práctica 3',
      size: 'large',
      completedDateKey: null,
    });
    expect((await getDoc(goalRef(db, OWNER, goalId))).data()).toMatchObject({
      title: 'Aprobar Física',
      habitIds: [],
      taskIds: [task.taskId],
    });

    await unlinkGoalTask(db, OWNER, goalId, task.taskId);
    await setGoalStatus(db, OWNER, goalId, 'achieved', TODAY);
    expect((await getDoc(goalRef(db, OWNER, goalId))).data()).toMatchObject({
      taskIds: [],
      status: 'achieved',
      achievedDateKey: TODAY,
    });

    await setGoalStatus(db, OWNER, goalId, 'archived', TODAY);
    expect((await getDoc(goalRef(db, OWNER, goalId))).data()).toMatchObject({
      status: 'archived',
      achievedDateKey: null,
    });
  });
});

describe('saveReflection', () => {
  const lastWeek = addDays(startOfWeek(TODAY), -7);

  it('creates the reflection of the week and edits it later', async () => {
    const db = ownerDb();
    const answers = { wentWell: ' Leí todos los días ', wasHard: '', nextFocus: 'Correr' };
    await saveReflection(db, OWNER, lastWeek, answers, false);
    await saveReflection(db, OWNER, lastWeek, { ...answers, wasHard: 'Madrugar' }, true);
    expect((await getDoc(weeklyReflectionRef(db, OWNER, lastWeek))).data()).toEqual({
      weekStartDateKey: lastWeek,
      wentWell: 'Leí todos los días',
      wasHard: 'Madrugar',
      nextFocus: 'Correr',
    });
  });
});

const TRIP: Reward = {
  id: 'trip',
  name: 'Viaje a Samaipata',
  tier: 'large',
  cost: 300,
  status: 'active',
};

function withBalance(pointsBalance: number): GamificationState {
  return {
    ...initialGamificationState(TODAY),
    lastClosedDateKey: YESTERDAY,
    pointsBalance,
    lifetimePointsEarned: pointsBalance,
  };
}

async function seedWorld(balance: number) {
  await seedDocs({
    [paths.gamification()]: gamificationDoc(withBalance(balance)),
    [paths.reward(TRIP.id)]: rewardDoc(TRIP),
    [paths.reward(ANIME.id)]: rewardDoc(ANIME),
  });
}

async function jar(db: Firestore) {
  return (await getDoc(savingsRef(db, OWNER))).data();
}

describe('savings operations', () => {
  it('starts a jar today and adds to it', async () => {
    await seedWorld(400);
    const db = ownerDb();
    await depositSavings(db, OWNER, { rewardId: TRIP.id, amount: 100 }, TODAY);
    await depositSavings(db, OWNER, { rewardId: TRIP.id, amount: 50 }, TODAY);
    expect(await jar(db)).toEqual({ rewardId: TRIP.id, points: 150, startedDateKey: TODAY });
  });

  it('refuses more than the reward still needs or the free balance', async () => {
    await seedWorld(400);
    const db = ownerDb();
    await depositSavings(db, OWNER, { rewardId: TRIP.id, amount: 250 }, TODAY);
    await expect(
      depositSavings(db, OWNER, { rewardId: TRIP.id, amount: 60 }, TODAY),
    ).rejects.toMatchObject({ reason: 'over_limit', maxDeposit: 50 });
  });

  it('refuses saving for another reward while a jar is running', async () => {
    await seedWorld(400);
    const db = ownerDb();
    await depositSavings(db, OWNER, { rewardId: TRIP.id, amount: 10 }, TODAY);
    await expect(
      depositSavings(db, OWNER, { rewardId: ANIME.id, amount: 10 }, TODAY),
    ).rejects.toBeInstanceOf(SavingsNotAllowedError);
  });

  it('cancels the jar and frees the points for a freeze', async () => {
    await seedWorld(300);
    const db = ownerDb();
    await depositSavings(db, OWNER, { rewardId: TRIP.id, amount: 200 }, TODAY);
    await expect(purchaseStreakFreeze(db, OWNER, 'req-1', TODAY)).rejects.toBeInstanceOf(
      SpendNotAllowedError,
    );
    await cancelSavings(db, OWNER);
    await expect(purchaseStreakFreeze(db, OWNER, 'req-1', TODAY)).resolves.toBe('done');
  });

  it('refuses redeeming another reward with the saved points', async () => {
    await seedWorld(320);
    const db = ownerDb();
    await depositSavings(db, OWNER, { rewardId: TRIP.id, amount: 300 }, TODAY);
    await expect(
      redeemReward(db, OWNER, { requestId: 'req-2', rewardId: ANIME.id, note: null }, TODAY),
    ).rejects.toBeInstanceOf(SpendNotAllowedError);
  });

  it('redeems the saved reward and empties the jar', async () => {
    await seedWorld(320);
    const db = ownerDb();
    await depositSavings(db, OWNER, { rewardId: TRIP.id, amount: 300 }, TODAY);
    await expect(
      redeemReward(db, OWNER, { requestId: 'req-3', rewardId: TRIP.id, note: null }, TODAY),
    ).resolves.toBe('done');
    expect(await jar(db)).toEqual({ rewardId: null, points: 0, startedDateKey: null });
    expect(await read(db, paths.gamification())).toMatchObject({ pointsBalance: 20 });
  });
});
