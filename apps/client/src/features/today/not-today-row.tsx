// Fila de un hábito de días fijos que hoy no le toca (D20): informativa, sin casilla ni swipe.
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

const WEEKDAY_NAMES = ['lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado', 'domingo'];

function describeDays(daysOfWeek: readonly number[]): string {
  const names = [...daysOfWeek].sort((a, b) => a - b).map((day) => WEEKDAY_NAMES[day - 1]);
  if (names.length === 1) return names[0]!;
  return `${names.slice(0, -1).join(', ')} y ${names.at(-1)}`;
}

export function NotTodayRow({
  name,
  daysOfWeek,
  trailing,
}: {
  name: string;
  daysOfWeek: readonly number[];
  trailing?: ReactNode;
}) {
  return (
    <View className="min-h-12 flex-row items-center gap-3 py-2">
      <View className="flex-1">
        <Text className="font-body text-body text-ink-muted">{name}</Text>
        <Text className="font-body-semibold text-caption text-ink-muted">
          Le toca: {describeDays(daysOfWeek)}
        </Text>
      </View>
      {trailing}
    </View>
  );
}
