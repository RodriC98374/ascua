// Aviso de Hoy cuando ayer sigue abierto (día de gracia, D29): qué quedó sin marcar y qué está en
// juego. Dice lo que pasa, sin alarmas (guía de voz del diseño).

export interface GraceDayStatus {
  /** Principales de ayer sin marcar. */
  missingPrimaries: number;
  /** Secundarios y semanales de ayer sin marcar. */
  missingOthers: number;
  /** Racha oficial antes de ayer. */
  streakDays: number;
  /** Protectores disponibles antes de ayer. */
  freezes: number;
}

function daysText(days: number): string {
  return days === 1 ? '1 día' : `${days} días`;
}

/** El aviso; null si no quedó nada por marcar. */
export function graceDayMessage({
  missingPrimaries,
  missingOthers,
  streakDays,
  freezes,
}: GraceDayStatus): string | null {
  if (missingPrimaries > 0) {
    const one = missingPrimaries === 1;
    const missed = one
      ? 'Ayer te faltó 1 principal.'
      : `Ayer te faltaron ${missingPrimaries} principales.`;
    const mark = one ? 'Márcalo' : 'Márcalos';
    if (streakDays === 0) return `${missed} ${mark} hasta las 00:00 para que ayer cuente.`;
    const streak = `tu racha de ${daysText(streakDays)}`;
    return freezes > 0
      ? `${missed} ${mark} hasta las 00:00 o se usará un protector para cuidar ${streak}.`
      : `${missed} ${mark} hasta las 00:00 y ${streak} sigue viva.`;
  }
  if (missingOthers > 0) {
    return missingOthers === 1
      ? 'Ayer quedó 1 hábito sin marcar. Aún suma puntos hasta las 00:00.'
      : `Ayer quedaron ${missingOthers} hábitos sin marcar. Aún suman puntos hasta las 00:00.`;
  }
  return null;
}
