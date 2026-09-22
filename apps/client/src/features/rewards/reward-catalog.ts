// Catálogo de recompensas: agrupación por nivel y textos de los botones de gasto.
import {
  REWARD_TIER_COST_RANGES,
  STREAK_FREEZE_COST,
  type RewardRecord,
  type RewardTier,
  type SpendCheck,
} from '@ascua/shared';

export const TIER_LABELS: Record<RewardTier, { singular: string; plural: string }> = {
  small: { singular: 'Pequeña', plural: 'Pequeñas' },
  medium: { singular: 'Mediana', plural: 'Medianas' },
  large: { singular: 'Grande', plural: 'Grandes' },
};

const TIER_ORDER: RewardTier[] = ['small', 'medium', 'large'];

export function tierRange(tier: RewardTier): string {
  const { min, max } = REWARD_TIER_COST_RANGES[tier];
  return `${min}–${max} pts`;
}

export interface TierGroup {
  tier: RewardTier;
  title: string;
  range: string;
  rewards: RewardRecord[];
}

/** Recompensas activas por nivel, de pequeña a grande; los niveles vacíos no aparecen. */
export function catalogByTier(rewards: readonly RewardRecord[]): TierGroup[] {
  const active = rewards.filter((reward) => reward.status === 'active');
  return TIER_ORDER.map((tier) => ({
    tier,
    title: TIER_LABELS[tier].plural,
    range: tierRange(tier),
    rewards: active.filter((reward) => reward.tier === tier),
  })).filter((group) => group.rewards.length > 0);
}

function missingLabel(check: SpendCheck): string | null {
  return !check.ok && check.reason === 'insufficient_points'
    ? `Te faltan ${check.missingPoints} pts`
    : null;
}

export function redeemButtonLabel(check: SpendCheck): string {
  return check.ok ? 'Canjear' : (missingLabel(check) ?? 'No disponible');
}

export function freezeButtonLabel(check: SpendCheck): string {
  if (check.ok) return `Comprar · ${STREAK_FREEZE_COST} pts`;
  if (check.reason === 'max_freezes_reached') return 'Ya tienes el máximo';
  return missingLabel(check) ?? 'No disponible';
}

/** Mensaje para un gasto que falló. Por `code`/`check` y no por clase: sirve con cualquier SDK. */
export function spendErrorMessage(error: unknown): string {
  const { code, check } = (error ?? {}) as { code?: unknown; check?: SpendCheck };
  if (code === 'unavailable') {
    return 'Necesitas conexión a internet para gastar puntos. Vuelve a intentarlo cuando tengas señal.';
  }
  if (check && !check.ok) {
    if (check.reason === 'insufficient_points')
      return `Te faltan ${check.missingPoints} pts para esto.`;
    if (check.reason === 'max_freezes_reached') return 'Ya tienes el máximo de protectores.';
    return 'Esta recompensa ya no está disponible.';
  }
  return 'No se pudo completar. Tus puntos no cambiaron; vuelve a intentarlo.';
}
