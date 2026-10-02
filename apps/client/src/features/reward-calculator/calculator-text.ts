// Textos de la calculadora de recompensas (fase 21). Cifras siempre con contexto.

/** Cuánto presupuesto hace falta para pagarla. */
export function moneyTimeText(budgetMonths: number): string {
  if (budgetMonths <= 1) return 'Entra en tu presupuesto de un mes.';
  return `Juntas el dinero en ${Math.ceil(budgetMonths)} meses de presupuesto.`;
}

/** Cuándo alcanzan los puntos al ritmo real (`daysToAfford` y `dailyPointsPace`). */
export function pointsTimeText(days: number | null, pace: number | null): string {
  if (days === 0) return 'Ya te alcanzan los puntos.';
  if (days === null || pace === null)
    return 'Todavía no hay días cerrados para medir tu ritmo de puntos.';
  const rhythm = `A tu ritmo (${Math.round(pace)} pts por día)`;
  return days === 1 ? `${rhythm}, en 1 día.` : `${rhythm}, en unos ${days} días.`;
}

/** Puntos por Bs con un decimal como mucho: '5' o '3,3'. */
export function rateText(pointsPerBs: number): string {
  return String(Math.round(pointsPerBs * 10) / 10).replace('.', ',');
}

/** Un monto entero en Bs escrito en un campo, o null si no lo es. */
export function parseWholeAmount(text: string): number | null {
  const trimmed = text.trim();
  return /^\d+$/.test(trimmed) ? Number(trimmed) : null;
}
