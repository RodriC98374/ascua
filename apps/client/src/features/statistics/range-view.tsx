import {
  addDays,
  bestWeekdays,
  buildRangeStats,
  completionRateOf,
  completionTrend,
  formatShortWeekday,
  mostConsistentHabit,
  toMonthKey,
  type DailyLog,
  type DateKey,
  type HabitRecord,
  type MonthlySummary,
  type Period,
  type TaskRecord,
} from '@ascua/shared';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { useDailyLogsInRange, useMonthlySummary, useTasksInRange } from '@/data/hooks';
import { TaskWeek } from '@/features/tasks/task-week';
import { useThemeColors } from '@/theme/colors';

import { rangeCheckInSlots } from './chart-data';
import { CheckInSummary } from './check-in-summary';
import { DayDetail } from './day-detail';
import { HabitBars } from './habit-bars';
import { HabitDonut } from './habit-donut';
import { HabitGrid } from './habit-grid';
import { InsightsCard, type TrendInsight } from './insights-card';
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

/**
 * Una semana: 7 registros diarios y sus tareas. La semana no tiene resumen propio, así que no sabe
 * los gastos.
 */
export function WeekView(props: RangeViewProps) {
  const logs = useDailyLogsInRange(props.uid, props.period.startDateKey, props.period.endDateKey);
  const tasks = useTasksInRange(props.uid, props.period.startDateKey, props.period.endDateKey);
  return (
    <RangeContent
      {...props}
      kind="week"
      logs={logs.data}
      tasks={tasks.data}
      isLoading={logs.isLoading || tasks.isLoading}
      pointsSpent={null}
    />
  );
}

/**
 * Un mes: sus registros diarios (≤ 31), su resumen mensual (de ahí salen los gastos) y el del mes
 * anterior, para la tendencia.
 */
export function MonthView(props: RangeViewProps) {
  const logs = useDailyLogsInRange(props.uid, props.period.startDateKey, props.period.endDateKey);
  const summary = useMonthlySummary(props.uid, toMonthKey(props.period.startDateKey));
  const previous = useMonthlySummary(props.uid, toMonthKey(addDays(props.period.startDateKey, -1)));
  return (
    <RangeContent
      {...props}
      kind="month"
      logs={logs.data}
      isLoading={logs.isLoading}
      pointsSpent={summary.data?.pointsSpent ?? 0}
      previousSummary={previous.data ?? null}
    />
  );
}

/** El % de este mes contra el anterior; null si alguno no tiene días cerrados. */
function monthTrend(
  monthKey: string,
  currentRate: number | null,
  previous: MonthlySummary | null,
): TrendInsight | null {
  const previousRate = previous ? completionRateOf(previous.habitStats) : null;
  if (!previous || currentRate === null || previousRate === null) return null;
  return {
    points: completionTrend(currentRate, previousRate) ?? 0,
    monthKey,
    previousMonthKey: previous.monthKey,
    currentRate,
    previousRate,
  };
}

function RangeContent({
  kind,
  period,
  today,
  habits,
  logs,
  tasks,
  isLoading,
  pointsSpent,
  previousSummary = null,
}: RangeViewProps & {
  kind: 'week' | 'month';
  logs: readonly DailyLog[];
  /** Solo la semana las muestra. */
  tasks?: readonly TaskRecord[];
  isLoading: boolean;
  pointsSpent: number | null;
  /** Solo el mes: el resumen del mes anterior, para la tendencia. */
  previousSummary?: MonthlySummary | null;
}) {
  const colors = useThemeColors();
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
          <HabitDonut stats={stats} selectedHabitId={selectedHabitId} onSelectHabit={toggleHabit} />
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
          <InsightsCard
            bestWeekdays={bestWeekdays(stats.days)}
            mostConsistent={mostConsistentHabit(stats.habits)}
            trend={monthTrend(
              toMonthKey(period.startDateKey),
              stats.completionRate,
              previousSummary,
            )}
          />
        </>
      )}
      <HabitBars
        title="Cada hábito"
        rows={stats.habits}
        selectedHabitId={selectedHabitId}
        onSelectHabit={toggleHabit}
      />
      <CheckInSummary
        averages={stats.checkIn.averages}
        slots={rangeCheckInSlots(
          stats.days.map((day) => day.dateKey),
          stats.checkIn.days,
          kind,
        )}
        caption="Promedio de los días que contestaste, hoy incluido."
        describeSlotName={(slot) => formatShortWeekday(slot.key)}
      />
      {tasks && <TaskWeek tasks={tasks} period={period} today={today} />}
    </View>
  );
}
