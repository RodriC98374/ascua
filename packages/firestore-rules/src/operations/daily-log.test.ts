import { assertFails } from '@firebase/rules-unit-testing';
import { getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { dailyLogRef } from '../../../../apps/client/src/data/documents';
import { setHabitCompletion } from '../../../../apps/client/src/operations/daily-log';
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
