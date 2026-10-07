import {
  addDays,
  DAILY_TASK_POINTS_CAP,
  EMPTY_MONTHLY_COUNTERS,
  toMonthKey,
  transactionIds,
} from '@ascua/shared';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { serverTimestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  commit,
  created,
  done,
  gamificationDoc,
  openLogDoc,
  paths,
  pendingState,
  planClose,
  seedBeforeClose,
  seedDocs,
  tamper,
  testHabit,
  testTask,
  TODAY,
  TWO_DAYS_AGO,
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
      currentStreakStartDateKey: addDays(CLOSED, -2),
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

// El día que cierran estos tests: anteayer. Ayer sigue abierto por el día de gracia (D29).
const CLOSED = TWO_DAYS_AGO;

const gamificationPath = paths.gamification();
const closedLog = paths.dailyLog(CLOSED);
const closedMonth = paths.monthlySummary(toMonthKey(CLOSED));

describe('closePendingDays: allowed', () => {
  it('closes a day with completions and the perfect day bonus', async () => {
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
        currentStreakStartDateKey: addDays(CLOSED, -3),
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
      ...EMPTY_MONTHLY_COUNTERS,
      closedDays: 5,
      completedDays: 4,
      missedDays: 1,
      pointsEarned: 90,
    };
    const { writes } = await prepared({ ...perfectDay(), monthly });
    await assertSucceeds(commit(ownerDb(), writes));
  });

  it('closes a day with tasks, credited in a single movement', async () => {
    const input: CloseInput = {
      ...perfectDay(),
      completedTasks: [testTask('call', 'small', CLOSED), testTask('bill', 'medium', CLOSED)],
    };
    const { evaluation, writes } = await prepared(input);
    const movement = evaluation.transactions.find((t) => t.type === 'task_completion');
    expect(movement?.id).toBe(transactionIds.dayTasks(CLOSED));
    expect(movement?.amount).toBe(15);
    await assertSucceeds(commit(ownerDb(), writes));
  });

  it('credits the daily cap when the tasks go over it, even on a day without habits', async () => {
    const input: CloseInput = {
      state: pendingState(),
      habits: [],
      logExists: false,
      completedTasks: [testTask('a', 'large', CLOSED), testTask('b', 'large', CLOSED)],
    };
    const { evaluation, writes } = await prepared(input);
    expect(evaluation.status).toBe('inactive');
    expect(evaluation.summary.pointsEarned).toBe(DAILY_TASK_POINTS_CAP);
    await assertSucceeds(commit(ownerDb(), writes));
  });

  it('fits the rules access limit in the largest close (10 habits, tasks, both streak bonuses)', async () => {
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
        currentStreakStartDateKey: addDays(CLOSED, -209),
        daysWithoutFreeze: 209,
      }),
      habits,
      entries: done(...habits.map((habit) => habit.id)),
      completedTasks: Array.from({ length: 12 }, (_, i) => testTask(`t${i}`, 'large', CLOSED)),
      monthly: { ...EMPTY_MONTHLY_COUNTERS, closedDays: 20, completedDays: 20, pointsEarned: 900 },
    };
    const { evaluation, writes } = await prepared(input);
    expect(evaluation.transactions).toHaveLength(14);
    await assertSucceeds(commit(ownerDb(), writes));
  });
});

