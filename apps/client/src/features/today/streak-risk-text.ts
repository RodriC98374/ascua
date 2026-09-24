import { formatTimeLeft, type StreakRisk } from '@ascua/shared';

import { plural } from '@/features/statistics/statistics-text';

/** Lo que dice la franja de racha en riesgo: cuánto queda y qué está en juego. */
export function streakRiskMessage(risk: StreakRisk, streakDays: number): string {
  const time = formatTimeLeft(risk.msLeft);
  const verb = /^1 (h|min)\b/.test(time) ? 'Queda' : 'Quedan';
  switch (risk.kind) {
    case 'save':
      return `${verb} ${time} para salvar tu racha de ${plural(streakDays, 'día', 'días')}.`;
    case 'freeze':
      return `${verb} ${time}. Si no cumples tus principales, un protector salvará tu racha.`;
    case 'start':
      return `${verb} ${time} para encender tu racha.`;
  }
}
