// La operación real de la app contra el emulador y las reglas reales. Las reglas usan la hora
// del servidor, así que los días se calculan desde el "hoy" real (TODAY).
import {
  addClosedDay,
  addDays,
  DAILY_TASK_POINTS_CAP,
  EMPTY_MONTHLY_COUNTERS,
  evaluateDay,
  toMonthKey,
  transactionIds as transactionIdsOf,
  type DailyEntries,
  type GamificationState,
  type Habit,
} from '@ascua/shared';
import { collection, getDoc, getDocs, doc, Timestamp, type Firestore } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  closePendingDays,
  type ClosePendingDaysResult,
} from '../../../../apps/client/src/operations/close-pending-days';
import { OWNER, ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  done,
  gamificationDoc,
  habitDoc,
  openLogDoc,
  paths,
  pendingState,
  seedDocs,
  taskDoc,
  testHabit,
  TODAY,
  YESTERDAY,
} from '../support/fixtures';

useRulesTestEnvironment();

const READING = testHabit('reading', 'primary');
const WATER = testHabit('water', 'secondary');

interface Setup {
  state: GamificationState;
  habits?: readonly Habit[];
  /** Marcas por día; un día sin marcas no tiene documento. */
  logs?: Record<string, DailyEntries>;
}

async function seed({ state, habits = [READING, WATER], logs = {} }: Setup) {
  await seedDocs({
    [paths.gamification()]: gamificationDoc(state),
    ...Object.fromEntries(
      habits.map((habit) => [
        paths.habit(habit.id),
        habitDoc({ name: habit.name, tier: habit.tier, startDateKey: habit.startDateKey }),
      ]),
    ),
    ...Object.fromEntries(
      Object.entries(logs).map(([dateKey, entries]) => [
        paths.dailyLog(dateKey),
        openLogDoc(dateKey, entries),
      ]),
    ),
  });
}

async function read(db: Firestore, path: string) {
  return (await getDoc(doc(db, path))).data();
}

async function transactionIds(db: Firestore): Promise<string[]> {
  const snapshot = await getDocs(collection(db, `users/${OWNER}/pointTransactions`));
  return snapshot.docs.map((transaction) => transaction.id).sort();
}

/** Estado con racha activa y el último cierre `daysAgo` días antes de hoy. */
function stateClosedDaysAgo(daysAgo: number, overrides: Partial<GamificationState> = {}) {
  return pendingState({ lastClosedDateKey: addDays(TODAY, -daysAgo), ...overrides });
}

