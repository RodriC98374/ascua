import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { EMPTY_MONTHLY_COUNTERS, initialGamificationState, toMonthKey } from '@ascua/shared';
import { deleteField, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';

import { ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  commit,
  created,
  done,
  monthlyDoc,
  openLogDoc,
  paths,
  pendingState,
  planClose,
  planFreeze,
  seedBeforeClose,
  seedDocs,
  seedState,
  tamper,
  testHabit,
  TODAY,
  YESTERDAY,
} from '../support/fixtures';

useRulesTestEnvironment();

const log = (dateKey: string) => doc(ownerDb(), paths.dailyLog(dateKey));
const answer = (patch: Record<string, unknown>) => {
  const fields = Object.fromEntries(
    Object.entries(patch).map(([dimension, value]) => [`checkIn.${dimension}`, value]),
  );
  return { ...fields, updatedAt: serverTimestamp() };
};

const READING = testHabit('reading', 'primary');
/** Con saldo para comprar un protector y sin días pendientes (como en spend.test.ts). */
const RICH = { ...initialGamificationState(TODAY), pointsBalance: 400, lifetimePointsEarned: 400 };

describe('check-in in dailyLogs', () => {
  it("creates today's log with only a check-in", async () => {
    await assertSucceeds(setDoc(log(TODAY), { ...openLogDoc(TODAY), checkIn: { mood: 4 } }));
  });

  it('sets, changes and clears each scale on today’s log', async () => {
    await seedDocs({ [paths.dailyLog(TODAY)]: openLogDoc(TODAY) });
    await assertSucceeds(updateDoc(log(TODAY), answer({ mood: 3, energy: 1, motivation: 5 })));
    await assertSucceeds(updateDoc(log(TODAY), answer({ mood: 5 })));
    await assertSucceeds(updateDoc(log(TODAY), answer({ mood: deleteField() })));
  });

  it('rejects values outside 1 to 5 or that are not whole numbers', async () => {
    await seedDocs({ [paths.dailyLog(TODAY)]: openLogDoc(TODAY) });
    for (const value of [0, 6, 2.5, '3', null]) {
      await assertFails(updateDoc(log(TODAY), answer({ mood: value })));
    }
    await assertFails(setDoc(log(TODAY), { ...openLogDoc(TODAY), checkIn: { mood: 9 } }));
  });

  it('rejects unknown scales and a check-in that is not a map', async () => {
    await seedDocs({ [paths.dailyLog(TODAY)]: openLogDoc(TODAY) });
    await assertFails(updateDoc(log(TODAY), answer({ focus: 3 })));
    await assertFails(updateDoc(log(TODAY), { checkIn: 4, updatedAt: serverTimestamp() }));
    await assertFails(setDoc(log(TODAY), { ...openLogDoc(TODAY), checkIn: 'bien' }));
  });

  it("rejects changing yesterday's check-in, even while its log is still open", async () => {
    await seedDocs({ [paths.dailyLog(YESTERDAY)]: openLogDoc(YESTERDAY) });
    await assertFails(updateDoc(log(YESTERDAY), answer({ mood: 3 })));
  });

  it('keeps the check-in when closing the day, and does not let the close change it', async () => {
    const input = { state: pendingState(), habits: [READING], checkIn: { mood: 2 } };
    await seedBeforeClose(input);
    const { writes } = planClose(input);
    const logPath = paths.dailyLog(YESTERDAY);
    await assertFails(commit(ownerDb(), tamper(writes, logPath, { checkIn: { mood: 5 } })));
    await assertSucceeds(commit(ownerDb(), writes));
  });

  it('creates a past day without activity with no check-in', async () => {
    const input = { state: pendingState(), habits: [READING], logExists: false };
    await seedBeforeClose(input);
    const { writes } = planClose(input);
    const logPath = paths.dailyLog(YESTERDAY);
    await assertFails(commit(ownerDb(), tamper(writes, logPath, { checkIn: { mood: 3 } })));
  });
});

describe('checkInStats in monthlySummaries', () => {
  const monthPath = paths.monthlySummary(toMonthKey(YESTERDAY));

  it("adds the day's check-in to the month when closing", async () => {
    const input = {
      state: pendingState(),
      habits: [READING],
      entries: done('reading'),
      checkIn: { mood: 4, motivation: 2 },
    };
    await seedBeforeClose(input);
    await assertSucceeds(commit(ownerDb(), planClose(input).writes));
  });

  it('accepts a month saved before the check-in existed, without checkInStats', async () => {
    const { checkInStats: _checkInStats, ...legacy } = EMPTY_MONTHLY_COUNTERS;
    const withoutMonth = { state: pendingState(), habits: [READING] };
    const input = { ...withoutMonth, monthly: EMPTY_MONTHLY_COUNTERS };
    await seedBeforeClose(withoutMonth);
    await seedDocs({ [monthPath]: { monthKey: toMonthKey(YESTERDAY), ...legacy, ...created() } });
    await assertSucceeds(commit(ownerDb(), planClose(input).writes));
  });

  it('rejects checkInStats with unknown scales or the wrong shape', async () => {
    const input = { state: pendingState(), habits: [READING], checkIn: { mood: 4 } };
    await seedBeforeClose(input);
    const { writes } = planClose(input);
    for (const checkInStats of [
      { focus: { days: 1, total: 3 } },
      { mood: { days: 1 } },
      { mood: { days: 1, total: 9 } },
      { mood: { days: -1, total: 0 } },
      'bien',
    ]) {
      await assertFails(commit(ownerDb(), tamper(writes, monthPath, { checkInStats })));
    }
  });

  it('leaves checkInStats as they were when spending', async () => {
    const monthly = { ...EMPTY_MONTHLY_COUNTERS, checkInStats: { mood: { days: 2, total: 7 } } };
    const state = RICH;
    await seedState(state);
    const todayMonth = paths.monthlySummary(toMonthKey(TODAY));
    await seedDocs({ [todayMonth]: monthlyDoc(toMonthKey(TODAY), monthly) });
    const writes = planFreeze(state, 'freeze-1', monthly);
    await assertFails(
      commit(ownerDb(), tamper(writes, todayMonth, { checkInStats: { mood: { days: 3, total: 9 } } })),
    );
    await assertSucceeds(commit(ownerDb(), writes));
  });

  it('spends on a month saved before the check-in existed', async () => {
    const { checkInStats: _checkInStats, ...legacy } = EMPTY_MONTHLY_COUNTERS;
    const state = RICH;
    await seedState(state);
    const todayMonth = paths.monthlySummary(toMonthKey(TODAY));
    await seedDocs({ [todayMonth]: { monthKey: toMonthKey(TODAY), ...legacy, ...created() } });
    await assertSucceeds(commit(ownerDb(), planFreeze(state, 'freeze-1', EMPTY_MONTHLY_COUNTERS)));
  });
});
