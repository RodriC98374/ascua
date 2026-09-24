import {
  buildYearStats,
  formatMonthYear,
  strongHabitColor,
  type DateKey,
  type HabitRecord,
  type MonthKey,
  type MonthStats,
  type Period,
} from '@ascua/shared';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ChevronIcon } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useGamificationState, useMonthlySummaries } from '@/data/hooks';
import { useActiveColorScheme, useThemeColors } from '@/theme/colors';

import { monthRate, yearPoints } from './chart-data';
import { TouchLineChart } from './chart-parts';
import { CategoryRadar } from './category-radar';
import { HabitBars } from './habit-bars';
import { PeriodSummary } from './period-summary';
import { formatPercent, monthCaption, percentValue, plural } from './statistics-text';

/** Un año desde los resúmenes mensuales (≤ 12 documentos). Tocar un mes lleva a su vista. */
export function YearView({
  uid,
  period,
  today,
  habits,
  onOpenMonth,
}: {
  uid: string;
  period: Period;
  today: DateKey;
  habits: readonly HabitRecord[];
  onOpenMonth: (monthKey: MonthKey) => void;
}) {
  const colors = useThemeColors();
  const isDark = useActiveColorScheme() === 'dark';
  const year = period.startDateKey.slice(0, 4);
  const summaries = useMonthlySummaries(uid, year);
  const gamification = useGamificationState(uid);
  const [selectedMonthKey, setSelectedMonthKey] = useState<MonthKey | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  if (summaries.isLoading) {
    return <ActivityIndicator color={colors.emberStrong} />;
  }

  const stats = buildYearStats({ year, summaries: summaries.data, habits });
  // Elegir un hábito filtra la gráfica y los meses a ese hábito.
  const selectedHabit = stats.habits.find((row) => row.habit.id === selectedHabitId)?.habit;
  const habitFilter = selectedHabit?.id ?? null;
  const points = yearPoints(stats.months, habitFilter);
  const monthsWithData = stats.months.filter((month) => monthRate(month, habitFilter) !== null);
  const state = gamification.data;

  function monthRowCaption(month: MonthStats): string {
    const habitStats = habitFilter ? month.habitStats[habitFilter] : undefined;
    return habitStats
      ? `${habitStats.completedDays} de ${plural(habitStats.scheduledDays, 'día', 'días')}`
      : monthCaption(month);
  }

  return (
    <View className="gap-6">
      <PeriodSummary
        counters={stats.counters}
        completionRate={stats.completionRate}
        pointsSpent={stats.counters.pointsSpent}
        isCurrent={today.startsWith(year)}
      />

      {state && state.longestStreak > 0 && (
        <Card className="flex-row gap-4">
          <View className="flex-1 gap-0.5">
            <Text className="font-body-bold text-label text-ink-muted uppercase">Racha actual</Text>
            <Text className="font-heading text-heading-lg text-ember-strong">
              {plural(state.currentStreak, 'día', 'días')}
            </Text>
          </View>
          <View className="flex-1 gap-0.5">
            <Text className="font-body-bold text-label text-ink-muted uppercase">
              Tu mejor racha
            </Text>
            <Text className="font-heading text-heading-lg text-ink">
              {plural(state.longestStreak, 'día', 'días')}
            </Text>
          </View>
        </Card>
      )}

      <Card className="gap-2">
        <View className="gap-1">
          <Text className="font-heading text-heading-md text-ink">
            {selectedHabit ? `Cada mes: ${selectedHabit.name}` : 'Cada mes'}
          </Text>
          {monthsWithData.length > 0 && (
            <Text className="font-body text-caption text-ink-muted">
              {selectedHabit
                ? 'Solo este hábito. Tócalo otra vez abajo para ver todos.'
                : '% de hábitos cumplidos. Toca la gráfica, o un mes para verlo entero.'}
            </Text>
          )}
        </View>
        {monthsWithData.length === 0 ? (
          <Text className="font-body text-body text-ink-muted">
            Aquí verás cómo te fue cada mes del año.
          </Text>
        ) : (
          <>
            {points.length >= 2 && (
              <>
                <TouchLineChart
                  points={points}
                  maxValue={100}
                  noOfSections={4}
                  yAxisLabelSuffix="%"
                  // El tono oscuro del hábito se pierde sobre el fondo oscuro: ahí va el pastel.
                  color={
                    selectedHabit &&
                    (isDark ? selectedHabit.color : strongHabitColor(selectedHabit.color))
                  }
                  areaColor={selectedHabit?.color}
                  selectedIndex={points.findIndex((point) => point.monthKey === selectedMonthKey)}
                  onSelect={(index) => setSelectedMonthKey(points[index]?.monthKey ?? null)}
                  describePoint={(index) => {
                    const point = points[index];
                    return point ? `${point.label}: ${point.value}%` : '';
                  }}
                />
              </>
            )}
            {monthsWithData.map((month) => {
              const isSelected = month.monthKey === selectedMonthKey;
              const rate = monthRate(month, habitFilter);
              return (
                <Pressable
                  key={month.monthKey}
                  accessibilityRole="button"
                  accessibilityLabel={`Ver ${formatMonthYear(month.monthKey)}: ${formatPercent(rate)}`}
                  onPress={() => onOpenMonth(month.monthKey)}
                  className={`-mx-2 flex-row items-center gap-3 rounded-md px-2 py-2 ${isSelected ? 'bg-warning-soft' : 'active:bg-surface-300'}`}
                >
                  <View className="flex-1 gap-1.5">
                    <View className="flex-row items-baseline justify-between gap-3">
                      <Text className="font-body-semibold text-body text-ink">
                        {formatMonthYear(month.monthKey)}
                      </Text>
                      <Text className="font-body-bold text-body text-ink-muted">
                        {formatPercent(rate)}
                      </Text>
                    </View>
                    <ProgressBar value={percentValue(rate)} tone="success" />
                    <Text className="font-body text-caption text-ink-muted">
                      {monthRowCaption(month)}
                    </Text>
                  </View>
                  <ChevronIcon direction="right" size={18} color={colors.inkMuted} />
                </Pressable>
              );
            })}
          </>
        )}
      </Card>

      <CategoryRadar rows={stats.habits} />

      <HabitBars
        title="Cada hábito"
        rows={stats.habits}
        selectedHabitId={selectedHabitId}
        onSelectHabit={(habitId) =>
          setSelectedHabitId((current) => (current === habitId ? null : habitId))
        }
      />
    </View>
  );
}