describe('closePendingDays', () => {
  it('writes exactly what evaluateDay predicts for a normal day', async () => {
    const state = stateClosedDaysAgo(2, { pointsBalance: 40, lifetimePointsEarned: 40 });
    const entries = done('reading', 'water');
    await seed({ state, logs: { [YESTERDAY]: entries } });
    const expected = evaluateDay({ dateKey: YESTERDAY, habits: [READING, WATER], entries, state });

    const db = ownerDb();
    const result = await closePendingDays(db, OWNER, TODAY);

    expect(result.closedDays).toEqual([
      {
        dateKey: YESTERDAY,
        status: 'completed',
        pointsEarned: expected.summary.pointsEarned,
        freezeUsed: false,
        streakBeforeClose: 0,
        streakAfterClose: 1,
      },
    ]);
    expect(result.state).toEqual(expected.nextState);
    expect(await read(db, paths.gamification())).toMatchObject(expected.nextState);

    const log = await read(db, paths.dailyLog(YESTERDAY));
    expect(log).toMatchObject({ status: 'completed', summary: expected.summary });

    expect(await transactionIds(db)).toEqual(expected.transactions.map((t) => t.id).sort());
    for (const { id, ...fields } of expected.transactions) {
      expect(await read(db, paths.transaction(id))).toMatchObject(fields);
    }

    expect(await read(db, paths.monthlySummary(toMonthKey(YESTERDAY)))).toMatchObject({
      monthKey: toMonthKey(YESTERDAY),
      ...addClosedDay(EMPTY_MONTHLY_COUNTERS, expected),
    });
  });

  it('catches up several pending days in order', async () => {
    const [first, second, third] = [addDays(TODAY, -3), addDays(TODAY, -2), YESTERDAY];
    await seed({
      state: stateClosedDaysAgo(4),
      logs: { [first]: done('reading'), [third]: done('reading', 'water') },
    });

    const db = ownerDb();
    const result = await closePendingDays(db, OWNER, TODAY);

    expect(result.closedDays.map(({ dateKey, status }) => [dateKey, status])).toEqual([
      [first, 'completed'],
      [second, 'missed'],
      [third, 'completed'],
    ]);
    expect(result.state).toMatchObject({ lastClosedDateKey: YESTERDAY, currentStreak: 1 });
    // El día sin marcas también queda cerrado, con su documento.
    expect(await read(db, paths.dailyLog(second))).toMatchObject({
      status: 'missed',
      entries: {},
    });
  });

  it('credits the tasks completed on each pending day, with the daily cap', async () => {
    const past = Timestamp.fromDate(new Date('2026-01-01T12:00:00Z'));
    const completedOn = (dateKey: string, size: string) =>
      taskDoc({
        size,
        dueDateKey: dateKey,
        completedDateKey: dateKey,
        completedAt: past,
        createdAt: past,
        updatedAt: past,
      });
    const twoDaysAgo = addDays(TODAY, -2);
    await seed({ state: stateClosedDaysAgo(3, { pointsBalance: 50, lifetimePointsEarned: 50 }) });
    await seedDocs({
      [paths.task('a')]: completedOn(twoDaysAgo, 'small'),
      [paths.task('b')]: completedOn(YESTERDAY, 'large'),
      [paths.task('c')]: completedOn(YESTERDAY, 'large'),
      // Ya cerrado antes y todavía abierto hoy: ninguno se acredita.
      [paths.task('closed')]: completedOn(addDays(TODAY, -5), 'large'),
      [paths.task('today')]: taskDoc({ completedDateKey: TODAY, completedAt: past }),
      [paths.task('open')]: taskDoc(),
    });

    const db = ownerDb();
    const result = await closePendingDays(db, OWNER, TODAY);

    expect(result.closedDays.map((day) => day.pointsEarned)).toEqual([5, DAILY_TASK_POINTS_CAP]);
    expect(await transactionIds(db)).toEqual(
      [transactionIdsOf.dayTasks(twoDaysAgo), transactionIdsOf.dayTasks(YESTERDAY)].sort(),
    );
    expect(await read(db, paths.transaction(transactionIdsOf.dayTasks(YESTERDAY)))).toMatchObject({
      type: 'task_completion',
      amount: DAILY_TASK_POINTS_CAP,
      description: 'Tareas cumplidas: 2',
    });
    expect(result.state?.pointsBalance).toBe(50 + 5 + DAILY_TASK_POINTS_CAP);
  });

  it('does nothing when there are no pending days', async () => {
    const state = stateClosedDaysAgo(1);
    await seed({ state });

    const db = ownerDb();
    await expect(closePendingDays(db, OWNER, TODAY)).resolves.toEqual({
      closedDays: [],
      state: null,
    });
    expect(await read(db, paths.gamification())).toMatchObject(state);
  });

  it('is idempotent: a second run closes nothing and duplicates nothing', async () => {
    await seed({ state: stateClosedDaysAgo(3), logs: { [YESTERDAY]: done('reading', 'water') } });

    const db = ownerDb();
    const first = await closePendingDays(db, OWNER, TODAY);
    const transactionsAfterFirst = await transactionIds(db);
    const stateAfterFirst = await read(db, paths.gamification());

    const second = await closePendingDays(db, OWNER, TODAY);
    expect(first.closedDays).toHaveLength(2);
    expect(second.closedDays).toEqual([]);
    expect(await transactionIds(db)).toEqual(transactionsAfterFirst);
    expect(await read(db, paths.gamification())).toEqual(stateAfterFirst);
  });

  it('closes each day once when two devices run it at the same time', async () => {
    const days = [addDays(TODAY, -3), addDays(TODAY, -2), YESTERDAY];
    await seed({
      state: stateClosedDaysAgo(4),
      logs: Object.fromEntries(days.map((dateKey) => [dateKey, done('reading', 'water')])),
    });

    // allSettled: si uno falla, el otro no queda corriendo sobre el test siguiente.
    const settled = await Promise.allSettled([
      closePendingDays(ownerDb(), OWNER, TODAY),
      closePendingDays(ownerDb(), OWNER, TODAY),
    ]);
    const [phone, computer] = settled.map((outcome) => {
      if (outcome.status === 'rejected') throw outcome.reason;
      return outcome.value;
    }) as [ClosePendingDaysResult, ClosePendingDaysResult];

    const closedDates = [...phone.closedDays, ...computer.closedDays].map((day) => day.dateKey);
    expect(closedDates.sort()).toEqual(days);

    const db = ownerDb();
    // 3 días perfectos: 2 hábitos + día perfecto cada uno.
    expect(await transactionIds(db)).toHaveLength(9);
    expect(await read(db, paths.gamification())).toMatchObject({
      lastClosedDateKey: YESTERDAY,
      currentStreak: 3,
      pointsBalance: 3 * 20,
    });
  });

  it('fails when the device clock is ahead and tries to close a day that has not ended', async () => {
    await seed({ state: stateClosedDaysAgo(1) });
    const db = ownerDb();

    // Para el dispositivo ya es pasado mañana; para el servidor, hoy sigue abierto.
    await expect(closePendingDays(db, OWNER, addDays(TODAY, 2))).rejects.toMatchObject({
      code: 'permission-denied',
    });
    expect(await read(db, paths.gamification())).toMatchObject({ lastClosedDateKey: YESTERDAY });
  });

  it('uses a freeze on a day without activity when there is a streak to protect', async () => {
    await seed({
      state: stateClosedDaysAgo(2, {
        currentStreak: 4,
        longestStreak: 4,
        currentStreakStartDateKey: addDays(TODAY, -5),
        daysWithoutFreeze: 4,
        streakFreezesAvailable: 1,
      }),
    });

    const db = ownerDb();
    const result = await closePendingDays(db, OWNER, TODAY);

    expect(result.closedDays).toMatchObject([{ status: 'frozen', freezeUsed: true }]);
    expect(result.state).toMatchObject({ currentStreak: 4, streakFreezesAvailable: 0 });
    expect(await read(db, paths.dailyLog(YESTERDAY))).toMatchObject({ status: 'frozen' });
  });

  it('closes a day without scheduled habits as inactive', async () => {
    await seed({ state: stateClosedDaysAgo(2), habits: [] });

    const db = ownerDb();
    const result = await closePendingDays(db, OWNER, TODAY);

    expect(result.closedDays).toMatchObject([{ dateKey: YESTERDAY, status: 'inactive' }]);
    expect(await read(db, paths.dailyLog(YESTERDAY))).toMatchObject({ status: 'inactive' });
  });

  it('adds each day to the monthly summary of its own month', async () => {
    // Desde el último día del mes anterior al de ayer hasta ayer: siempre cruza un cambio de mes.
    const firstOfMonth = `${toMonthKey(YESTERDAY)}-01`;
    const lastOfPreviousMonth = addDays(firstOfMonth, -1);
    await seed({
      state: pendingState({ lastClosedDateKey: addDays(lastOfPreviousMonth, -1) }),
      habits: [READING],
      logs: { [lastOfPreviousMonth]: done('reading') },
    });

    const db = ownerDb();
    const result = await closePendingDays(db, OWNER, TODAY);
    const daysInCurrentMonth = result.closedDays.length - 1;

    // Un solo hábito cumplido también es día perfecto: 10 + 5.
    expect(await read(db, paths.monthlySummary(toMonthKey(lastOfPreviousMonth)))).toMatchObject({
      closedDays: 1,
      completedDays: 1,
      perfectDays: 1,
      pointsEarned: 15,
    });
    expect(await read(db, paths.monthlySummary(toMonthKey(YESTERDAY)))).toMatchObject({
      closedDays: daysInCurrentMonth,
      completedDays: 0,
      missedDays: daysInCurrentMonth,
    });
  });
});