describe('closePendingDays: denied', () => {
  it('rejects closing yesterday: it stays open for the grace day', async () => {
    const input: CloseInput = {
      ...perfectDay(),
      state: { ...perfectDay().state, lastClosedDateKey: CLOSED },
    };
    const { evaluation, writes } = await prepared(input);
    expect(evaluation.dateKey).toBe(YESTERDAY);
    await assertFails(commit(ownerDb(), writes));
  });

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
    const fourDaysAgo = addDays(TODAY, -4);
    await seedDocs({
      [gamificationPath]: gamificationDoc({
        ...perfectDay().state,
        lastClosedDateKey: fourDaysAgo,
      }),
      [closedLog]: openLogDoc(CLOSED, done('reading', 'water')),
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
    const path = paths.transaction(transactionIds.habitCompletion(CLOSED, 'reading'));
    await assertFails(commit(ownerDb(), tamper(writes, path, { amount: 15 })));
  });

  it('rejects a completion for a habit not completed that day', async () => {
    const input: CloseInput = { ...perfectDay(), entries: done('reading') };
    const { writes } = await prepared(input);
    const id = transactionIds.habitCompletion(CLOSED, 'water');
    const extra = {
      kind: 'set' as const,
      path: paths.transaction(id),
      data: {
        type: 'habit_completion',
        amount: 5,
        // Dentro del saldo final (110): así solo puede fallar por el hábito no cumplido.
        balanceAfter: 110,
        dateKey: CLOSED,
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
      path: paths.transaction(transactionIds.streakBonus(7, CLOSED)),
      data: {
        type: 'streak_bonus_7_days',
        amount: 20,
        // Dentro del saldo final (120): así solo puede fallar por no ser múltiplo de 7.
        balanceAfter: 120,
        dateKey: CLOSED,
        sourceType: 'daily_log',
        sourceId: CLOSED,
        description: 'Racha de 7 días sin protector',
        ...created(),
      },
    };
    await assertFails(commit(ownerDb(), [...writes, bonus]));
  });

  describe('tasks movement', () => {
    /** Día sin hábitos con 30 pts de tareas: el movimiento de tareas es el único del cierre. */
    const tasksOnlyDay = (): CloseInput => ({
      state: pendingState({ pointsBalance: 100, lifetimePointsEarned: 100 }),
      habits: [],
      logExists: false,
      completedTasks: [testTask('a', 'large', CLOSED), testTask('b', 'medium', CLOSED)],
    });
    const movementPath = paths.transaction(transactionIds.dayTasks(CLOSED));

    it('rejects more than the daily cap, even when everything else adds up', async () => {
      const { writes } = await prepared(tasksOnlyDay());
      const summary = writes.find((write) => write.path === closedLog)?.data.summary;
      const extra = 5;
      let tampered = tamper(writes, movementPath, {
        amount: DAILY_TASK_POINTS_CAP + extra,
        balanceAfter: 100 + DAILY_TASK_POINTS_CAP + extra,
      });
      tampered = tamper(tampered, closedLog, {
        summary: { ...summary, pointsEarned: DAILY_TASK_POINTS_CAP + extra },
      });
      tampered = tamper(tampered, gamificationPath, {
        pointsBalance: 100 + DAILY_TASK_POINTS_CAP + extra,
        lifetimePointsEarned: 100 + DAILY_TASK_POINTS_CAP + extra,
      });
      tampered = tamper(tampered, closedMonth, { pointsEarned: DAILY_TASK_POINTS_CAP + extra });
      await assertFails(commit(ownerDb(), tampered));
    });

    it('rejects a tasks movement with an id that is not the day one', async () => {
      const { writes } = await prepared(tasksOnlyDay());
      const renamed = writes.map((write) =>
        write.path === movementPath
          ? { ...write, path: paths.transaction(`tasks_${CLOSED}_extra`) }
          : write,
      );
      await assertFails(commit(ownerDb(), renamed));
    });

    it('rejects a tasks movement outside a close', async () => {
      const { writes } = await prepared(tasksOnlyDay());
      await assertFails(
        commit(
          ownerDb(),
          writes.filter((write) => write.path === movementPath),
        ),
      );
    });
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
    const summary = writes.find((write) => write.path === closedLog)?.data.summary;
    const tampered = tamper(
      tamper(writes, gamificationPath, { currentStreak: 30, longestStreak: 30 }),
      closedLog,
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
    await assertFails(commit(ownerDb(), [writes.find((write) => write.path === closedLog)!]));
  });

  it('rejects advancing the state without closing the log', async () => {
    const { writes } = await prepared(perfectDay());
    await assertFails(commit(ownerDb(), without(writes, closedLog)));
  });

  it('rejects a monthly summary that does not add exactly this day', async () => {
    const { writes } = await prepared(perfectDay());
    await assertFails(commit(ownerDb(), tamper(writes, closedMonth, { closedDays: 2 })));
    await assertFails(commit(ownerDb(), tamper(writes, closedMonth, { pointsEarned: 999 })));
    await assertFails(commit(ownerDb(), tamper(writes, closedMonth, { pointsSpent: 50 })));
  });

  it('rejects entries written together with the close', async () => {
    const { writes } = await prepared(perfectDay());
    await assertFails(
      commit(
        ownerDb(),
        tamper(writes, closedLog, {
          'entries.late': { completed: true, updatedAt: serverTimestamp() },
        }),
      ),
    );
  });
});
