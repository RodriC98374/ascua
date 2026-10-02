// Calculadora de recompensas (fase 21): sugiere el costo en puntos a partir del precio en dinero.
// La tasa sale de igualar un mes perfecto sin tareas con el presupuesto mensual para gustos: así
// un mes perfecto compra el presupuesto, y sumar hábitos no abarata los premios (la tasa se
// recalcula). Solo es una sugerencia: el costo lo decide el usuario.
import { REWARD_COST_MAX } from './constants';
import { addDays, startOfWeek } from './dates';
import { evaluateDay } from './day-evaluation';
import { initialGamificationState } from './gamification-state';
import { habitStepsOf } from './habit-steps';
import type { DailyEntries, DailyLog, DateKey, Habit, HabitEntry } from './types';
import type { WeekLog } from './weekly-habits';

/** Días del "mes" de la calculadora: también es la ventana del ritmo de puntos. */
export const CALCULATOR_MONTH_DAYS = 30;

/** El costo sugerido se redondea a múltiplos de esto. */
const COST_STEP = 5;

/** La marca de un día cumplido del todo: con cantidad, la meta; con pasos, todos. */
function fullEntry(habit: Habit): HabitEntry {
  const steps = habitStepsOf(habit);
  return {
    completed: true,
    ...(habit.target ? { count: habit.target.amount } : {}),
    ...(steps.length > 0 ? { doneSteps: steps.map((step) => step.id) } : {}),
  };
}

/**
 * Puntos de 30 días seguidos con todos los hábitos activos cumplidos y sin tareas, desde el lunes
 * de la semana de `fromDateKey`. Usa `evaluateDay`, el mismo cálculo del cierre: hábitos, día
 * perfecto, bonos de racha y tope de los semanales.
 */
export function perfectMonthPoints(habits: readonly Habit[], fromDateKey: DateKey): number {
  const start = startOfWeek(fromDateKey);
  // Como si todos los hábitos activos existieran desde el primer día del mes.
  const active = habits
    .filter((habit) => habit.status === 'active')
    .map((habit) => ({ ...habit, startDateKey: start, archivedDateKey: null }));
  const entries: DailyEntries = Object.fromEntries(
    active.map((habit) => [habit.id, fullEntry(habit)]),
  );

  let state = initialGamificationState(start);
  const weekLogs: WeekLog[] = [];
  let points = 0;
  for (let day = 0; day < CALCULATOR_MONTH_DAYS; day++) {
    const dateKey = addDays(start, day);
    const evaluation = evaluateDay({ dateKey, habits: active, entries, weekLogs, state });
    points += evaluation.summary.pointsEarned;
    state = evaluation.nextState;
    weekLogs.push({ dateKey, entries });
  }
  return points;
}

export interface RewardCostInput {
  /** Precio en Bs. */
  price: number;
  /** Presupuesto mensual para gustos, en Bs. */
  monthlyBudget: number;
  /** De `perfectMonthPoints`. */
  perfectMonthPoints: number;
}

export interface RewardCostSuggestion {
  /** Tasa de cambio: puntos por cada Bs. */
  pointsPerBs: number;
  /** Costo sugerido: múltiplo de 5, entre 5 y el máximo de una recompensa. */
  cost: number;
  /** Cuántos meses de presupuesto hacen falta para pagarla. */
  budgetMonths: number;
}

/** La sugerencia, o null si falta el precio, el presupuesto o algún hábito activo. */
export function suggestRewardCost({
  price,
  monthlyBudget,
  perfectMonthPoints: monthPoints,
}: RewardCostInput): RewardCostSuggestion | null {
  if (price <= 0 || monthlyBudget <= 0 || monthPoints <= 0) return null;
  const pointsPerBs = monthPoints / monthlyBudget;
  const rounded = Math.round((price * pointsPerBs) / COST_STEP) * COST_STEP;
  return {
    pointsPerBs,
    cost: Math.min(Math.max(rounded, COST_STEP), REWARD_COST_MAX),
    budgetMonths: price / monthlyBudget,
  };
}

/**
 * Ritmo real: promedio de puntos de los días cerrados de los últimos 30 (sin contar hoy). Null si
 * todavía no hay ninguno.
 */
export function dailyPointsPace(
  logs: readonly Pick<DailyLog, 'dateKey' | 'summary'>[],
  today: DateKey,
): number | null {
  const from = addDays(today, -CALCULATOR_MONTH_DAYS);
  const points = logs.flatMap((log) =>
    log.summary && log.dateKey >= from && log.dateKey < today ? [log.summary.pointsEarned] : [],
  );
  if (points.length === 0) return null;
  return points.reduce((sum, value) => sum + value, 0) / points.length;
}

/** Días que faltan para juntar el costo al ritmo dado: 0 si ya alcanza, null si no hay ritmo. */
export function daysToAfford({
  cost,
  availablePoints,
  pace,
}: {
  cost: number;
  availablePoints: number;
  pace: number | null;
}): number | null {
  const missing = cost - availablePoints;
  if (missing <= 0) return 0;
  if (!pace || pace <= 0) return null;
  return Math.ceil(missing / pace);
}
