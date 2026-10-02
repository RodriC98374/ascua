import type { HabitTier, PointTransactionType, RewardTier, TaskSize } from './types';

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

/** Hitos de racha con insignia propia (fase 12). Distintos de los bonos: se ganan una vez. */
export const STREAK_MILESTONES = [7, 30, 100, 365] as const;
export type StreakMilestone = (typeof STREAK_MILESTONES)[number];

export const STREAK_FREEZE_COST = 150;
export const MAX_STREAK_FREEZES = 2;

/**
 * Puntos por tarea cumplida según su tamaño (decisión D19). Pasan al saldo al cerrar el día, todas
 * juntas y con `DAILY_TASK_POINTS_CAP` como máximo.
 */
export const TASK_POINTS: Readonly<Record<TaskSize, number>> = { small: 5, medium: 10, large: 20 };

/** Tope diario de puntos por tareas: lo que valen los 3 principales. Nunca pesan más que los hábitos. */
export const DAILY_TASK_POINTS_CAP = 30;

/** Largo del título de una tarea. Las reglas aceptan desde 1; la UI pide 2. */
export const TASK_TITLE_MIN_LENGTH = 2;
export const TASK_TITLE_MAX_LENGTH = 80;

/**
 * Días hacia adelante que se programan los recordatorios locales. La app los reprograma cada vez
 * que se abre, así que solo dejan de llegar si pasa todo este tiempo sin abrirla.
 */
export const REMINDER_PLAN_DAYS = 30;

/**
 * Días hacia adelante de los recordatorios por hábito (D23): menos que los generales, porque
 * Android limita las alarmas por app (~500) y cada hábito suma una por día.
 */
export const HABIT_REMINDER_PLAN_DAYS = 7;

/**
 * Mínimos de los destacados de Mes y Año (fase 17): días cerrados de un día de la semana para
 * compararlo, y días de un hábito para elegirlo como el más constante.
 */
export const INSIGHT_MIN_WEEKDAY_DAYS = 2;
export const INSIGHT_MIN_HABIT_DAYS = 5;

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

/** Escala del check-in diario (D22). Los mismos límites que validan las reglas. */
export const CHECK_IN_MIN = 1;
export const CHECK_IN_MAX = 5;

/** Frecuencia y cantidad de un hábito (D20). Los mismos límites que validan las reglas. */
export const TIMES_PER_WEEK_MIN = 1;
export const TIMES_PER_WEEK_MAX = 6;
export const TARGET_AMOUNT_MIN = 2;
export const TARGET_AMOUNT_MAX = 999;
export const TARGET_UNIT_MAX_LENGTH = 20;

/** Metas (fase 18, D25). Los mismos límites que validan las reglas. */
export const GOAL_TITLE_MIN_LENGTH = 2;
export const GOAL_TITLE_MAX_LENGTH = 60;
export const GOAL_DESCRIPTION_MAX_LENGTH = 200;
export const MAX_GOAL_HABITS = 10;
export const MAX_GOAL_TASKS = 50;
/** La constancia de los hábitos de una meta mira como mucho un año atrás (lecturas acotadas). */
export const GOAL_HABIT_LOOKBACK_DAYS = 365;

/** Largo máximo de cada respuesta de la reflexión semanal (fase 18). */
export const REFLECTION_ANSWER_MAX_LENGTH = 500;

/**
 * Pasos de un hábito (fase 21, D27): con pasos, el hábito se cumple al marcarlos todos. Los mismos
 * límites valida `firestore.rules`. Menos de dos pasos no es una lista: es el hábito mismo.
 */
export const HABIT_STEPS_MIN = 2;
/** Las reglas revisan cada paso por su índice: con más, la escritura pasa el límite de Firestore. */
export const HABIT_STEPS_MAX = 6;
export const HABIT_STEP_TITLE_MAX_LENGTH = 60;
/** Largo máximo del id de un paso, que genera la app. */
export const HABIT_STEP_ID_MAX_LENGTH = 20;
