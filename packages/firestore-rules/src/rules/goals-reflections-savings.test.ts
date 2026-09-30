import {
  addDays,
  initialGamificationState,
  startOfWeek,
  type GamificationState,
  type Reward,
} from '@ascua/shared';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
} from 'firebase/firestore';
import { describe, it } from 'vitest';

import { otherDb, ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  ANIME,
  commit,
  goalDoc,
  paths,
  planFreeze,
  planRedeem,
  reflectionDoc,
  rewardDoc,
  savingsDoc,
  seedDocs,
  seedState,
  TODAY,
  TOMORROW,
  YESTERDAY,
  type Write,
} from '../support/fixtures';

useRulesTestEnvironment();

const touched = () => ({ updatedAt: serverTimestamp() });

// ---------- Metas ----------

describe('goals', () => {
  const goalPath = paths.goal('g1');

  it('creates an active goal that starts today', async () => {
    await assertSucceeds(setDoc(doc(ownerDb(), goalPath), goalDoc()));
  });

  it('accepts linked habits, tasks and a deadline', async () => {
    const data = goalDoc({ habitIds: ['read', 'run'], taskIds: ['t1'], targetDateKey: TOMORROW });
    await assertSucceeds(setDoc(doc(ownerDb(), goalPath), data));
  });

  it('rejects a goal that does not start today', async () => {
    await assertFails(setDoc(doc(ownerDb(), goalPath), goalDoc({ startDateKey: YESTERDAY })));
  });

  it('rejects creating it already achieved', async () => {
    const data = goalDoc({ status: 'achieved', achievedDateKey: TODAY });
    await assertFails(setDoc(doc(ownerDb(), goalPath), data));
  });

  it('rejects a title that is too short or too long', async () => {
    await assertFails(setDoc(doc(ownerDb(), goalPath), goalDoc({ title: 'A' })));
    await assertFails(setDoc(doc(ownerDb(), goalPath), goalDoc({ title: 'x'.repeat(61) })));
  });

  it('rejects more than 10 habits and repeated ids', async () => {
    const eleven = Array.from({ length: 11 }, (_, i) => `h${i}`);
    await assertFails(setDoc(doc(ownerDb(), goalPath), goalDoc({ habitIds: eleven })));
    await assertFails(setDoc(doc(ownerDb(), goalPath), goalDoc({ taskIds: ['t1', 't1'] })));
  });

  it('rejects more than 50 tasks', async () => {
    const many = Array.from({ length: 51 }, (_, i) => `t${i}`);
    await assertFails(setDoc(doc(ownerDb(), goalPath), goalDoc({ taskIds: many })));
  });

  it('rejects a deadline before the start', async () => {
    await assertFails(setDoc(doc(ownerDb(), goalPath), goalDoc({ targetDateKey: YESTERDAY })));
  });

  it('rejects unknown fields', async () => {
    await assertFails(setDoc(doc(ownerDb(), goalPath), goalDoc({ points: 50 })));
  });

  it('edits the goal and links more tasks', async () => {
    await seedDocs({ [goalPath]: goalDoc() });
    await assertSucceeds(
      updateDoc(doc(ownerDb(), goalPath), {
        title: 'Aprobar Física',
        taskIds: ['t1'],
        ...touched(),
      }),
    );
  });

  it('marks it achieved today and reopens it', async () => {
    await seedDocs({ [goalPath]: goalDoc() });
    await assertSucceeds(
      updateDoc(doc(ownerDb(), goalPath), {
        status: 'achieved',
        achievedDateKey: TODAY,
        ...touched(),
      }),
    );
    await assertSucceeds(
      updateDoc(doc(ownerDb(), goalPath), {
        status: 'active',
        achievedDateKey: null,
        ...touched(),
      }),
    );
  });

  it('rejects achieving it on another day', async () => {
    await seedDocs({ [goalPath]: goalDoc() });
    await assertFails(
      updateDoc(doc(ownerDb(), goalPath), {
        status: 'achieved',
        achievedDateKey: YESTERDAY,
        ...touched(),
      }),
    );
  });

  it('rejects an achieved day on a goal that is not achieved', async () => {
    await seedDocs({ [goalPath]: goalDoc() });
    await assertFails(
      updateDoc(doc(ownerDb(), goalPath), { achievedDateKey: TODAY, ...touched() }),
    );
  });

  it('keeps the achieved day while it stays achieved', async () => {
    await seedDocs({
      [goalPath]: goalDoc({
        status: 'achieved',
        achievedDateKey: YESTERDAY,
        startDateKey: YESTERDAY,
      }),
    });
    await assertSucceeds(updateDoc(doc(ownerDb(), goalPath), { title: 'Otro', ...touched() }));
    await assertFails(
      updateDoc(doc(ownerDb(), goalPath), { achievedDateKey: TODAY, ...touched() }),
    );
  });

  it('archives it', async () => {
    await seedDocs({ [goalPath]: goalDoc() });
    await assertSucceeds(updateDoc(doc(ownerDb(), goalPath), { status: 'archived', ...touched() }));
  });

  it('rejects moving the start day', async () => {
    await seedDocs({ [goalPath]: goalDoc() });
    await assertFails(
      updateDoc(doc(ownerDb(), goalPath), { startDateKey: YESTERDAY, ...touched() }),
    );
  });

  it('never deletes a goal', async () => {
    await seedDocs({ [goalPath]: goalDoc() });
    await assertFails(deleteDoc(doc(ownerDb(), goalPath)));
  });

  it('keeps goals private', async () => {
    await seedDocs({ [goalPath]: goalDoc() });
    await assertFails(getDoc(doc(otherDb(), goalPath)));
  });
});

