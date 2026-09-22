import {
  formatLongDate,
  type DayStats,
  type HabitPeriodStats,
  type HabitRecord,
} from '@ascua/shared';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { CheckIcon, CloseIcon } from '@/components/ui/icons';
import { colors } from '@/theme/colors';

import { describeDay } from './statistics-text';
import { StatusChip } from './status-chip';

/** El día elegido en la grilla o en una gráfica: estado, cifras y qué hábitos se cumplieron. */
export function DayDetail({
  day,
  rows,
  onClose,
}: {
  day: DayStats;
  rows: readonly HabitPeriodStats<HabitRecord>[];
  onClose: () => void;
}) {
  const habitsOfDay = rows.filter((row) => day.habits[row.habit.id] !== undefined);
  return (
    <Card className="gap-3">
      <View className="flex-row items-start gap-2">
        <View className="flex-1 gap-2">
          <Text className="font-heading text-heading-md text-ink">
            {formatLongDate(day.dateKey)}
          </Text>
          <StatusChip status={day.status} isToday={day.isToday} />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Cerrar el detalle del día"
          onPress={onClose}
          className="active:bg-surface-300 -mr-2 -mt-2 h-11 w-11 items-center justify-center rounded-full"
        >
          <CloseIcon size={18} color={colors.inkMuted} />
        </Pressable>
      </View>
      <Text className="font-body text-body text-ink">{describeDay(day)}</Text>
      {habitsOfDay.length > 0 && (
        <View className="gap-2">
          {habitsOfDay.map((row) => {
            const isDone = day.habits[row.habit.id] === 'done';
            return (
              <View key={row.habit.id} className="flex-row items-center gap-2">
                <View className="h-4 w-4 items-center justify-center">
                  {isDone ? (
                    <CheckIcon size={16} color={colors.success} />
                  ) : (
                    <View className="border-border h-2.5 w-2.5 rounded-full border-[1.5px]" />
                  )}
                </View>
                <Text
                  className={`font-body text-body flex-1 ${isDone ? 'text-ink' : 'text-ink-muted'}`}
                >
                  {row.habit.name}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </Card>
  );
}
