import { addDays, toMonthKey, transactionIds } from '@ascua/shared';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { serverTimestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  commit,
  created,
  done,
  EMPTY_MONTH,
  gamificationDoc,
  openLogDoc,
  paths,
  pendingState,
  planClose,
  seedBeforeClose,
  seedDocs,
  tamper,
  testHabit,
  TODAY,
  without,
  YESTERDAY,
  type CloseInput,
} from '../support/fixtures';

useRulesTestEnvironment();

const READING = testHabit('reading', 'primary');
const WATER = testHabit('water', 'secondary');

/** Día perfecto con un principal y un secundario, con racha activa. */
function perfectDay(): CloseInput {
  return {
    state: pendingState({
      pointsBalance: 100,
      lifetimePointsEarned: 100,
      currentStreak: 2,
      longestStreak: 4,
      currentStreakStartDateKey: addDays(YESTERDAY, -2),
      daysWithoutFreeze: 2,
    }),
    habits: [READING, WATER],
    entries: done('reading', 'water'),
  };
}

async function prepared(input: CloseInput) {
  await seedBeforeClose(input);
  return planClose(input);
}

const gamificationPath = paths.gamification();
const yesterdayLog = paths.dailyLog(YESTERDAY);
const yesterdayMonth = paths.monthlySummary(toMonthKey(YESTERDAY));

describe('closePendingDays: allowed', () => {
  it('closes yesterday with completions and the perfect day bonus', async () => {
    const { evaluation, writes } = await prepared(perfectDay());
    expect(evaluation.status).toBe('completed');
    expect(evaluation.transactions.map((t) => t.type)).toEqual([
      'habit_completion',
      'habit_completion',
      'perfect_day_bonus',
    ]);
    await assertSucceeds(commit(ownerDb(), writes));
  });

  it('closes a day without activity, creating its log (missed)', async () => {
    const input: CloseInput = { state: pendingState(), habits: [READING], logExists: false };
    const { evaluation, writes } = await prepared(input);
    expect(evaluation.status).toBe('missed');
    await assertSucceeds(commit(ownerDb(), writes));
  });

  it('closes a day saved by a freeze', async () => {
    const input: CloseInput = {
      state: pendingState({
        currentStreak: 3,
        longestStreak: 3,
        currentStreakStartDateKey: addDays(YESTERDAY, -3),
        daysWithoutFreeze: 3,
        streakFreezesAvailable: 1,
      }),
      habits: [READING],
    };
    const { evaluation, writes } = await prepared(input);
    expect(evaluation.status).toBe('frozen');
    await assertSucceeds(commit(ownerDb(), writes));
  });

  it('closes a day without scheduled habits (inactive)', async () => {
    const input: CloseInput = { state: pendingState(), habits: [], logExists: false };
    const { evaluation, writes } = await prepared(input);
    expect(evaluation.status).toBe('inactive');
    await assertSucceeds(commit(ownerDb(), writes));
  });

  it('updates an existing monthly summary', async () => {
    const monthly = {
      ...EMPTY_MONTH,
      closedDays: 5,
      completedDays: 4,
      missedDays: 1,
      pointsEarned: 90,
    };
    const { writes } = await prepared({ ...perfectDay(), monthly });
    await assertSucceeds(commit(ownerDb(), writes));
  });

  it('fits the rules access limit in the largest close (10 habits, both streak bonuses)', async () => {
    const habits = Array.from({ length: 10 }, (_, i) =>
      testHabit(`h${i}`, i < 3 ? 'primary' : 'secondary'),
    );
    const input: CloseInput = {
      state: pendingState({
        pointsBalance: 5000,
        lifetimePointsEarned: 9000,
        lifetimePointsSpent: 4000,
        currentStreak: 209,
        longestStreak: 209,
        currentStreakStartDateKey: addDays(YESTERDAY, -209),
        daysWithoutFreeze: 209,
      }),
      habits,
      entries: done(...habits.map((habit) => habit.id)),
      monthly: { ...EMPTY_MONTH, closedDays: 20, completedDays: 20, pointsEarned: 900 },
    };
    const { evaluation, writes } = await prepared(input);
    expect(evaluation.transactions).toHaveLength(13);
    await assertSucceeds(commit(ownerDb(), writes));
  });
});

