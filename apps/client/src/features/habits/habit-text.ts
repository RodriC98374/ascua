// Textos de un hábito que se repiten entre pantallas (formulario y restauración).
import type { HabitSchedule } from '@ascua/shared';

/** Días de la semana con su inicial, de lunes (1) a domingo (7). */
export const WEEKDAY_OPTIONS = [
  { isoWeekday: 1, label: 'L' },
  { isoWeekday: 2, label: 'M' },
  { isoWeekday: 3, label: 'X' },
  { isoWeekday: 4, label: 'J' },
  { isoWeekday: 5, label: 'V' },
  { isoWeekday: 6, label: 'S' },
  { isoWeekday: 7, label: 'D' },
];

/** 'Todos los días', 'Días fijos: L, X, V' o '3 veces por semana'. */
export function scheduleText(schedule: HabitSchedule): string {
  if (schedule.type === 'daily') return 'Todos los días';
  if (schedule.type === 'days_of_week') {
    const labels = WEEKDAY_OPTIONS.filter((day) =>
      schedule.daysOfWeek.includes(day.isoWeekday),
    ).map((day) => day.label);
    return `Días fijos: ${labels.join(', ')}`;
  }
  const { timesPerWeek } = schedule;
  return `${timesPerWeek} ${timesPerWeek === 1 ? 'vez' : 'veces'} por semana`;
}
