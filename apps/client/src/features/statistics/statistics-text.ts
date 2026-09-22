// Textos de las vistas de progreso: cifras siempre con su contexto (guía de voz del diseño).
import type { DayStats, DayStatsStatus, HabitPeriodStats, MonthlyCounters } from '@ascua/shared';

export const DAY_STATUS_LABELS: Record<DayStatsStatus, string> = {
  completed: 'Cumplido',
  perfect: 'Día perfecto',
  frozen: 'Protegido',
  missed: 'Perdido',
  inactive: 'Sin hábitos',
  open: 'En curso',
  no_data: 'Sin datos',
  future: 'Por venir',
};

/** '67%'; una raya si no hay nada que medir. */
export function formatPercent(rate: number | null): string {
  return rate === null ? '—' : `${Math.round(rate * 100)}%`;
}

/** 0..100 para las barras; 0 si no hay nada que medir. */
export function percentValue(rate: number | null): number {
  return rate === null ? 0 : Math.round(rate * 100);
}

export function plural(count: number, singular: string, pluralForm: string): string {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}

function habitsOfDay(day: DayStats): string {
  return `${day.completedCount} de ${plural(day.scheduledCount, 'hábito', 'hábitos')}`;
}

/** Lo que pasó un día, en una línea, para el detalle del día elegido. */
export function describeDay(day: DayStats): string {
  switch (day.status) {
    case 'future':
      return 'Este día todavía no llega.';
    case 'no_data':
      return 'Todavía no tenías hábitos.';
    case 'inactive':
      return 'No tenías hábitos ese día.';
    case 'open':
      return day.isToday
        ? `${habitsOfDay(day)} hasta ahora. Se suma al cerrar el día.`
        : `${habitsOfDay(day)}. Se suma en cuanto la app cierre el día.`;
    case 'completed':
    case 'perfect':
    case 'frozen':
    case 'missed': {
      const base = `${habitsOfDay(day)} (${formatPercent(day.completionRate)}) · +${day.pointsEarned ?? 0} pts`;
      const streak = plural(day.streakAfterClose ?? 0, 'día', 'días');
      if (day.status === 'missed') return base;
      if (day.status === 'frozen') return `${base} · un protector cuidó tu racha de ${streak}`;
      return `${base} · racha de ${streak}`;
    }
  }
}

/** '18 de 21 días', o que todavía no tiene días cerrados. */
export function habitCaption(row: HabitPeriodStats): string {
  if (row.scheduledDays === 0) {
    return 'Cuenta desde que cierre su primer día';
  }
  return `${row.completedDays} de ${plural(row.scheduledDays, 'día', 'días')}`;
}

/** Hábitos-día cumplidos del periodo: '142 de 180 hábitos cumplidos en 30 días'. */
export function habitDaysLine(counters: MonthlyCounters): string {
  let scheduled = 0;
  let completed = 0;
  for (const stats of Object.values(counters.habitStats)) {
    scheduled += stats.scheduledDays;
    completed += stats.completedDays;
  }
  return `${completed} de ${scheduled} hábitos cumplidos en ${plural(counters.closedDays, 'día', 'días')}`;
}

export interface SummaryTile {
  status: 'perfect' | 'completed' | 'frozen' | 'missed';
  count: number;
  label: string;
}

/** Los días cerrados por estado; "cumplidos" no incluye los perfectos, como en la grilla. */
export function summaryTiles(counters: MonthlyCounters): SummaryTile[] {
  const onlyCompleted = counters.completedDays - counters.perfectDays;
  const tile = (
    status: SummaryTile['status'],
    count: number,
    singular: string,
    pluralForm: string,
  ): SummaryTile => ({ status, count, label: count === 1 ? singular : pluralForm });
  return [
    tile('perfect', counters.perfectDays, 'día perfecto', 'días perfectos'),
    tile('completed', onlyCompleted, 'día cumplido', 'días cumplidos'),
    tile('frozen', counters.frozenDays, 'día protegido', 'días protegidos'),
    tile('missed', counters.missedDays, 'día perdido', 'días perdidos'),
  ];
}

/** Fila de un mes en la vista del año: '30 días cerrados · 5 perfectos'. */
export function monthCaption(counters: MonthlyCounters): string {
  return `${plural(counters.closedDays, 'día cerrado', 'días cerrados')} · ${plural(counters.perfectDays, 'perfecto', 'perfectos')}`;
}

/** '+320 pts ganados · 150 gastados'. Sin gastos conocidos (semana), solo lo ganado. */
export function pointsLine(earned: number, spent: number | null): string {
  const gained = `+${earned} pts ganados`;
  return spent ? `${gained} · ${spent} gastados` : gained;
}
