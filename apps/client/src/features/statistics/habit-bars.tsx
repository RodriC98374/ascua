import { strongHabitColor, type HabitPeriodStats, type HabitRecord } from '@ascua/shared';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';

import { formatPercent, habitCaption, percentValue } from './statistics-text';

/** Cumplimiento de cada hábito en el periodo (solo días cerrados). Tocar uno lo resalta. */
export function HabitBars({
  title,
  rows,
  selectedHabitId,
  onSelectHabit,
}: {
  title: string;
  rows: readonly HabitPeriodStats<HabitRecord>[];
  selectedHabitId: string | null;
  onSelectHabit: (habitId: string) => void;
}) {
  return (
    <Card className="gap-2">
      <Text className="font-heading text-heading-md text-ink">{title}</Text>
      {rows.length === 0 ? (
        <Text className="font-body text-body text-ink-muted">
          Aquí verás cuánto cumples cada hábito.
        </Text>
      ) : (
        rows.map((row) => {
          const isSelected = row.habit.id === selectedHabitId;
          return (
            <Pressable
              key={row.habit.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${row.habit.name}: ${formatPercent(row.completionRate)}, ${habitCaption(row)}`}
              onPress={() => onSelectHabit(row.habit.id)}
              className={`-mx-2 gap-1.5 rounded-md px-2 py-2 ${isSelected ? 'bg-warning-soft' : 'active:bg-surface-300'}`}
            >
              <View className="flex-row items-center justify-between gap-3">
                <View
                  className="h-2.5 w-2.5 rounded-full border"
                  style={{
                    backgroundColor: row.habit.color,
                    borderColor: strongHabitColor(row.habit.color),
                  }}
                />
                <Text numberOfLines={1} className="font-body-semibold text-body text-ink flex-1">
                  {row.habit.name}
                </Text>
                <Text className="font-body-bold text-body text-ink-muted">
                  {formatPercent(row.completionRate)}
                </Text>
              </View>
              <ProgressBar value={percentValue(row.completionRate)} color={row.habit.color} />
              <Text className="font-body text-caption text-ink-muted">{habitCaption(row)}</Text>
            </Pressable>
          );
        })
      )}
    </Card>
  );
}
