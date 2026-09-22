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

/** Hábito completo, tal como lo guarda y muestra la app. */
export interface HabitRecord extends Habit {
  description: string | null;
  icon: string;
  /** Hex, ej. '#FF6B35'. */
  color: string;
  sortOrder: number;
}

/** Marcas del día por hábito, tal como las escribe el usuario. */
export type DailyEntries = Readonly<Record<string, { completed: boolean }>>;

/** Registro de un día (documento `dailyLogs/{dateKey}`). */
export interface DailyLog {
  dateKey: DateKey;
  entries: DailyEntries;
  status: DayStatus;
  /** null mientras el día está abierto. */
  summary: {
    scheduledHabitIds: string[];
    scheduledPrimaryHabitIds: string[];
    completedHabitIds: string[];
    completionRate: number;
    isPerfectDay: boolean;
    pointsEarned: number;
    streakAfterClose: number;
  } | null;
}

/** Contadores de un mes; se acumulan al cerrar cada día y en cada gasto. */
export interface MonthlyCounters {
  closedDays: number;
  /** Incluye los días perfectos. */
  completedDays: number;
  perfectDays: number;
  frozenDays: number;
  missedDays: number;
  pointsEarned: number;
  /** Positivo: lo gastado en protectores y canjes. */
  pointsSpent: number;
  habitStats: Readonly<Record<string, { scheduledDays: number; completedDays: number }>>;
}

/** Resumen de un mes (documento `monthlySummaries/{monthKey}`). */
export interface MonthlySummary extends MonthlyCounters {
  monthKey: MonthKey;
}

/** Horarios de los recordatorios, 'HH:mm' en hora de Bolivia. */
export interface ReminderSettings {
  enabled: boolean;
  /** Recordatorio general del día. */
  dailyReminderTime: string;
  /** Aviso de racha en riesgo; se cancela si la meta de hoy ya está cumplida. */
  streakRiskReminderTime: string;
}

/** Perfil del usuario (documento `users/{uid}`). */
export interface UserProfile {
  email: string;
  displayName: string;
  reminderSettings: ReminderSettings;
}

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
  /**
   * ID del movimiento del último gasto (protector o canje). Las reglas lo usan para exigir que
   * cada descuento del saldo tenga su movimiento en el historial.
   */
  lastSpendTransactionId: string | null;
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

/** Recompensa completa, tal como la guarda y muestra la app. */
export interface RewardRecord extends Reward {
  description: string | null;
  icon: string;
  sortOrder: number;
}

/** Canje de una recompensa (documento `rewardRedemptions/{requestId}`). */
export interface RewardRedemption {
  id: string;
  rewardId: string;
  /** Foto de la recompensa al momento del canje. */
  rewardSnapshot: { name: string; tier: RewardTier; cost: number };
  pointTransactionId: string;
  dateKey: DateKey;
  note: string | null;
}
