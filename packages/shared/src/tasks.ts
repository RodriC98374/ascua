// Tareas (fase 14): cuántos puntos dan en un día y cómo se ordenan en Hoy. Una tarea no toca la
// racha ni el día perfecto; si vence sin cumplirse, sigue en Hoy como vencida, sin castigo.
import { DAILY_TASK_POINTS_CAP, TASK_POINTS } from './constants';
import { daysBetween } from './dates';
import type { DateKey, Task } from './types';

export interface DayTaskPoints {
  /** Lo que se acredita: la suma, con el tope diario. */
  points: number;
  /** La suma sin tope, para mostrar cuánto quedó fuera. */
  uncappedPoints: number;
  completedCount: number;
}

/** Puntos de las tareas cumplidas en `dateKey`. Las de otros días se ignoran. */
export function dayTaskPoints(tasks: readonly Task[], dateKey: DateKey): DayTaskPoints {
  const completed = tasks.filter((task) => task.completedDateKey === dateKey);
  const uncappedPoints = completed.reduce((sum, task) => sum + TASK_POINTS[task.size], 0);
  return {
    points: Math.min(uncappedPoints, DAILY_TASK_POINTS_CAP),
    uncappedPoints,
    completedCount: completed.length,
  };
}

export interface TodayTaskList<T extends Task> {
  /** Sin cumplir y con fecha pasada; la más antigua primero. */
  overdue: T[];
  dueToday: T[];
  /** Cumplidas hoy, sea cual sea su fecha. */
  doneToday: T[];
  /** Para días que vienen; la más cercana primero. */
  upcoming: T[];
}

/** Por fecha y, dentro del mismo día, por título. */
function byDueDate(a: Task, b: Task): number {
  return a.dueDateKey.localeCompare(b.dueDateKey) || a.title.localeCompare(b.title, 'es');
}

/** Las tareas agrupadas como las muestra Hoy. Las cumplidas en días pasados no aparecen. */
export function todayTaskList<T extends Task>(
  tasks: readonly T[],
  today: DateKey,
): TodayTaskList<T> {
  const list: TodayTaskList<T> = { overdue: [], dueToday: [], doneToday: [], upcoming: [] };
  for (const task of [...tasks].sort(byDueDate)) {
    if (task.completedDateKey === today) list.doneToday.push(task);
    else if (task.completedDateKey !== null) continue;
    else if (task.dueDateKey < today) list.overdue.push(task);
    else if (task.dueDateKey === today) list.dueToday.push(task);
    else list.upcoming.push(task);
  }
  return list;
}

export interface TaskDay<T extends Task> {
  dateKey: DateKey;
  /** Cumplidas ese día, sea cual sea su fecha. */
  done: T[];
  /** Sin cumplir y para ese día; si el día ya pasó, siguen vencidas. */
  pending: T[];
  /** 0..1 de las tareas del día ya cumplidas; null si no tuvo ninguna. */
  completionRate: number | null;
}

/**
 * Las tareas de cada día pedido, para la semana, ordenadas por título. Cada tarea cae en un solo
 * día: el que se cumplió (ahí sumó sus puntos) o, si sigue pendiente, el que vence. Las de otros
 * días se ignoran.
 */
export function taskDays<T extends Task>(
  tasks: readonly T[],
  dateKeys: readonly DateKey[],
): TaskDay<T>[] {
  const byDay = new Map<DateKey, TaskDay<T>>(
    dateKeys.map((dateKey) => [dateKey, { dateKey, done: [], pending: [], completionRate: null }]),
  );
  for (const task of [...tasks].sort((a, b) => a.title.localeCompare(b.title, 'es'))) {
    if (task.completedDateKey !== null) byDay.get(task.completedDateKey)?.done.push(task);
    else byDay.get(task.dueDateKey)?.pending.push(task);
  }
  return [...byDay.values()].map((day) => {
    const total = day.done.length + day.pending.length;
    return { ...day, completionRate: total === 0 ? null : day.done.length / total };
  });
}

/** Días que lleva vencida una tarea pendiente; 0 si no está vencida o ya se cumplió. */
export function overdueDays(task: Task, today: DateKey): number {
  if (task.completedDateKey !== null || task.dueDateKey >= today) return 0;
  return daysBetween(task.dueDateKey, today);
}

/**
 * Cumplida en un día que ya pasó: sus puntos ya están (o estarán al cerrar) en el historial, así
 * que no se edita, no se desmarca y no se borra. Las reglas aplican lo mismo.
 */
export function isTaskLocked(task: Task, today: DateKey): boolean {
  return task.completedDateKey !== null && task.completedDateKey < today;
}
