// Validación del formulario de hábitos. Las reglas de Firestore validan la forma; esto da
// mensajes claros antes de escribir y cubre lo que las reglas no pueden (contar principales).
import {
  canBePrimary,
  HABIT_DESCRIPTION_MAX_LENGTH,
  HABIT_NAME_MAX_LENGTH,
  HABIT_NAME_MIN_LENGTH,
  MAX_PRIMARY_HABITS,
  TARGET_AMOUNT_MAX,
  TARGET_AMOUNT_MIN,
  TARGET_UNIT_MAX_LENGTH,
  type HabitCategory,
  type HabitColor,
  type HabitRecord,
  type HabitSchedule,
  type HabitTier,
} from '@ascua/shared';

// Categoría y color se eligen de una lista cerrada, así que no pueden traer un valor inválido.
export interface HabitDraft {
  name: string;
  description: string;
  tier: HabitTier;
  category: HabitCategory;
  color: HabitColor;
  /** Fija al crear (D20); al editar, la del hábito, sin picker que la cambie. */
  schedule: HabitSchedule;
  hasTarget: boolean;
  /** Texto tal como se escribe; se valida y convierte a número al guardar. */
  targetAmount: string;
  targetUnit: string;
}

export type HabitErrors = Partial<
  Record<keyof HabitDraft | 'schedule' | 'targetAmount' | 'targetUnit', string>
>;

interface ValidationContext {
  habits: readonly HabitRecord[];
  /** Al editar: el hábito que se edita, para no compararlo consigo mismo. */
  habitId?: string;
  /** Solo al crear se valida frecuencia y meta: al editar no se pueden tocar (D20). */
  isNew: boolean;
}

const normalize = (name: string) => name.trim().toLocaleLowerCase('es');

export function validateHabit(
  draft: HabitDraft,
  { habits, habitId, isNew }: ValidationContext,
): HabitErrors {
  const errors: HabitErrors = {};
  const name = draft.name.trim();

  if (name === '') errors.name = 'Escribe un nombre para tu hábito.';
  else if (name.length < HABIT_NAME_MIN_LENGTH)
    errors.name = `El nombre necesita al menos ${HABIT_NAME_MIN_LENGTH} caracteres.`;
  else if (name.length > HABIT_NAME_MAX_LENGTH)
    errors.name = `El nombre puede tener hasta ${HABIT_NAME_MAX_LENGTH} caracteres.`;
  else if (
    habits.some(
      (habit) =>
        habit.status === 'active' &&
        habit.id !== habitId &&
        normalize(habit.name) === normalize(name),
    )
  )
    errors.name = 'Ya tienes un hábito activo con ese nombre.';

  if (draft.description.trim().length > HABIT_DESCRIPTION_MAX_LENGTH)
    errors.description = `La descripción puede tener hasta ${HABIT_DESCRIPTION_MAX_LENGTH} caracteres.`;

  if (draft.tier === 'primary' && !canBePrimary(habits, habitId))
    errors.tier = `Ya tienes ${MAX_PRIMARY_HABITS} hábitos principales. Elige secundario.`;

  if (isNew) {
    if (draft.schedule.type === 'days_of_week' && draft.schedule.daysOfWeek.length === 0)
      errors.schedule = 'Elige al menos un día.';

    if (draft.hasTarget) {
      const amount = Number(draft.targetAmount);
      if (
        draft.targetAmount.trim() === '' ||
        !Number.isInteger(amount) ||
        amount < TARGET_AMOUNT_MIN ||
        amount > TARGET_AMOUNT_MAX
      )
        errors.targetAmount = `La meta va de ${TARGET_AMOUNT_MIN} a ${TARGET_AMOUNT_MAX}.`;

      if (draft.targetUnit.trim() === '')
        errors.targetUnit = 'Escribe la unidad (vasos, páginas…).';
      else if (draft.targetUnit.trim().length > TARGET_UNIT_MAX_LENGTH)
        errors.targetUnit = `La unidad puede tener hasta ${TARGET_UNIT_MAX_LENGTH} caracteres.`;
    }
  }

  return errors;
}

export function hasErrors(errors: HabitErrors): boolean {
  return Object.keys(errors).length > 0;
}