// ---------- Reflexión semanal ----------

describe('weeklyReflections', () => {
  // La semana pasada ya terminó siempre; la de mañana todavía no, aunque hoy sea domingo.
  const lastWeek = addDays(startOfWeek(TODAY), -7);
  const unfinishedWeek = startOfWeek(TOMORROW);
  const lastWeekPath = paths.reflection(lastWeek);

  it('writes the reflection of a week that already ended', async () => {
    await assertSucceeds(setDoc(doc(ownerDb(), lastWeekPath), reflectionDoc(lastWeek)));
  });

  it('writes the reflection of an old week', async () => {
    const old = addDays(lastWeek, -70);
    await assertSucceeds(setDoc(doc(ownerDb(), paths.reflection(old)), reflectionDoc(old)));
  });

  it('rejects a week whose Sunday has not come', async () => {
    await assertFails(
      setDoc(doc(ownerDb(), paths.reflection(unfinishedWeek)), reflectionDoc(unfinishedWeek)),
    );
  });

  it('rejects a week that does not start on Monday', async () => {
    const tuesday = addDays(lastWeek, 1);
    await assertFails(setDoc(doc(ownerDb(), paths.reflection(tuesday)), reflectionDoc(tuesday)));
  });

  it('rejects a week that does not match its id', async () => {
    const data = reflectionDoc(addDays(lastWeek, -7));
    await assertFails(setDoc(doc(ownerDb(), lastWeekPath), data));
  });

  it('rejects a reflection with every answer empty', async () => {
    const data = reflectionDoc(lastWeek, { wentWell: '', wasHard: '', nextFocus: '' });
    await assertFails(setDoc(doc(ownerDb(), lastWeekPath), data));
  });

  it('rejects an answer longer than 500', async () => {
    const data = reflectionDoc(lastWeek, { wasHard: 'x'.repeat(501) });
    await assertFails(setDoc(doc(ownerDb(), lastWeekPath), data));
  });

  it('edits it later and never deletes it', async () => {
    await seedDocs({ [lastWeekPath]: reflectionDoc(lastWeek) });
    await assertSucceeds(
      updateDoc(doc(ownerDb(), lastWeekPath), { wasHard: 'Levantarme temprano', ...touched() }),
    );
    await assertFails(deleteDoc(doc(ownerDb(), lastWeekPath)));
  });

  it('rejects moving it to another week', async () => {
    await seedDocs({ [lastWeekPath]: reflectionDoc(lastWeek) });
    await assertFails(
      updateDoc(doc(ownerDb(), lastWeekPath), {
        weekStartDateKey: addDays(lastWeek, -7),
        ...touched(),
      }),
    );
  });
});

// ---------- Alcancía ----------

const TRIP: Reward = {
  id: 'trip',
  name: 'Viaje a Samaipata',
  tier: 'large',
  cost: 300,
  status: 'active',
};

function rich(overrides: Partial<GamificationState> = {}): GamificationState {
  return {
    ...initialGamificationState(TODAY),
    pointsBalance: 400,
    lifetimePointsEarned: 400,
    ...overrides,
  };
}

async function seedSavingsWorld(savings?: DocumentData, state: GamificationState = rich()) {
  await seedState(state);
  await seedDocs({
    [paths.reward(TRIP.id)]: rewardDoc(TRIP),
    [paths.reward(ANIME.id)]: rewardDoc(ANIME),
    ...(savings ? { [paths.savings()]: savings } : {}),
  });
}

