import type { CheckInDimension } from '@ascua/shared';
import { assertFails } from '@firebase/rules-unit-testing';
import { getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { dailyLogRef } from '../../../../apps/client/src/data/documents';
import { setCheckIn, setHabitCompletion } from '../../../../apps/client/src/operations/daily-log';
import { OWNER, ownerDb, useRulesTestEnvironment } from '../support/env';
import { openLogDoc, paths, seedDocs, TODAY, YESTERDAY } from '../support/fixtures';

useRulesTestEnvironment();

describe('setHabitCompletion', () => {
  it("creates today's log with the first mark", async () => {
    const db = ownerDb();
    await setHabitCompletion(db, OWNER, {
      today: TODAY,
      habitId: 'reading',
      completed: true,
      logExists: false,
    });

    const log = await getDoc(dailyLogRef(db, OWNER, TODAY));
    expect(log.data()).toEqual({
      dateKey: TODAY,
      entries: { reading: { completed: true } },
      status: 'open',
      summary: null,
    });
  });

  it('marks and unmarks more habits on an existing log', async () => {
    const db = ownerDb();
    await setHabitCompletion(db, OWNER, {
      today: TODAY,
      habitId: 'reading',
      completed: true,
      logExists: false,
    });
    await setHabitCompletion(db, OWNER, {
      today: TODAY,
      habitId: 'water',
      completed: true,
      logExists: true,
    });
    await setHabitCompletion(db, OWNER, {
      today: TODAY,
      habitId: 'reading',
      completed: false,
      logExists: true,
    });

    const log = await getDoc(dailyLogRef(db, OWNER, TODAY));
    expect(log.data()?.entries).toEqual({
      reading: { completed: false },
      water: { completed: true },
    });
  });

  it('saves how much was done of a habit with a target', async () => {
    const db = ownerDb();
    await setHabitCompletion(db, OWNER, {
      today: TODAY,
      habitId: 'water',
      completed: false,
      count: 3,
      logExists: false,
    });
    await setHabitCompletion(db, OWNER, {
      today: TODAY,
      habitId: 'water',
      completed: true,
      count: 8,
      logExists: true,
    });

    const log = await getDoc(dailyLogRef(db, OWNER, TODAY));
    expect(log.data()?.entries).toEqual({ water: { completed: true, count: 8 } });
  });

  it('saves which steps were done of a habit with steps', async () => {
    const db = ownerDb();
    await setHabitCompletion(db, OWNER, {
      today: TODAY,
      habitId: 'night',
      completed: false,
      doneSteps: ['teeth'],
      logExists: false,
    });
    await setHabitCompletion(db, OWNER, {
      today: TODAY,
      habitId: 'night',
      completed: true,
      doneSteps: ['teeth', 'clothes'],
      logExists: true,
    });

    const log = await getDoc(dailyLogRef(db, OWNER, TODAY));
    expect(log.data()?.entries).toEqual({
      night: { completed: true, doneSteps: ['teeth', 'clothes'] },
    });
  });

  it('works with habit IDs that contain dots', async () => {
    const db = ownerDb();
    await seedDocs({ [paths.dailyLog(TODAY)]: openLogDoc(TODAY) });
    await setHabitCompletion(db, OWNER, {
      today: TODAY,
      habitId: 'a.b',
      completed: true,
      logExists: true,
    });

    const log = await getDoc(dailyLogRef(db, OWNER, TODAY));
    expect(log.data()?.entries).toEqual({ 'a.b': { completed: true } });
  });

  it('is rejected for yesterday, even if its log is still open', async () => {
    await seedDocs({ [paths.dailyLog(YESTERDAY)]: openLogDoc(YESTERDAY) });
    await assertFails(
      setHabitCompletion(ownerDb(), OWNER, {
        today: YESTERDAY,
        habitId: 'reading',
        completed: true,
        logExists: true,
      }),
    );
  });
});

describe('setCheckIn', () => {
  it("creates today's log with the first answer", async () => {
    const db = ownerDb();
    await setCheckIn(db, OWNER, { today: TODAY, dimension: 'mood', value: 4, logExists: false });

    const log = await getDoc(dailyLogRef(db, OWNER, TODAY));
    expect(log.data()).toEqual({
      dateKey: TODAY,
      entries: {},
      status: 'open',
      summary: null,
      checkIn: { mood: 4 },
    });
  });

  it('answers, changes and clears scales on an existing log, next to the marks', async () => {
    const db = ownerDb();
    await setHabitCompletion(db, OWNER, {
      today: TODAY,
      habitId: 'reading',
      completed: true,
      logExists: false,
    });
    const answer = (dimension: CheckInDimension, value: number | null) =>
      setCheckIn(db, OWNER, { today: TODAY, dimension, value, logExists: true });
    await answer('mood', 3);
    await answer('energy', 2);
    await answer('motivation', 5);
    await answer('mood', null);

    const log = await getDoc(dailyLogRef(db, OWNER, TODAY));
    expect(log.data()?.checkIn).toEqual({ energy: 2, motivation: 5 });
    expect(log.data()?.entries).toEqual({ reading: { completed: true } });
  });

  it('is rejected for yesterday, even if its log is still open', async () => {
    await seedDocs({ [paths.dailyLog(YESTERDAY)]: openLogDoc(YESTERDAY) });
    await assertFails(
      setCheckIn(ownerDb(), OWNER, {
        today: YESTERDAY,
        dimension: 'mood',
        value: 3,
        logExists: true,
      }),
    );
  });
});
