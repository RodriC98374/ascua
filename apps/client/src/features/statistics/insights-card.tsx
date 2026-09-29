import {
  formatMonthName,
  type BestWeekdays,
  type HabitPeriodStats,
  type HabitRecord,
  type MonthKey,
} from '@ascua/shared';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';

import { bestWeekdaysLine, formatPercent, habitCaption, trendLine } from './statistics-text';

export interface TrendInsight {
  /** Diferencia en puntos porcentuales. */
  points: number;
  monthKey: MonthKey;
  previousMonthKey: MonthKey;
  currentRate: number;
  previousRate: number;
}

interface InsightsCardProps {
  bestWeekdays: BestWeekdays | null;
  mostConsistent: HabitPeriodStats<HabitRecord> | null;
  /** Solo en el mes. */
  trend?: TrendInsight | null;
}

const monthName = (monthKey: MonthKey) => formatMonthName(monthKey).toLowerCase();

function Insight({ label, value, caption }: { label: string; value: ReactNode; caption: string }) {
  return (
    <View className="gap-0.5">
      <Text className="font-body-bold text-label text-ink-muted uppercase">{label}</Text>
      {value}
      <Text className="font-body text-caption text-ink-muted">{caption}</Text>
    </View>
  );
}

/** Mejor día de la semana, hábito más constante y, en el mes, cómo va contra el anterior. */
export function InsightsCard({ bestWeekdays, mostConsistent, trend }: InsightsCardProps) {
  const isEmpty = !bestWeekdays && !mostConsistent && !trend;
  return (
    <Card className="gap-4">
      <Text className="font-heading text-heading-md text-ink">Destacados</Text>
      {isEmpty && (
        <Text className="font-body text-body text-ink-muted">
          Con unos días más cerrados verás aquí tu mejor día y tu hábito más constante.
        </Text>
      )}
      {trend && (
        <Insight
          label="Contra el mes anterior"
          value={
            <Text
              className={`font-heading text-heading-sm ${trend.points > 0 ? 'text-success' : 'text-ink'}`}
            >
              {trendLine(trend.points, trend.previousMonthKey)}
            </Text>
          }
          caption={`Hábitos cumplidos: ${formatPercent(trend.currentRate)} en ${monthName(trend.monthKey)} y ${formatPercent(trend.previousRate)} en ${monthName(trend.previousMonthKey)}.`}
        />
      )}
      {bestWeekdays && (
        <Insight
          label={bestWeekdays.weekdays.length > 1 ? 'Tus mejores días' : 'Tu mejor día'}
          value={
            <Text className="font-heading text-heading-sm text-ink">
              {bestWeekdaysLine(bestWeekdays.weekdays)}
            </Text>
          }
          caption={`${formatPercent(bestWeekdays.completionRate)} de tus hábitos, en promedio, en los días cerrados.`}
        />
      )}
      {mostConsistent && (
        <Insight
          label="Tu hábito más constante"
          value={
            <View className="flex-row items-center gap-2">
              <View
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: mostConsistent.habit.color }}
              />
              <Text className="font-heading text-heading-sm text-ink flex-1" numberOfLines={1}>
                {mostConsistent.habit.name}
              </Text>
            </View>
          }
          caption={`${formatPercent(mostConsistent.completionRate)} · ${habitCaption(mostConsistent)}`}
        />
      )}
    </Card>
  );
}
