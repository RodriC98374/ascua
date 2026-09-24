// Racha en riesgo: desde la hora de "racha en riesgo" de los recordatorios y sin la meta cumplida,
// Hoy muestra cuánto falta para la medianoche de Bolivia, cuando el día se cierra.
import { msUntilNextDay, toInstant, todayDateKey } from './dates';

/**
 * save: hay racha y no hay protector; se pierde a medianoche.
 * freeze: hay racha y un protector la va a salvar (se congela sin sumar).
 * start: no hay racha que perder; es la oportunidad de encenderla.
 */
export type StreakRiskKind = 'save' | 'freeze' | 'start';

export interface StreakRisk {
  kind: StreakRiskKind;
  /** Hasta la medianoche de Bolivia. */
  msLeft: number;
}

export interface StreakRiskInput {
  now: Date;
  /** 'HH:mm' de Bolivia: la misma hora del recordatorio de racha en riesgo. */
  riskTime: string;
  isGoalMet: boolean;
  hasPrimaries: boolean;
  /** Días cerrados seguidos (sin contar hoy). */
  currentStreak: number;
  streakFreezesAvailable: number;
}

/** null si no hay nada que avisar: meta cumplida, sin principales hoy o todavía no es la hora. */
export function streakRiskAt(input: StreakRiskInput): StreakRisk | null {
  if (input.isGoalMet || !input.hasPrimaries) return null;
  const riskStart = toInstant(todayDateKey(input.now), input.riskTime);
  if (input.now.getTime() < riskStart.getTime()) return null;
  const kind: StreakRiskKind =
    input.currentStreak === 0 ? 'start' : input.streakFreezesAvailable > 0 ? 'freeze' : 'save';
  return { kind, msLeft: msUntilNextDay(input.now) };
}

/** '2 h 35 min', '3 h', '35 min' o 'menos de 1 min'. Los minutos se truncan. */
export function formatTimeLeft(ms: number): string {
  const totalMinutes = Math.floor(ms / 60000);
  if (totalMinutes < 1) return 'menos de 1 min';
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}
