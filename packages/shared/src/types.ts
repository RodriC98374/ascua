// Tipos del dominio. Sin dependencias de Firebase: los documentos de Firestore
// (con Timestamp y converters) viven en la app y se traducen a estos tipos.

import type { HabitCategory, HabitColor } from './habit-appearance';

/** Día de calendario en America/La_Paz, formato 'YYYY-MM-DD'. Ordenable como string. */
export type DateKey = string;

/** Mes de calendario en America/La_Paz, formato 'YYYY-MM'. */
export type MonthKey = string;

export type HabitTier = 'primary' | 'secondary';
export type RewardTier = 'small' | 'medium' | 'large';
export type TaskSize = 'small' | 'medium' | 'large';
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
  | 'manual_adjustment'
  /** Todas las tareas cumplidas en un día, en un solo movimiento con tope (fase 14). */
  | 'task_completion';

export type PointSourceType =
  'habit' | 'daily_log' | 'streak_freeze' | 'reward_redemption' | 'manual';

/** Frecuencia de un hábito (D20). Se fija al crearlo. */
export type HabitSchedule =
  | { type: 'daily' }
  /** Días fijos: 1 = lunes … 7 = domingo. Los demás días no cuenta. */
  | { type: 'days_of_week'; daysOfWeek: number[] }
  /** N veces por semana (lunes a domingo), cualquier día. No entra en la meta de racha. */
  | { type: 'times_per_week'; timesPerWeek: number };

export type HabitScheduleType = HabitSchedule['type'];

/** Meta del día de un hábito con cantidad: se cumple al llegar a `amount` (8 vasos). */
export interface HabitTarget {
  amount: number;
  unit: string;
}

/** Recordatorio propio de un hábito (fase 17, D23). Se puede cambiar o quitar cuando sea. */
export interface HabitReminder {
  /** 'HH:mm' de Bolivia. */
  time: string;
  /** 1 = lunes … 7 = domingo. En un hábito de días fijos, solo entre sus días. */
  daysOfWeek: number[];
}

/** Un paso de un hábito (fase 21, D27). El id no cambia aunque se edite el texto o el orden. */
export interface HabitStep {
  id: string;
  title: string;
}

/** Lo que la lógica necesita de un hábito. */
export interface Habit {
  id: string;
  name: string;
  tier: HabitTier;
  schedule: HabitSchedule;
  /** Sin cantidad si falta o es null (los hábitos de antes de la fase 16 no lo traen). */
  target?: HabitTarget | null;
  /** Sin recordatorio si falta o es null (los hábitos de antes de la fase 17 no lo traen). */
  reminder?: HabitReminder | null;
  /**
   * Con pasos, el hábito se cumple al marcarlos todos. Sin pasos si falta, es null o está vacío
   * (los hábitos de antes de la fase 21 no lo traen). Se pueden cambiar cuando sea.
   */
  steps?: readonly HabitStep[] | null;
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
  /** Uno de `HABIT_COLORS`. Propuesto por la categoría y editable. */
  color: HabitColor;
  category: HabitCategory;
  sortOrder: number;
}

/** Lo que la lógica necesita de una tarea (documento `tasks/{taskId}`). */
export interface Task {
  id: string;
  title: string;
  size: TaskSize;
  /** Para cuándo es. Si pasa sin cumplirse, sigue en Hoy como vencida. */
  dueDateKey: DateKey;
  /** Día en que se cumplió (solo puede ser hoy al marcarla); null si está pendiente. */
  completedDateKey: DateKey | null;
}

/** Tarea completa, tal como la muestra la app. */
export interface TaskRecord extends Task {
  /** Día en que se creó, sacado de `createdAt`: la semana la usa para saber qué había pendiente. */
  createdDateKey: DateKey;
}

/**
 * Marca de un hábito en un día. Con cantidad, `count` es lo hecho (3 de 8) y manda sobre
 * `completed`, que la app escribe igual para leerlo de un vistazo.
 */
export interface HabitEntry {
  completed: boolean;
  count?: number;
  /** Ids de los pasos hechos, en un hábito con pasos: mandan sobre `completed`. */
  doneSteps?: readonly string[];
}

/** Marcas del día por hábito, tal como las escribe el usuario. */
export type DailyEntries = Readonly<Record<string, HabitEntry>>;

/** Escalas del check-in diario (fase 15, D22), de 1 a 5. */
export type CheckInDimension = 'mood' | 'energy' | 'motivation';

/** El check-in de un día: cada escala contestada, de 1 a 5. Sin la clave = sin contestar. */
export type CheckIn = Readonly<Partial<Record<CheckInDimension, number>>>;

/** Suma y días contestados de cada escala: el promedio sale de ahí y se suman meses sin perder. */
export type CheckInStats = Readonly<
  Partial<Record<CheckInDimension, { days: number; total: number }>>
>;

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
  /** Solo hoy, como las marcas; los registros de antes de la fase 15 no lo traen. */
  checkIn?: CheckIn;
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
  /** Check-in de los días cerrados; los resúmenes de antes de la fase 15 no lo traen. */
  checkInStats: CheckInStats;
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
  /**
   * Presupuesto mensual para gustos, en Bs (fase 21): la calculadora de recompensas lo usa para la
   * tasa de puntos por Bs. Sin el campo o null = sin definir.
   */
  rewardBudget?: number | null;
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
  /**
   * Trofeos (fase 21): día en que se marcó "Utilizado" (de `usedAt`, en hora de Bolivia), o
   * `null` si todavía no se usó. Se marca una sola vez.
   */
  usedDateKey: DateKey | null;
}

/** Estado de una meta (fase 18, D25). Las metas no se borran: se logran o se archivan. */
export type GoalStatus = 'active' | 'achieved' | 'archived';

/**
 * Meta a largo plazo (documento `goals/{goalId}`): agrupa tareas y hábitos. El avance son sus
 * tareas cumplidas; los hábitos muestran su constancia desde que empezó. No da puntos.
 */
export interface Goal {
  id: string;
  title: string;
  description: string | null;
  /** Fecha límite opcional. */
  targetDateKey: DateKey | null;
  habitIds: string[];
  /** Tareas creadas desde la meta. Una tarea borrada puede seguir listada: se ignora. */
  taskIds: string[];
  status: GoalStatus;
  /** Día en que se creó; desde ahí se mide la constancia de sus hábitos. */
  startDateKey: DateKey;
  /** El día que se dio por lograda; null si no lo está. */
  achievedDateKey: DateKey | null;
  sortOrder: number;
}

/** Las tres preguntas de la reflexión semanal. */
export type ReflectionQuestion = 'wentWell' | 'wasHard' | 'nextFocus';

/**
 * Reflexión de una semana (documento `weeklyReflections/{weekStartDateKey}`), de lunes a domingo.
 * Se escribe desde el domingo de esa semana en adelante.
 */
export interface WeeklyReflection extends Record<ReflectionQuestion, string> {
  /** Lunes de la semana; igual al ID. */
  weekStartDateKey: DateKey;
}

/**
 * Alcancía (documento `meta/savings`): puntos reservados para una recompensa. Siguen en el saldo,
 * pero no se pueden gastar en otra cosa. Una sola a la vez.
 */
export interface SavingsJar {
  /** null = sin alcancía. */
  rewardId: string | null;
  points: number;
  startedDateKey: DateKey | null;
}