const jar = (points: number, overrides: DocumentData = {}) =>
  savingsDoc({ rewardId: TRIP.id, points, startedDateKey: TODAY, ...overrides });

describe('meta/savings', () => {
  const savingsPath = paths.savings();

  it('starts a jar today with part of the balance', async () => {
    await seedSavingsWorld();
    await assertSucceeds(setDoc(doc(ownerDb(), savingsPath), jar(120)));
  });

  it('rejects a jar that did not start today', async () => {
    await seedSavingsWorld();
    await assertFails(setDoc(doc(ownerDb(), savingsPath), jar(120, { startedDateKey: YESTERDAY })));
  });

  it('rejects saving more than the reward costs', async () => {
    await seedSavingsWorld();
    await assertFails(setDoc(doc(ownerDb(), savingsPath), jar(301)));
  });

  it('rejects saving more than the balance', async () => {
    await seedSavingsWorld(undefined, rich({ pointsBalance: 100, lifetimePointsEarned: 100 }));
    await assertFails(setDoc(doc(ownerDb(), savingsPath), jar(120)));
  });

  it('rejects saving for an archived reward', async () => {
    await seedSavingsWorld();
    await seedDocs({ [paths.reward(TRIP.id)]: rewardDoc(TRIP, { status: 'archived' }) });
    await assertFails(setDoc(doc(ownerDb(), savingsPath), jar(120)));
  });

  it('adds more points to the same jar', async () => {
    await seedSavingsWorld(jar(120, { startedDateKey: YESTERDAY }));
    await assertSucceeds(updateDoc(doc(ownerDb(), savingsPath), { points: 200, ...touched() }));
  });

  it('rejects taking points out without emptying the jar', async () => {
    await seedSavingsWorld(jar(120));
    await assertFails(updateDoc(doc(ownerDb(), savingsPath), { points: 50, ...touched() }));
  });

  it('rejects switching to another reward without emptying it', async () => {
    await seedSavingsWorld(jar(50));
    await assertFails(updateDoc(doc(ownerDb(), savingsPath), { rewardId: ANIME.id, ...touched() }));
  });

  it('empties the jar at any time, even if the reward was archived', async () => {
    await seedSavingsWorld(jar(120));
    await seedDocs({ [paths.reward(TRIP.id)]: rewardDoc(TRIP, { status: 'archived' }) });
    await assertSucceeds(
      updateDoc(doc(ownerDb(), savingsPath), {
        rewardId: null,
        points: 0,
        startedDateKey: null,
        ...touched(),
      }),
    );
  });

  it('rejects points without a reward', async () => {
    await seedSavingsWorld();
    await assertFails(setDoc(doc(ownerDb(), savingsPath), savingsDoc({ points: 10 })));
  });

  it('starts a new jar after emptying the old one', async () => {
    await seedSavingsWorld(savingsDoc());
    await assertSucceeds(
      updateDoc(doc(ownerDb(), savingsPath), {
        rewardId: ANIME.id,
        points: 30,
        startedDateKey: TODAY,
        ...touched(),
      }),
    );
  });
});

describe('spending with a jar', () => {
  const emptyJar: Write = {
    kind: 'update',
    path: paths.savings(),
    data: { rewardId: null, points: 0, startedDateKey: null, ...touched() },
  };

  it('rejects a freeze that would eat into the saved points', async () => {
    await seedSavingsWorld(jar(300));
    await assertFails(commit(ownerDb(), planFreeze(rich(), 'req-1')));
  });

  it('allows a freeze paid with the free balance', async () => {
    await seedSavingsWorld(jar(250));
    await assertSucceeds(commit(ownerDb(), planFreeze(rich(), 'req-1')));
  });

  it('rejects redeeming another reward with the saved points', async () => {
    await seedSavingsWorld(jar(300, { rewardId: TRIP.id }), rich({ pointsBalance: 340 }));
    await assertFails(commit(ownerDb(), planRedeem(rich({ pointsBalance: 340 }), ANIME, 'req-2')));
  });

  it('redeems the saved reward and empties the jar in the same write', async () => {
    const state = rich({ pointsBalance: 300, lifetimePointsEarned: 300 });
    await seedSavingsWorld(jar(300), state);
    await assertSucceeds(commit(ownerDb(), [...planRedeem(state, TRIP, 'req-3'), emptyJar]));
  });

  it('rejects redeeming the saved reward while keeping the jar full', async () => {
    const state = rich({ pointsBalance: 300, lifetimePointsEarned: 300 });
    await seedSavingsWorld(jar(300), state);
    await assertFails(commit(ownerDb(), planRedeem(state, TRIP, 'req-3')));
  });
});
