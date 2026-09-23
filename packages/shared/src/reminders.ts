// Qué recordatorios locales programar y cuándo. Solo decide; programarlos es trabajo de la app.
import { REMINDER_PLAN_DAYS } from './constants';
import { addDays, toDateKey, toInstant } from './dates';
import type { DateKey, ReminderSettings } from './types';

export type ReminderKind = 'daily' | 'streak_risk';

export interface PlannedReminder {
  /** Determinista (`<kind>-<dateKey>`): identifica la notificación al reprogramar. */
  id: string;
  kind: ReminderKind;
  /** Día de Bolivia al que pertenece el aviso. */
  dateKey: DateKey;
  fireAt: Date;
}

export interface ReminderPlanInput {
  settings: ReminderSettings;
  now: Date;
  isTodayGoalMet: boolean;
  /** Sin hábitos programados hoy no hay meta ni racha que arriesgar. */
  hasHabitsToday: boolean;
}

/**
 * Recordatorios de los próximos `REMINDER_PLAN_DAYS` días, desde hoy en Bolivia, ordenados por
 * hora. Omite los que ya pasaron y el de racha en riesgo de hoy si la meta ya se cumplió.
 */
export function planReminders({
  settings,
  now,
  isTodayGoalMet,
  hasHabitsToday,
}: ReminderPlanInput): PlannedReminder[] {
  if (!settings.enabled) return [];

  const today = toDateKey(now);
  const skipTodayStreakRisk = isTodayGoalMet || !hasHabitsToday;
  const times: Record<ReminderKind, string> = {
    daily: settings.dailyReminderTime,
    streak_risk: settings.streakRiskReminderTime,
  };

  const reminders: PlannedReminder[] = [];
  for (let offset = 0; offset < REMINDER_PLAN_DAYS; offset++) {
    const dateKey = addDays(today, offset);
    for (const kind of ['daily', 'streak_risk'] as const) {
      if (kind === 'streak_risk' && offset === 0 && skipTodayStreakRisk) continue;
      const fireAt = toInstant(dateKey, times[kind]);
      if (fireAt.getTime() <= now.getTime()) continue;
      reminders.push({ id: `${kind}-${dateKey}`, kind, dateKey, fireAt });
    }
  }
  // Orden estable: a la misma hora, el diario va antes que el de racha.
  return reminders.sort((a, b) => a.fireAt.getTime() - b.fireAt.getTime());
}
