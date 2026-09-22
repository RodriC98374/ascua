// Estadísticas de las vistas de semana, mes y año. Los días cerrados se leen de su `summary`
// (la foto del día) y se suman con `addClosedDay`, igual que `monthlySummaries`: así las cifras
// de cada vista coinciden con las del resumen mensual.
import { dateKeyRange } from './dates';
import type { DayEvaluation } from './day-evaluation';
import { getScheduledHabits } from './habit-schedule';
import { addClosedDay, EMPTY_MONTHLY_COUNTERS, mergeMonthlyCounters } from './monthly-summary';
import type {
  ClosedDayStatus,
  DailyLog,
  DateKey,
  Habit,
  MonthlyCounters,
  MonthlySummary,
} from './types';

/**
 * completed, perfect, frozen, missed, inactive: día cerrado (perfect es un completed con
 * `isPerfectDay`).
 * open:    hoy, o un día pasado que la app todavía no cierra.
 * no_data: sin registro ni hábitos, antes de empezar a usar la app.
 * future:  después de hoy.
 */
export type DayStatsStatus =
  | 'completed'
  | 'perfect'
  | 'frozen'
  | 'missed'
  | 'inactive'
  | 'open'
  | 'no_data'
  | 'future';

/** Un hábito que contaba ese día, cumplido o no. Los que no contaban no aparecen. */
export type HabitDayStatus = 'done' | 'not_done';

export interface DayStats {
  dateKey: DateKey;
  status: DayStatsStatus;
  isToday: boolean;
  scheduledCount: number;
  completedCount: number;
  /** 0..1; null si ese día no contaba ningún hábito. */
  completionRate: number | null;
  /** Solo en días cerrados. */
  pointsEarned: number | null;
  /** Solo en días cerrados. */
  streakAfterClose: number | null;
  habits: Readonly<Record<string, HabitDayStatus>>;
}

export interface HabitPeriodStats<T extends Habit = Habit> {
  habit: T;
  /** Días cerrados del periodo en que el hábito contaba. */
  scheduledDays: number;
  completedDays: number;
  /** 0..1; null si no contaba ningún día cerrado. */
  completionRate: number | null;
}

export interface RangeStats<T extends Habit = Habit> {
  days: DayStats[];
  /** Hábitos que contaron algún día del rango, cerrado o abierto. Principales primero. */
  habits: HabitPeriodStats<T>[];
  /** Contadores de los días cerrados, sumados como `monthlySummaries` (sin los gastos). */
  counters: MonthlyCounters;
  /** 0..1 sobre todos los hábitos-día cerrados; null si no hay ninguno. */
  completionRate: number | null;
}

export interface BuildRangeStatsInput<T extends Habit> {
  startDateKey: DateKey;
  endDateKey: DateKey;
  today: DateKey;
  /** Todos los hábitos (activos y archivados), en el orden elegido por el usuario. */
  habits: readonly T[];
  /** Registros del rango. Un día sin registro se trata como un día sin marcas. */
  logs: readonly DailyLog[];
}

type ClosedLog = DailyLog & {
  status: ClosedDayStatus;
  summary: NonNullable<DailyLog['summary']>;
};

function isClosedLog(log: DailyLog | undefined): log is ClosedLog {
  return log !== undefined && log.summary !== null && log.status !== 'open';
}

function rate(completed: number, scheduled: number): number | null {
  return scheduled > 0 ? completed / scheduled : null;
}

/** Porcentaje (0..1) de hábitos-día cumplidos; null si no contaba ningún hábito. */
export function completionRateOf(habitStats: MonthlyCounters['habitStats']): number | null {
  let scheduled = 0;
  let completed = 0;
  for (const stats of Object.values(habitStats)) {
    scheduled += stats.scheduledDays;
    completed += stats.completedDays;
  }
  return rate(completed, scheduled);
}

function emptyDay(dateKey: DateKey, today: DateKey, status: 'future' | 'no_data'): DayStats {
  return {
    dateKey,
    status,
    isToday: dateKey === today,
    scheduledCount: 0,
    completedCount: 0,
    completionRate: null,
    pointsEarned: null,
    streakAfterClose: null,
    habits: {},
  };
}

function closedDayStats(log: ClosedLog, today: DateKey): DayStats {
  const { summary } = log;
  const completed = new Set(summary.completedHabitIds);
  return {
    dateKey: log.dateKey,
    status: log.status === 'completed' && summary.isPerfectDay ? 'perfect' : log.status,
    isToday: log.dateKey === today,
    scheduledCount: summary.scheduledHabitIds.length,
    completedCount: summary.completedHabitIds.length,
    completionRate: summary.scheduledHabitIds.length > 0 ? summary.completionRate : null,
    pointsEarned: summary.pointsEarned,
    streakAfterClose: summary.streakAfterClose,
    habits: Object.fromEntries(
      summary.scheduledHabitIds.map((id) => [id, completed.has(id) ? 'done' : 'not_done']),
    ),
  };
}

