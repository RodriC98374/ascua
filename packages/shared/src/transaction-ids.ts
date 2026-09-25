// IDs deterministas de los movimientos de puntos. Como las reglas de Firestore solo permiten
// crear (nunca sobrescribir) un movimiento, repetir una operación nunca acredita ni cobra dos veces.
import type { DateKey } from './types';

export const transactionIds = {
  habitCompletion: (dateKey: DateKey, habitId: string) => `completion_${dateKey}_${habitId}`,
  perfectDay: (dateKey: DateKey) => `perfect_${dateKey}`,
  streakBonus: (everyDays: number, dateKey: DateKey) => `streak${everyDays}_${dateKey}`,
  /** Todas las tareas del día en un solo movimiento. */
  dayTasks: (dateKey: DateKey) => `tasks_${dateKey}`,
  freezePurchase: (requestId: string) => `freeze_${requestId}`,
  rewardRedemption: (requestId: string) => `redemption_${requestId}`,
} as const;
