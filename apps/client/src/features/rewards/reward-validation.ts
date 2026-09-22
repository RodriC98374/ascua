// Validación del formulario de recompensas, con los mismos límites que las reglas.
import {
  REWARD_NAME_MIN_LENGTH,
  REWARD_COST_MAX,
  REWARD_DESCRIPTION_MAX_LENGTH,
  REWARD_NAME_MAX_LENGTH,
  type RewardRecord,
  type RewardTier,
} from '@ascua/shared';

export interface RewardDraft {
  name: string;
  description: string;
  tier: RewardTier;
  /** Tal como se escribe en el campo. */
  cost: string;
}

export type RewardErrors = Partial<Record<keyof RewardDraft, string>>;

interface ValidationContext {
  rewards: readonly RewardRecord[];
  /** Al editar: la recompensa que se edita. */
  rewardId?: string;
}

const normalize = (name: string) => name.trim().toLocaleLowerCase('es');

/** Errores por campo y el costo ya convertido (null si no es válido). */
export function validateReward(
  draft: RewardDraft,
  { rewards, rewardId }: ValidationContext,
): { errors: RewardErrors; cost: number | null } {
  const errors: RewardErrors = {};
  const name = draft.name.trim();

  if (name === '') errors.name = 'Escribe un nombre para tu recompensa.';
  else if (name.length < REWARD_NAME_MIN_LENGTH)
    errors.name = `El nombre necesita al menos ${REWARD_NAME_MIN_LENGTH} caracteres.`;
  else if (name.length > REWARD_NAME_MAX_LENGTH)
    errors.name = `El nombre puede tener hasta ${REWARD_NAME_MAX_LENGTH} caracteres.`;
  else if (
    rewards.some(
      (reward) =>
        reward.status === 'active' &&
        reward.id !== rewardId &&
        normalize(reward.name) === normalize(name),
    )
  )
    errors.name = 'Ya tienes una recompensa activa con ese nombre.';

  if (draft.description.trim().length > REWARD_DESCRIPTION_MAX_LENGTH)
    errors.description = `La descripción puede tener hasta ${REWARD_DESCRIPTION_MAX_LENGTH} caracteres.`;

  const costText = draft.cost.trim();
  const cost = /^\d+$/.test(costText) ? Number(costText) : null;
  if (cost === null || cost <= 0)
    errors.cost = 'Escribe un costo en puntos: un número entero mayor que 0.';
  else if (cost > REWARD_COST_MAX)
    errors.cost = `El costo puede ser de hasta ${REWARD_COST_MAX} pts.`;

  return { errors, cost: errors.cost ? null : cost };
}

export function hasErrors(errors: RewardErrors): boolean {
  return Object.keys(errors).length > 0;
}
