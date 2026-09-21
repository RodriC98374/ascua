// Tipos del dominio. Sin dependencias de Firebase: los documentos de Firestore
// (con Timestamp y converters) viven en la app y se traducen a estos tipos.

/** Día de calendario en America/La_Paz, formato 'YYYY-MM-DD'. Ordenable como string. */
export type DateKey = string;

/** Mes de calendario en America/La_Paz, formato 'YYYY-MM'. */
export type MonthKey = string;

export type HabitTier = 'primary' | 'secondary';
export type RewardTier = 'small' | 'medium' | 'large';
export type EntityStatus = 'active' | 'archived';

/**
 * open:      día en curso, todavía no cerrado.
 * completed: se cumplió la meta de racha (todos los principales). La racha suma.
 * frozen:    no se cumplió, pero un protector salvó la racha. La racha se mantiene sin sumar.
 * missed:    no se cumplió y no había protector (o no había racha que proteger). La racha vuelve a 0.
 * inactive:  no había ningún hábito programado ese día. No afecta la racha ni da puntos.
 */
export type DayStatus = 'open' | 'completed' | 'frozen' | 'missed' | 'inactive';
export type ClosedDayStatus = Exclude<DayStatus, 'open'>;

export type PointTransactionType =
  | 'habit_completion'
  | 'perfect_day_bonus'
  | 'streak_bonus_7_days'
  | 'streak_bonus_30_days'
  | 'streak_freeze_purchase'
  | 'reward_redemption'
  | 'manual_adjustment';

export type PointSourceType =
  'habit' | 'daily_log' | 'streak_freeze' | 'reward_redemption' | 'manual';

/** Frecuencia de un hábito. Por ahora solo diaria; extensible sin romper datos existentes. */
export interface HabitSchedule {
  type: 'daily';
}

/** Lo que la lógica necesita de un hábito. */
export interface Habit {
  id: string;
  name: string;
  tier: HabitTier;
  schedule: HabitSchedule;
  status: EntityStatus;
  /** Primer día en que cuenta. */
  startDateKey: DateKey;
  /** Último día en que cuenta (inclusive); null si está activo. */
  archivedDateKey: DateKey | null;
}

/** Marcas del día por hábito, tal como las escribe el usuario. */
export type DailyEntries = Readonly<Record<string, { completed: boolean }>>;

/** Saldo y racha del usuario (documento `meta/gamification`). */
export interface GamificationState {
  pointsBalance: number;
  lifetimePointsEarned: number;
  lifetimePointsSpent: number;
  /** Días cerrados consecutivos; no incluye hoy. */
  currentStreak: number;
  longestStreak: number;
  currentStreakStartDateKey: DateKey | null;
  /** Base de los bonos de 7/30 días; vuelve a 0 al usar protector o perder la racha. */
  daysWithoutFreeze: number;
  streakFreezesAvailable: number;
  totalStreakFreezesUsed: number;
  /** Último día cerrado. */
  lastClosedDateKey: DateKey;
}

/** Movimiento de puntos listo para escribirse en `pointTransactions/{id}`. */
export interface PointTransaction {
  id: string;
  type: PointTransactionType;
  /** Con signo: +10, -150, ... */
  amount: number;
  balanceAfter: number;
  dateKey: DateKey;
  sourceType: PointSourceType;
  sourceId: string | null;
  /** Texto para el usuario. */
  description: string;
}

/** Lo que la lógica necesita de una recompensa. */
export interface Reward {
  id: string;
  name: string;
  tier: RewardTier;
  cost: number;
  status: EntityStatus;
}