/** Hoy, o un día pasado todavía sin cerrar: se calcula con sus marcas y los hábitos de ese día. */
function openDayStats(
  dateKey: DateKey,
  today: DateKey,
  log: DailyLog | undefined,
  habits: readonly Habit[],
): DayStats {
  const scheduled = getScheduledHabits(habits, dateKey);
  if (!log && scheduled.length === 0 && dateKey !== today) {
    return emptyDay(dateKey, today, 'no_data');
  }
  const entries = log?.entries ?? {};
  const isDone = (habit: Habit) => entries[habit.id]?.completed === true;
  const completedCount = scheduled.filter(isDone).length;
  return {
    dateKey,
    status: 'open',
    isToday: dateKey === today,
    scheduledCount: scheduled.length,
    completedCount,
    completionRate: rate(completedCount, scheduled.length),
    pointsEarned: null,
    streakAfterClose: null,
    habits: Object.fromEntries(
      scheduled.map((habit) => [habit.id, isDone(habit) ? 'done' : 'not_done']),
    ),
  };
}

/** Las filas de hábitos: los que cuentan, principales primero y luego en el orden recibido. */
function habitRows<T extends Habit>(
  habits: readonly T[],
  counted: ReadonlySet<string>,
  habitStats: MonthlyCounters['habitStats'],
): HabitPeriodStats<T>[] {
  const rows = habits.filter((habit) => counted.has(habit.id));
  const ordered = [
    ...rows.filter((habit) => habit.tier === 'primary'),
    ...rows.filter((habit) => habit.tier !== 'primary'),
  ];
  return ordered.map((habit) => {
    const stats = habitStats[habit.id] ?? { scheduledDays: 0, completedDays: 0 };
    return {
      habit,
      scheduledDays: stats.scheduledDays,
      completedDays: stats.completedDays,
      completionRate: rate(stats.completedDays, stats.scheduledDays),
    };
  });
}

/** Una semana o un mes: cada día con su estado y las cifras de los días cerrados. */
export function buildRangeStats<T extends Habit>({
  startDateKey,
  endDateKey,
  today,
  habits,
  logs,
}: BuildRangeStatsInput<T>): RangeStats<T> {
  const logsByDate = new Map(logs.map((log) => [log.dateKey, log]));
  const days: DayStats[] = [];
  const counted = new Set<string>();
  let counters: MonthlyCounters = EMPTY_MONTHLY_COUNTERS;

  for (const dateKey of dateKeyRange(startDateKey, endDateKey)) {
    const log = logsByDate.get(dateKey);
    let day: DayStats;
    if (dateKey > today) {
      day = emptyDay(dateKey, today, 'future');
    } else if (isClosedLog(log)) {
      day = closedDayStats(log, today);
      const closing: Pick<DayEvaluation, 'status' | 'summary'> = log;
      counters = addClosedDay(counters, closing);
    } else {
      day = openDayStats(dateKey, today, log, habits);
    }
    for (const habitId of Object.keys(day.habits)) {
      counted.add(habitId);
    }
    days.push(day);
  }

  return {
    days,
    habits: habitRows(habits, counted, counters.habitStats),
    counters,
    completionRate: completionRateOf(counters.habitStats),
  };
}

export interface MonthStats extends MonthlySummary {
  /** 0..1 sobre los hábitos-día del mes; null si el mes no tiene días cerrados. */
  completionRate: number | null;
}

export interface YearStats<T extends Habit = Habit> {
  /** Los doce meses, de enero a diciembre; vacíos si no tienen resumen. */
  months: MonthStats[];
  counters: MonthlyCounters;
  completionRate: number | null;
  /** Hábitos que contaron algún día del año. Principales primero. */
  habits: HabitPeriodStats<T>[];
}

/** Un año, desde los resúmenes mensuales (a lo sumo 12 documentos). */
export function buildYearStats<T extends Habit>({
  year,
  summaries,
  habits,
}: {
  /** 'YYYY'. */
  year: string;
  summaries: readonly MonthlySummary[];
  habits: readonly T[];
}): YearStats<T> {
  const byMonth = new Map(summaries.map((summary) => [summary.monthKey, summary]));
  const months = Array.from({ length: 12 }, (_, index): MonthStats => {
    const monthKey = `${year}-${String(index + 1).padStart(2, '0')}`;
    const summary = byMonth.get(monthKey) ?? { ...EMPTY_MONTHLY_COUNTERS, monthKey };
    return { ...summary, completionRate: completionRateOf(summary.habitStats) };
  });
  const counters = months.reduce<MonthlyCounters>(mergeMonthlyCounters, EMPTY_MONTHLY_COUNTERS);
  return {
    months,
    counters,
    completionRate: completionRateOf(counters.habitStats),
    habits: habitRows(habits, new Set(Object.keys(counters.habitStats)), counters.habitStats),
  };
}
