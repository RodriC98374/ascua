// Textos de la restauración de un respaldo (fase 19): errores del archivo, detalle de cada cosa en
// la vista previa y el resumen final.
import {
  formatDateRange,
  formatShortDate,
  isValidDateKey,
  reflectionWeekEnd,
  type BackupReadError,
  type DateKey,
  type PlannedGoal,
  type RestoredHabit,
  type RestoredReward,
  type RestoredTask,
  type RestoreNote,
  type RestorePlan,
  type TaskSize,
} from '@ascua/shared';

import { scheduleText } from '@/features/habits/habit-text';
import { taskDueLabel } from '@/features/tasks/task-text';
import type { RestoreCounts } from '@/operations/restore';

/** Además de lo que detecta `readBackup`: un archivo enorme o que no se pudo abrir. */
export type RestoreFileError = BackupReadError | 'too_big' | 'unreadable_file';

const ERROR_TEXTS: Record<RestoreFileError, string> = {
  not_json: 'No se pudo leer el archivo. Elige el respaldo JSON que guardaste desde Ajustes.',
  unreadable_file: 'No se pudo abrir el archivo. Vuelve a intentarlo.',
  not_backup: 'Ese archivo no es un respaldo de Ascua. Busca el que se llama "ascua-respaldo".',
  newer_version:
    'Ese respaldo es de una versión más nueva de Ascua. Actualiza la app y vuelve a intentarlo.',
  too_big: 'El archivo es demasiado grande para ser un respaldo de Ascua.',
};

export function restoreErrorText(error: RestoreFileError): string {
  return ERROR_TEXTS[error];
}

const NOTE_TEXTS: Record<RestoreNote, string> = {
  made_secondary: 'Entra como secundario: ya no quedan lugares de principal',
  moved_to_today: 'Estaba vencida: ahora vence hoy',
  deadline_cleared: 'Su fecha límite ya pasó: queda sin fecha',
};

export function restoreNoteText(note: RestoreNote): string {
  return NOTE_TEXTS[note];
}

function countText(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** Como `countText`, pero null con 0: para listas que omiten lo que no hay. */
function countPart(count: number, singular: string, plural: string): string | null {
  return count > 0 ? countText(count, singular, plural) : null;
}

/** 'Principal · Todos los días · 8 vasos'. */
export function habitRestoreDetail(habit: RestoredHabit): string {
  return [
    habit.tier === 'primary' ? 'Principal' : 'Secundario',
    scheduleText(habit.schedule),
    habit.target && `${habit.target.amount} ${habit.target.unit}`,
  ]
    .filter(Boolean)
    .join(' · ');
}

export function rewardRestoreDetail(reward: RestoredReward): string {
  return `${reward.cost} pts`;
}

const TASK_SIZE_LABELS: Record<TaskSize, string> = {
  small: 'Pequeña',
  medium: 'Mediana',
  large: 'Grande',
};

/** 'Mediana · Mañana', con la fecha en que va a vencer ya restaurada. */
export function taskRestoreDetail(task: RestoredTask, today: DateKey): string {
  const due = taskDueLabel({ ...task, id: '', completedDateKey: null }, today);
  return `${TASK_SIZE_LABELS[task.size]} · ${due}`;
}

/** '2 hábitos y 1 tarea · Hasta el 31 dic 2026'. */
export function goalRestoreDetail(goal: PlannedGoal): string {
  const links = [
    countPart(goal.habits.length, 'hábito', 'hábitos'),
    countPart(goal.tasks.length, 'tarea', 'tareas'),
  ].filter((part): part is string => part !== null);
  const deadline = goal.targetDateKey
    ? `Hasta el ${formatShortDate(goal.targetDateKey)} ${goal.targetDateKey.slice(0, 4)}`
    : 'Sin fecha límite';
  return [links.length > 0 ? links.join(' y ') : 'Sin hábitos ni tareas', deadline].join(' · ');
}

export function reflectionRestoreTitle(weekStartDateKey: DateKey): string {
  return `Semana del ${formatDateRange(weekStartDateKey, reflectionWeekEnd(weekStartDateKey))}`;
}

/** 'Guardado el 28 sep 2026', a partir del instante de la exportación (ISO con offset de Bolivia). */
export function backupDateText(exportedAt: string | null): string | null {
  const dateKey = exportedAt?.slice(0, 10);
  if (!dateKey || !isValidDateKey(dateKey)) return null;
  return `Guardado el ${formatShortDate(dateKey)} ${dateKey.slice(0, 4)}`;
}

/** 'Ya están en tu cuenta y no se duplican: 7 hábitos y 1 meta.'; null si no hay repetidos. */
export function restoreRepeatsText(plan: RestorePlan): string | null {
  const repeated = (items: readonly { existingId: string | null }[]) =>
    items.filter((item) => item.existingId !== null).length;
  const parts = [
    countPart(repeated(plan.habits), 'hábito', 'hábitos'),
    countPart(repeated(plan.rewards), 'recompensa', 'recompensas'),
    countPart(repeated(plan.tasks), 'tarea', 'tareas'),
    countPart(repeated(plan.goals), 'meta', 'metas'),
    countPart(repeated(plan.reflections), 'reflexión', 'reflexiones'),
  ].filter((part): part is string => part !== null);
  if (parts.length === 0) return null;
  return `Ya están en tu cuenta y no se duplican: ${joinWithAnd(parts)}.`;
}

export function restoreButtonLabel(selectedCount: number): string {
  if (selectedCount === 0) return 'Elige algo para recuperar';
  return `Recuperar ${countText(selectedCount, 'cosa', 'cosas')}`;
}

function joinWithAnd(parts: readonly string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`;
}

/** 'Recuperaste 2 hábitos, 1 recompensa y 3 tareas.' */
export function restoreSummaryText(counts: RestoreCounts): string {
  const parts = [
    countPart(counts.habits, 'hábito', 'hábitos'),
    countPart(counts.rewards, 'recompensa', 'recompensas'),
    countPart(counts.tasks, 'tarea', 'tareas'),
    countPart(counts.goals, 'meta', 'metas'),
    countPart(counts.reflections, 'reflexión', 'reflexiones'),
  ].filter((part): part is string => part !== null);
  if (parts.length === 0) return 'No había nada nuevo para recuperar.';
  return `Recuperaste ${joinWithAnd(parts)}.`;
}
