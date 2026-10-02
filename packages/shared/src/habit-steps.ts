// Pasos de un hábito (fase 21, D27): una rutina lista sus pasos y solo se cumple con todos
// marcados. Son opcionales y editables; lo que manda cada día son los pasos que el hábito tiene
// ese día, así que una marca de un paso que ya no existe no cuenta.
import {
  HABIT_STEP_ID_MAX_LENGTH,
  HABIT_STEP_TITLE_MAX_LENGTH,
  HABIT_STEPS_MAX,
  HABIT_STEPS_MIN,
} from './constants';
import type { Habit, HabitEntry, HabitStep } from './types';

type WithSteps = Pick<Habit, 'steps' | 'target'>;

/** Los pasos de un hábito. Vacío si no tiene o si lleva cantidad: ahí manda el contador. */
export function habitStepsOf(habit: WithSteps): readonly HabitStep[] {
  return habit.target ? [] : (habit.steps ?? []);
}

/** Ids de los pasos hechos, en el orden del hábito y solo de los pasos que todavía tiene. */
export function doneHabitStepIds(habit: WithSteps, entry: HabitEntry | undefined): string[] {
  const done = new Set(entry?.doneSteps ?? []);
  return habitStepsOf(habit)
    .map((step) => step.id)
    .filter((id) => done.has(id));
}

/** Todos los pasos marcados. Un hábito sin pasos nunca se cumple por esta vía. */
export function areHabitStepsDone(habit: WithSteps, entry: HabitEntry | undefined): boolean {
  const steps = habitStepsOf(habit);
  return steps.length > 0 && doneHabitStepIds(habit, entry).length === steps.length;
}

/**
 * La marca del día después de tocar un paso: lo marca o lo desmarca, y el hábito queda cumplido
 * solo si con eso están todos. Un paso que no es del hábito no cambia nada.
 */
export function toggleHabitStep(
  habit: WithSteps,
  entry: HabitEntry | undefined,
  stepId: string,
): { completed: boolean; doneSteps: string[] } {
  const stepIds = habitStepsOf(habit).map((step) => step.id);
  const done = new Set(doneHabitStepIds(habit, entry));
  if (stepIds.includes(stepId)) {
    if (done.has(stepId)) done.delete(stepId);
    else done.add(stepId);
  }
  const doneSteps = stepIds.filter((id) => done.has(id));
  return { completed: stepIds.length > 0 && doneSteps.length === stepIds.length, doneSteps };
}

function isStep(value: unknown): value is HabitStep {
  if (typeof value !== 'object' || value === null) return false;
  const { id, title } = value as Record<string, unknown>;
  return (
    typeof id === 'string' &&
    id.length >= 1 &&
    id.length <= HABIT_STEP_ID_MAX_LENGTH &&
    typeof title === 'string' &&
    title.length >= 1 &&
    title.length <= HABIT_STEP_TITLE_MAX_LENGTH &&
    title === title.trim()
  );
}

/** Una lista de pasos que se puede guardar: entre el mínimo y el máximo, sin ids repetidos. */
export function isValidHabitSteps(value: unknown): value is HabitStep[] {
  return (
    Array.isArray(value) &&
    value.length >= HABIT_STEPS_MIN &&
    value.length <= HABIT_STEPS_MAX &&
    value.every(isStep) &&
    new Set(value.map((step: HabitStep) => step.id)).size === value.length
  );
}
