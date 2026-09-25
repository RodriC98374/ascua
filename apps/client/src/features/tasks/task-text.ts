// Textos de las tareas en Hoy y en su formulario. Las fechas son días de Bolivia (`DateKey`).
import {
  addDays,
  DAILY_TASK_POINTS_CAP,
  daysBetween,
  formatShortDate,
  formatShortWeekday,
  overdueDays,
  type DateKey,
  type DayTaskPoints,
  type Task,
} from '@ascua/shared';

/** Cuántos días muestra el selector de fecha: hoy y los seis que siguen. */
const DUE_DATE_OPTION_DAYS = 7;

function dayLabel(dateKey: DateKey, today: DateKey): string {
  const days = daysBetween(today, dateKey);
  if (days === 0) return 'Hoy';
  if (days === 1) return 'Mañana';
  return days < DUE_DATE_OPTION_DAYS ? formatShortWeekday(dateKey) : formatShortDate(dateKey);
}

/** Para cuándo es una tarea pendiente, o cuánto lleva vencida; null si ya se cumplió. */
export function taskDueLabel(task: Task, today: DateKey): string | null {
  if (task.completedDateKey !== null) return null;
  const overdue = overdueDays(task, today);
  if (overdue === 1) return 'Venció ayer';
  if (overdue > 1) return `Vencida hace ${overdue} días`;
  return dayLabel(task.dueDateKey, today);
}

/** Los días que ofrece el formulario: hoy, mañana y el resto de la semana. */
export function dueDateOptions(today: DateKey): { dateKey: DateKey; label: string }[] {
  return Array.from({ length: DUE_DATE_OPTION_DAYS }, (_, index) => {
    const dateKey = addDays(today, index);
    return { dateKey, label: dayLabel(dateKey, today) };
  });
}

/** Los puntos de tareas del día frente al tope. */
export function taskPointsText({ points, uncappedPoints, completedCount }: DayTaskPoints): string {
  if (completedCount === 0) {
    return `Cada tarea suma puntos, hasta ${DAILY_TASK_POINTS_CAP} por día.`;
  }
  if (uncappedPoints > points) {
    return `Llegaste al tope de ${DAILY_TASK_POINTS_CAP} pts por tareas hoy. Las demás se cumplen igual, pero ya no suman.`;
  }
  if (points === DAILY_TASK_POINTS_CAP) {
    return `Llegaste al tope de ${DAILY_TASK_POINTS_CAP} pts por tareas hoy.`;
  }
  return `+${points} de ${DAILY_TASK_POINTS_CAP} pts por tareas hoy.`;
}
