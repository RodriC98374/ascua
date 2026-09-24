import {
  strongHabitColor,
  type HabitPeriodStats,
  type HabitRecord,
  type RangeStats,
} from '@ascua/shared';
import { Pressable, Text, View } from 'react-native';
import { PieChart } from 'react-native-gifted-charts';

import { Card } from '@/components/ui/card';
import { useThemeColors } from '@/theme/colors';

import { formatPercent, plural } from './statistics-text';

const SIZE = 82;

/**
 * Reparto de lo cumplido en la semana: cada porción es un hábito, con su color. En el centro va
 * el % de la semana entera. Tocar una porción o su etiqueta resalta ese hábito, igual que la
 * grilla. Solo entran los hábitos con algún día cumplido: una porción de 0 no se ve.
 */
export function HabitDonut({
  stats,
  selectedHabitId,
  onSelectHabit,
}: {
  stats: RangeStats<HabitRecord>;
  selectedHabitId: string | null;
  onSelectHabit: (habitId: string) => void;
}) {
  const colors = useThemeColors();
  const rows = stats.habits.filter((row) => row.completedDays > 0);
  const total = rows.reduce((sum, row) => sum + row.completedDays, 0);

  return (
    <Card className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Cómo se reparte</Text>
        <Text className="font-body text-caption text-ink-muted">
          Qué hábito aportó cuánto de lo que cumpliste.
        </Text>
      </View>
      {total === 0 ? (
        <Text className="font-body text-body text-ink-muted">
          Cuando marques algo, aquí verás de dónde viene tu porcentaje.
        </Text>
      ) : (
        <View className="flex-row items-center gap-4">
          <PieChart
            data={rows.map((row) => ({
              value: row.completedDays,
              color: row.habit.color,
              // gifted-charts no dibuja borde por porción: el aro se logra separándolas.
              focused: row.habit.id === selectedHabitId,
            }))}
            donut
            radius={SIZE / 2}
            innerRadius={SIZE / 3.4}
            innerCircleColor={colors.surface200}
            sectionAutoFocus={false}
            centerLabelComponent={() => (
              <Text className="font-heading text-heading-sm text-ink">
                {formatPercent(stats.completionRate)}
              </Text>
            )}
          />
          <View className="flex-1 gap-1">
            {rows.map((row) => (
              <Slice
                key={row.habit.id}
                row={row}
                total={total}
                isSelected={row.habit.id === selectedHabitId}
                onPress={() => onSelectHabit(row.habit.id)}
              />
            ))}
          </View>
        </View>
      )}
    </Card>
  );
}

function Slice({
  row,
  total,
  isSelected,
  onPress,
}: {
  row: HabitPeriodStats<HabitRecord>;
  total: number;
  isSelected: boolean;
  onPress: () => void;
}) {
  const share = Math.round((row.completedDays / total) * 100);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${row.habit.name}: ${share}% de lo cumplido, ${plural(row.completedDays, 'día', 'días')}`}
      onPress={onPress}
      className={`-mx-1 min-h-8 flex-row items-center gap-2 rounded-sm px-1 ${isSelected ? 'bg-warning-soft' : 'active:bg-surface-300'}`}
    >
      <View
        className="h-2.5 w-2.5 shrink-0 rounded-full border"
        style={{
          backgroundColor: row.habit.color,
          borderColor: strongHabitColor(row.habit.color),
        }}
      />
      <Text numberOfLines={1} className="font-body text-caption text-ink flex-1">
        {row.habit.name}
      </Text>
      <Text className="font-body-bold text-caption text-ink-muted">{share}%</Text>
    </Pressable>
  );
}