describe('closePendingDays: denied', () => {
  it('rejects closing today', async () => {
    const input: CloseInput = {
      ...perfectDay(),
      state: { ...perfectDay().state, lastClosedDateKey: YESTERDAY },
    };
    const { evaluation, writes } = await prepared(input);
    expect(evaluation.dateKey).toBe(TODAY);
    await assertFails(commit(ownerDb(), writes));
  });

  it('rejects skipping a pending day', async () => {
    const { writes } = planClose(perfectDay());
    const threeDaysAgo = addDays(TODAY, -3);
    await seedDocs({
      [gamificationPath]: gamificationDoc({
        ...perfectDay().state,
        lastClosedDateKey: threeDaysAgo,
      }),
      [yesterdayLog]: openLogDoc(YESTERDAY, done('reading', 'water')),
    });
    await assertFails(commit(ownerDb(), writes));
  });

  it('rejects closing the same day twice', async () => {
    const { writes } = await prepared(perfectDay());
    await assertSucceeds(commit(ownerDb(), writes));
    await assertFails(commit(ownerDb(), writes));
  });

  it('rejects a completion whose amount is not a habit value', async () => {
    const { writes } = await prepared(perfectDay());
    const path = paths.transaction(transactionIds.habitCompletion(YESTERDAY, 'reading'));
    await assertFails(commit(ownerDb(), tamper(writes, path, { amount: 15 })));
  });

  it('rejects a completion for a habit not completed that day', async () => {
    const input: CloseInput = { ...perfectDay(), entries: done('reading') };
    const { writes } = await prepared(input);
    const id = transactionIds.habitCompletion(YESTERDAY, 'water');
    const extra = {
      kind: 'set' as const,
      path: paths.transaction(id),
      data: {
        type: 'habit_completion',
        amount: 5,
        // Dentro del saldo final (110): así solo puede fallar por el hábito no cumplido.
        balanceAfter: 110,
        dateKey: YESTERDAY,
        sourceType: 'habit',
        sourceId: 'water',
        description: 'Hábito cumplido: Hábito water',
        ...created(),
      },
    };
    await assertFails(commit(ownerDb(), [...writes, extra]));
  });

  it('rejects a streak bonus when the streak is not a multiple of its days', async () => {
    const { writes } = await prepared(perfectDay());
    const bonus = {
      kind: 'set' as const,
      path: paths.transaction(transactionIds.streakBonus(7, YESTERDAY)),
      data: {
        type: 'streak_bonus_7_days',
        amount: 20,
        // Dentro del saldo final (120): así solo puede fallar por no ser múltiplo de 7.
        balanceAfter: 120,
        dateKey: YESTERDAY,
        sourceType: 'daily_log',
        sourceId: YESTERDAY,
        description: 'Racha de 7 días sin protector',
        ...created(),
      },
    };
    await assertFails(commit(ownerDb(), [...writes, bonus]));
  });

  it('rejects raising streakFreezesAvailable during a close', async () => {
    const base = perfectDay();
    const input = {
      ...base,
      state: { ...base.state, streakFreezesAvailable: 1, totalStreakFreezesUsed: 3 },
    };
    const { writes } = await prepared(input);
    // Coherente en todo lo demás (usados baja a 2): solo puede fallar porque los protectores suben.
    await assertFails(
      commit(
        ownerDb(),
        tamper(writes, gamificationPath, { streakFreezesAvailable: 2, totalStreakFreezesUsed: 2 }),
      ),
    );
  });

  it('rejects a balance that does not match the points of the day', async () => {
    const { writes } = await prepared(perfectDay());
    await assertFails(commit(ownerDb(), tamper(writes, gamificationPath, { pointsBalance: 1000 })));
  });

  it('rejects a negative balance', async () => {
    const { writes } = await prepared(perfectDay());
    await assertFails(commit(ownerDb(), tamper(writes, gamificationPath, { pointsBalance: -1 })));
  });

  it('rejects a streak that does not follow from the day status', async () => {
    const { writes } = await prepared(perfectDay());
    const summary = writes.find((write) => write.path === yesterdayLog)?.data.summary;
    const tampered = tamper(
      tamper(writes, gamificationPath, { currentStreak: 30, longestStreak: 30 }),
      yesterdayLog,
      { summary: { ...summary, streakAfterClose: 30 } },
    );
    await assertFails(commit(ownerDb(), tampered));
  });

  it('rejects creating closing transactions without closing the day', async () => {
    const { writes } = await prepared(perfectDay());
    const transactionsOnly = writes.filter((write) => write.path.includes('/pointTransactions/'));
    await assertFails(commit(ownerDb(), transactionsOnly));
  });

  it('rejects closing the log without advancing the state', async () => {
    const { writes } = await prepared(perfectDay());
    await assertFails(commit(ownerDb(), [writes.find((write) => write.path === yesterdayLog)!]));
  });

  it('rejects advancing the state without closing the log', async () => {
    const { writes } = await prepared(perfectDay());
    await assertFails(commit(ownerDb(), without(writes, yesterdayLog)));
  });

  it('rejects a monthly summary that does not add exactly this day', async () => {
    const { writes } = await prepared(perfectDay());
    await assertFails(commit(ownerDb(), tamper(writes, yesterdayMonth, { closedDays: 2 })));
    await assertFails(commit(ownerDb(), tamper(writes, yesterdayMonth, { pointsEarned: 999 })));
    await assertFails(commit(ownerDb(), tamper(writes, yesterdayMonth, { pointsSpent: 50 })));
  });

  it('rejects entries written together with the close', async () => {
    const { writes } = await prepared(perfectDay());
    await assertFails(
      commit(
        ownerDb(),
        tamper(writes, yesterdayLog, {
          'entries.late': { completed: true, updatedAt: serverTimestamp() },
        }),
      ),
    );
  });
});
