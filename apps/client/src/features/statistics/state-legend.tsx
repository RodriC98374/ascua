import type { DayStatsStatus } from '@ascua/shared';
import { Text, View } from 'react-native';

import { DayDot } from './day-dot';
import { DAY_STATUS_LABELS } from './statistics-text';

const LEGEND: readonly { status: DayStatsStatus; isToday?: boolean; label?: string }[] = [
  { status: 'perfect', label: 'Perfecto' },
  { status: 'completed' },
  { status: 'frozen' },
  { status: 'missed' },
  { status: 'inactive' },
  { status: 'open', isToday: true, label: 'Hoy' },
];

/** Qué significa cada punto de la grilla. */
export function StateLegend() {
  return (
    <View className="flex-row flex-wrap gap-x-4 gap-y-2">
      {LEGEND.map(({ status, isToday, label }) => (
        <View key={status} className="flex-row items-center gap-1.5">
          <DayDot status={status} isToday={isToday} />
          <Text className="font-body-semibold text-caption text-ink-muted">
            {label ?? DAY_STATUS_LABELS[status]}
          </Text>
        </View>
      ))}
    </View>
  );
}
