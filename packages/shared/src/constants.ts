import type { HabitTier, PointTransactionType, RewardTier } from './types';

/** Zona horaria en la que opera todo el sistema, sin importar el dispositivo. */
export const APP_TIME_ZONE = 'America/La_Paz';

/** Puntos por día cumplido según el nivel del hábito. */
export const HABIT_POINTS: Readonly<Record<HabitTier, number>> = { primary: 10, secondary: 5 };

export const MAX_PRIMARY_HABITS = 3;

/** Largo del nombre y la descripción de un hábito. Las reglas aceptan desde 1; la UI pide 2. */
export const HABIT_NAME_MIN_LENGTH = 2;
export const HABIT_NAME_MAX_LENGTH = 60;
export const HABIT_DESCRIPTION_MAX_LENGTH = 200;

/** Bono por cumplir el 100% de los hábitos programados del día. */
export const PERFECT_DAY_BONUS = 5;

/** Bonos recurrentes por días seguidos sin usar protector. */
export const STREAK_BONUSES: readonly {
  readonly everyDays: number;
  readonly points: number;
  readonly type: Extract<PointTransactionType, 'streak_bonus_7_days' | 'streak_bonus_30_days'>;
}[] = [
  { everyDays: 7, points: 20, type: 'streak_bonus_7_days' },
  { everyDays: 30, points: 100, type: 'streak_bonus_30_days' },
];

export const STREAK_FREEZE_COST = 150;
export const MAX_STREAK_FREEZES = 2;

/**
 * Días hacia adelante que se programan los recordatorios locales. La app los reprograma cada vez
 * que se abre, así que solo dejan de llegar si pasa todo este tiempo sin abrirla.
 */
export const REMINDER_PLAN_DAYS = 30;

/** Límites de una recompensa; los mismos que validan las reglas. */
export const REWARD_NAME_MIN_LENGTH = 2;
export const REWARD_NAME_MAX_LENGTH = 60;
export const REWARD_DESCRIPTION_MAX_LENGTH = 200;
export const REWARD_COST_MAX = 1_000_000;
/** Nota opcional de un canje. */
export const REDEMPTION_NOTE_MAX_LENGTH = 200;

/** Rangos sugeridos por nivel de recompensa. Solo orientan a la UI; no se validan. */
export const REWARD_TIER_COST_RANGES: Readonly<Record<RewardTier, { min: number; max: number }>> = {
  small: { min: 50, max: 80 },
  medium: { min: 150, max: 250 },
  large: { min: 500, max: 700 },
};
