// Validación del formulario de metas. Las reglas validan la forma; esto da mensajes claros antes
// de escribir.
import {
  GOAL_DESCRIPTION_MAX_LENGTH,
  GOAL_TITLE_MAX_LENGTH,
  GOAL_TITLE_MIN_LENGTH,
  MAX_GOAL_HABITS,
  type DateKey,
} from '@ascua/shared';

export interface GoalDraft {
  title: string;
  description: string;
  targetDateKey: DateKey | null;
  habitIds: string[];
}

export type GoalErrors = Partial<Record<keyof GoalDraft, string>>;

/** `startDateKey`: el día en que empezó la meta (hoy, si es nueva). La fecha límite no va antes. */
export function validateGoal(draft: GoalDraft, startDateKey: DateKey): GoalErrors {
  const errors: GoalErrors = {};
  const title = draft.title.trim();
  if (title.length < GOAL_TITLE_MIN_LENGTH) {
    errors.title = `Escribe al menos ${GOAL_TITLE_MIN_LENGTH} letras.`;
  } else if (title.length > GOAL_TITLE_MAX_LENGTH) {
    errors.title = `Hasta ${GOAL_TITLE_MAX_LENGTH} letras.`;
  }
  if (draft.description.trim().length > GOAL_DESCRIPTION_MAX_LENGTH) {
    errors.description = `Hasta ${GOAL_DESCRIPTION_MAX_LENGTH} letras.`;
  }
  if (draft.targetDateKey !== null && draft.targetDateKey < startDateKey) {
    errors.targetDateKey = 'La fecha límite no puede ser antes de que empiece la meta.';
  }
  if (draft.habitIds.length > MAX_GOAL_HABITS) {
    errors.habitIds = `Hasta ${MAX_GOAL_HABITS} hábitos por meta.`;
  }
  return errors;
}

export function hasGoalErrors(errors: GoalErrors): boolean {
  return Object.keys(errors).length > 0;
}
