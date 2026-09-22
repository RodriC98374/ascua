import {
  buildRangeStats,
  toMonthKey,
  type DailyLog,
  type DateKey,
  type HabitRecord,
  type Period,
} from '@ascua/shared';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { useDailyLogsInRange, useMonthlySummary } from '@/data/hooks';
import { colors } from '@/theme/colors';

import { DayDetail } from './day-detail';
import { HabitBars } from './habit-bars';
import { HabitGrid } from './habit-grid';
import { PeriodSummary } from './period-summary';
import { StateLegend } from './state-legend';
import { StreakChart } from './streak-chart';
import { WeekChart } from './week-chart';

interface RangeViewProps {
  uid: string;
  period: Period;
  today: DateKey;
  /** Todos los hábitos, activos y archivados. */
  habits: readonly HabitRecord[];
}

/** Una semana: 7 registros diarios. La semana no tiene resumen propio, así que no sabe los gastos. */
export function WeekView(props: RangeViewProps) {
  const logs = useDailyLogsInRange(props.uid, props.period.startDateKey, props.period.endDateKey);
  return (
    <RangeContent
      {...props}
      kind="week"
      logs={logs.data}
      isLoading={logs.isLoading}
      pointsSpent={null}
    />
  );
}

/** Un mes: sus registros diarios (≤ 31) y su resumen mensual, del que salen los gastos. */
export function MonthView(props: RangeViewProps) {
  const logs = useDailyLogsInRange(props.uid, props.period.startDateKey, props.period.endDateKey);
  const summary = useMonthlySummary(props.uid, toMonthKey(props.period.startDateKey));
  return (
    <RangeContent
      {...props}
      kind="month"
      logs={logs.data}
      isLoading={logs.isLoading}
      pointsSpent={summary.data?.pointsSpent ?? 0}
    />
  );
}

function RangeContent({
  kind,
  period,
  today,
  habits,
  logs,
  isLoading,
  pointsSpent,
}: RangeViewProps & {
  kind: 'week' | 'month';
  logs: readonly DailyLog[];
  isLoading: boolean;
  pointsSpent: number | null;
}) {
  const [selectedDateKey, setSelectedDateKey] = useState<DateKey | null>(null);
  const [selectedHabitId, setSelectedHabitId] = useState<string | null>(null);

  if (isLoading) {
    return <ActivityIndicator color={colors.emberStrong} />;
  }

  const stats = buildRangeStats({
    startDateKey: period.startDateKey,
    endDateKey: period.endDateKey,
    today,
    habits,
    logs,
  });
  const selectedDay = stats.days.find((day) => day.dateKey === selectedDateKey);
  const isCurrent = period.startDateKey <= today && today <= period.endDateKey;

  const toggleDay = (dateKey: DateKey) =>
    setSelectedDateKey((current) => (current === dateKey ? null : dateKey));
  const toggleHabit = (habitId: string) =>
    setSelectedHabitId((current) => (current === habitId ? null : habitId));

  const grid = (
    <Card className="gap-4">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Hábito por hábito</Text>
        <Text className="font-body text-caption text-ink-muted">
          Toca un día para ver su detalle, o un hábito para resaltarlo.
        </Text>
      </View>
      <StateLegend />
      {stats.habits.length === 0 ? (
        <Text className="font-body text-body text-ink-muted">
          No tenías hábitos en estas fechas.
        </Text>
      ) : (
        <HabitGrid
          kind={kind}
          days={stats.days}
          rows={stats.habits}
          selectedDateKey={selectedDateKey}
          onSelectDay={toggleDay}
          selectedHabitId={selectedHabitId}
          onSelectHabit={toggleHabit}
        />
      )}
    </Card>
  );

  const detail = selectedDay && (
    <DayDetail day={selectedDay} rows={stats.habits} onClose={() => setSelectedDateKey(null)} />
  );

  return (
    <View className="gap-6">
      <PeriodSummary
        counters={stats.counters}
        completionRate={stats.completionRate}
        pointsSpent={pointsSpent}
        isCurrent={isCurrent}
      />
      {kind === 'week' ? (
        <>
          <Card className="gap-1">
            <Text className="font-heading text-heading-md text-ink">Cada día</Text>
            <Text className="font-body text-caption text-ink-muted">
              El % de hábitos cumplidos, con el color del estado del día. Toca una barra.
            </Text>
            <WeekChart
              days={stats.days}
              selectedDateKey={selectedDateKey}
              onSelectDay={toggleDay}
            />
          </Card>
          {detail}
          {grid}
        </>
      ) : (
        <>
          {grid}
          {detail}
          <StreakChart
            days={stats.days}
            selectedDateKey={selectedDateKey}
            onSelectDay={toggleDay}
          />
        </>
      )}
      <HabitBars
        title="Cada hábito"
        rows={stats.habits}
        selectedHabitId={selectedHabitId}
        onSelectHabit={toggleHabit}
      />
    </View>
  );
}
