import type { MonthlyCounters } from '@ascua/shared';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';

import { DayDot } from './day-dot';
import {
  formatPercent,
  habitDaysLine,
  percentValue,
  pointsLine,
  summaryTiles,
} from './statistics-text';

/**
 * Cabecera del periodo: % de hábitos cumplidos, días por estado y puntos. Cuenta solo los
 * días cerrados, los mismos que suma el resumen mensual.
 */
export function PeriodSummary({
  counters,
  completionRate,
  pointsSpent,
  isCurrent,
}: {
  counters: MonthlyCounters;
  completionRate: number | null;
  /** null si el periodo no lo sabe (la semana no tiene resumen propio). */
  pointsSpent: number | null;
  /** El periodo incluye hoy, que todavía no cuenta. */
  isCurrent: boolean;
}) {
  if (counters.closedDays === 0) {
    return (
      <Card className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Todavía sin días cerrados</Text>
        <Text className="font-body text-body text-ink-muted">
          Cada día se suma aquí cuando la app lo cierra, al día siguiente.
        </Text>
      </Card>
    );
  }
  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Text className="font-heading-extrabold text-display-lg text-ink">
          {formatPercent(completionRate)}
        </Text>
        <Text className="font-body-semibold text-body text-ink">{habitDaysLine(counters)}</Text>
      </View>
      <ProgressBar value={percentValue(completionRate)} />
      <View className="flex-row flex-wrap gap-y-3">
        {summaryTiles(counters).map((tile) => (
          <View key={tile.status} className="w-1/2 flex-row items-center gap-2 pr-2">
            <DayDot status={tile.status} size={12} />
            <Text className="font-heading text-heading-md text-ink">{tile.count}</Text>
            <Text className="font-body text-caption text-ink-muted flex-1">{tile.label}</Text>
          </View>
        ))}
      </View>
      <View className="border-border gap-1 border-t pt-3">
        <Text className="font-body-bold text-body text-ember-strong">
          {pointsLine(counters.pointsEarned, pointsSpent)}
        </Text>
        {isCurrent && (
          <Text className="font-body text-caption text-ink-muted">
            Hoy se suma cuando la app cierre el día.
          </Text>
        )}
      </View>
    </Card>
  );
}
