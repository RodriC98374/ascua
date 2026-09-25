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
  type TaskDay,
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

/** Cómo le fue a un día con sus tareas. Las pendientes de días pasados siguen en Hoy. */
export function taskDayText({ dateKey, done, pending }: TaskDay<Task>, today: DateKey): string {
  const total = done.length + pending.length;
  if (total === 0) return 'Sin tareas este día.';
  if (pending.length === 0) {
    return total === 1 ? 'Cumpliste tu tarea.' : `Cumpliste las ${total} tareas.`;
  }
  const isPast = dateKey < today;
  if (done.length === 0) {
    if (isPast) {
      return total === 1
        ? 'Tu tarea sigue pendiente en Hoy.'
        : `Las ${total} tareas siguen pendientes en Hoy.`;
    }
    return total === 1 ? '1 tarea pendiente.' : `${total} tareas pendientes.`;
  }
  const counted = `${done.length} de ${total} cumplidas.`;
  if (!isPast) return counted;
  return pending.length === 1
    ? `${counted} La que falta sigue en Hoy.`
    : `${counted} Las que faltan siguen en Hoy.`;
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
