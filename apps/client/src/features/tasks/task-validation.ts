// Validación del formulario de tareas. Las reglas de Firestore validan la forma; esto da mensajes
// claros antes de escribir.
import {
  TASK_TITLE_MAX_LENGTH,
  TASK_TITLE_MIN_LENGTH,
  type DateKey,
  type TaskSize,
} from '@ascua/shared';

export interface TaskDraft {
  title: string;
  size: TaskSize;
  dueDateKey: DateKey;
}

export type TaskErrors = Partial<Record<keyof TaskDraft, string>>;

/**
 * `currentDueDateKey`: al editar, la fecha que ya tenía. Una vencida puede conservarla (las
 * reglas lo permiten), pero nunca moverse a otro día pasado.
 */
export function validateTask(
  draft: TaskDraft,
  today: DateKey,
  currentDueDateKey?: DateKey,
): TaskErrors {
  const errors: TaskErrors = {};
  const title = draft.title.trim();

  if (title === '') errors.title = 'Escribe qué tienes que hacer.';
  else if (title.length < TASK_TITLE_MIN_LENGTH)
    errors.title = `El título necesita al menos ${TASK_TITLE_MIN_LENGTH} caracteres.`;
  else if (title.length > TASK_TITLE_MAX_LENGTH)
    errors.title = `El título puede tener hasta ${TASK_TITLE_MAX_LENGTH} caracteres.`;

  if (draft.dueDateKey < today && draft.dueDateKey !== currentDueDateKey)
    errors.dueDateKey = 'Elige hoy o un día que venga.';

  return errors;
}

export function hasTaskErrors(errors: TaskErrors): boolean {
  return Object.keys(errors).length > 0;
}
