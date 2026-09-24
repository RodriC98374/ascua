// Hitos de racha: insignias a los 7, 30, 100 y 365 días. Se derivan de la mejor racha, así que no
// se guardan: una insignia ganada no se pierde aunque la racha vuelva a empezar.
import { STREAK_MILESTONES, type StreakMilestone } from './constants';

/** El hito que se alcanza al pasar la racha de `from` a `to` días (el mayor si cruza varios). */
export function milestoneReached(from: number, to: number): StreakMilestone | null {
  const crossed = STREAK_MILESTONES.filter((days) => from < days && days <= to);
  return crossed.at(-1) ?? null;
}

export interface MilestoneProgress {
  /** Mejor racha, contando la actual si ya la supera. */
  best: number;
  earned: StreakMilestone[];
  /** El primer hito sin ganar y cuántos días le faltan a la racha actual; null tras el último. */
  next: { days: StreakMilestone; remaining: number } | null;
}

export function milestoneProgress(longestStreak: number, currentStreak: number): MilestoneProgress {
  const best = Math.max(longestStreak, currentStreak);
  const earned = STREAK_MILESTONES.filter((days) => days <= best);
  const nextDays = STREAK_MILESTONES.find((days) => days > best);
  return {
    best,
    earned,
    next: nextDays === undefined ? null : { days: nextDays, remaining: nextDays - currentStreak },
  };
}
