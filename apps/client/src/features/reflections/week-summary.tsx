import { buildRangeStats, reflectionWeekEnd, type DateKey, type HabitRecord } from '@ascua/shared';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { useDailyLogsInRange, useTasksInRange } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { CHECK_IN_LABELS, formatCheckInAverage } from '@/features/check-in/check-in-text';

/** El resumen de la semana junto a la reflexión: los números para pensar sobre algo concreto. */
export function WeekSummary({
  weekStartDateKey,
  habits,
  today,
}: {
  weekStartDateKey: DateKey;
  habits: readonly HabitRecord[];
  today: DateKey;
}) {
  const uid = useUid();
  const weekEnd = reflectionWeekEnd(weekStartDateKey);
  const logs = useDailyLogsInRange(uid, weekStartDateKey, weekEnd);
  const tasks = useTasksInRange(uid, weekStartDateKey, weekEnd);
  const stats = buildRangeStats({
    startDateKey: weekStartDateKey,
    endDateKey: weekEnd,
    today,
    habits,
    logs: logs.data,
  });
  const { counters } = stats;
  const tasksDone = tasks.data.filter(
    (task) =>
      task.completedDateKey !== null &&
      task.completedDateKey >= weekStartDateKey &&
      task.completedDateKey <= weekEnd,
  ).length;
  const averages = Object.entries(stats.checkIn.averages).filter(
    (entry): entry is [keyof typeof CHECK_IN_LABELS, number] => entry[1] !== null,
  );

  const figures = [
    {
      value: stats.completionRate === null ? '—' : `${Math.round(stats.completionRate * 100)}%`,
      label: 'de tus hábitos',
    },
    { value: `${counters.completedDays} de 7`, label: 'días con la racha' },
    {
      value: String(counters.perfectDays),
      label: counters.perfectDays === 1 ? 'día perfecto' : 'días perfectos',
    },
    { value: String(tasksDone), label: tasksDone === 1 ? 'tarea cumplida' : 'tareas cumplidas' },
  ];

  return (
    <Card className="gap-4">
      <Text className="font-body-bold text-body text-ink">Tu semana en números</Text>
      <View className="flex-row flex-wrap gap-y-4">
        {figures.map((figure) => (
          <View key={figure.label} className="w-1/2 gap-0.5">
            <Text className="font-heading-extrabold text-heading-lg text-ink">{figure.value}</Text>
            <Text className="font-body-semibold text-caption text-ink-muted">{figure.label}</Text>
          </View>
        ))}
      </View>
      {averages.length > 0 && (
        <Text className="font-body-semibold text-caption text-ink-muted">
          Cómo te sentiste:{' '}
          {averages
            .map(
              ([dimension, value]) =>
                `${CHECK_IN_LABELS[dimension].name} ${formatCheckInAverage(value)}`,
            )
            .join(' · ')}
        </Text>
      )}
      {counters.frozenDays > 0 && (
        <Text className="font-body-semibold text-caption text-protegido">
          Un protector cuidó tu racha{' '}
          {counters.frozenDays === 1 ? 'un día' : `${counters.frozenDays} días`}.
        </Text>
      )}
    </Card>
  );
}
