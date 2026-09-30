// Textos de las metas: cuánto falta para la fecha límite y el avance en una línea.
import type { GoalDeadline, GoalTaskProgress } from '@ascua/shared';

/** "Faltan 10 días", "Vence mañana", "Vence hoy", "Venció hace 2 días". */
export function deadlineText({ daysLeft }: GoalDeadline): string {
  if (daysLeft > 1) return `Faltan ${daysLeft} días`;
  if (daysLeft === 1) return 'Vence mañana';
  if (daysLeft === 0) return 'Vence hoy';
  if (daysLeft === -1) return 'Venció ayer';
  return `Venció hace ${-daysLeft} días`;
}

/** "3 de 5 tareas" o una invitación si todavía no tiene. */
export function taskProgressText({ done, total }: GoalTaskProgress): string {
  if (total === 0) return 'Sin tareas todavía';
  return `${done} de ${total} ${total === 1 ? 'tarea' : 'tareas'}`;
}
