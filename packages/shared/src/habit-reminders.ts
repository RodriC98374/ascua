// Recordatorios propios de cada hábito (fase 17, D23): hora y días elegidos. Solo decide qué
// avisos programar; programarlos es trabajo de la app, junto a los de `planReminders`.
import { HABIT_REMINDER_PLAN_DAYS } from './constants';
import { addDays, isoWeekday, startOfWeek, toDateKey, toInstant } from './dates';
import { isHabitActiveOn, isHabitDone, isHabitScheduledOn } from './habit-schedule';
import { isReminderTime } from './user-profile';
import { weeklyProgress, type WeekLog } from './weekly-habits';
import type { DateKey, Habit, HabitReminder, HabitSchedule } from './types';

const EVERY_DAY = [1, 2, 3, 4, 5, 6, 7];

/** Días que se pueden elegir para el recordatorio: los de un hábito de días fijos, o todos. */
export function reminderDaysFor(schedule: HabitSchedule): number[] {
  if (schedule.type !== 'days_of_week') return EVERY_DAY;
  return [...schedule.daysOfWeek].sort((a, b) => a - b);
}

/** Hora 'HH:mm' y al menos un día, sin repetir, entre los que el hábito permite. */
export function isValidHabitReminder(reminder: HabitReminder, schedule: HabitSchedule): boolean {
  const allowed = reminderDaysFor(schedule);
  const { daysOfWeek } = reminder;
  return (
    isReminderTime(reminder.time) &&
    daysOfWeek.length > 0 &&
    new Set(daysOfWeek).size === daysOfWeek.length &&
    daysOfWeek.every((day) => allowed.includes(day))
  );
}

export interface PlannedHabitReminder<T extends Habit> {
  /** Determinista (`habit-<habitId>-<dateKey>`): identifica la notificación al reprogramar. */
  id: string;
  habit: T;
  /** Día de Bolivia al que pertenece el aviso. */
  dateKey: DateKey;
  fireAt: Date;
}

export interface HabitReminderPlanInput<T extends Habit> {
  habits: readonly T[];
  now: Date;
  /** El interruptor general de Ajustes también apaga estos. */
  enabled: boolean;
  /** Registros de la semana de hoy, hoy incluido: dicen qué ya se cumplió. */
  weekLogs: readonly WeekLog[];
}

/** El hábito puede avisar ese día: existe, lo toca (si es de días fijos) y es uno de los elegidos. */
function remindsOn(habit: Habit, reminder: HabitReminder, dateKey: DateKey): boolean {
  if (!isHabitActiveOn(habit, dateKey)) return false;
  if (habit.schedule.type === 'days_of_week' && !isHabitScheduledOn(habit, dateKey)) return false;
  return reminder.daysOfWeek.includes(isoWeekday(dateKey));
}

/**
 * Avisos de los próximos `HABIT_REMINDER_PLAN_DAYS` días, desde hoy en Bolivia, ordenados por
 * hora. Omite los que ya pasaron, el de hoy si el hábito ya está cumplido y, en un semanal que ya
 * llegó a su N, los del resto de la semana.
 */
export function planHabitReminders<T extends Habit>({
  habits,
  now,
  enabled,
  weekLogs,
}: HabitReminderPlanInput<T>): PlannedHabitReminder<T>[] {
  if (!enabled) return [];

  const today = toDateKey(now);
  const nextWeekStart = addDays(startOfWeek(today), 7);
  const todayEntries = weekLogs.find((log) => log.dateKey === today)?.entries ?? {};
  const weeklyMet = new Set(
    weeklyProgress(habits, today, weekLogs)
      .filter((progress) => progress.isMet)
      .map((progress) => progress.habit.id),
  );

  const reminders: PlannedHabitReminder<T>[] = [];
  for (const habit of habits) {
    const { reminder } = habit;
    if (!reminder || habit.status !== 'active') continue;
    for (let offset = 0; offset < HABIT_REMINDER_PLAN_DAYS; offset++) {
      const dateKey = addDays(today, offset);
      if (!remindsOn(habit, reminder, dateKey)) continue;
      if (dateKey === today && isHabitDone(habit, todayEntries[habit.id])) continue;
      if (dateKey < nextWeekStart && weeklyMet.has(habit.id)) continue;
      const fireAt = toInstant(dateKey, reminder.time);
      if (fireAt.getTime() <= now.getTime()) continue;
      reminders.push({ id: `habit-${habit.id}-${dateKey}`, habit, dateKey, fireAt });
    }
  }
  return reminders.sort(
    (a, b) => a.fireAt.getTime() - b.fireAt.getTime() || a.id.localeCompare(b.id),
  );
}
