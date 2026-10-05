// "Cómo te sentiste": el promedio de cada escala del check-in y su línea en el periodo.
import { CHECK_IN_DIMENSIONS, type CheckInAverages } from '@ascua/shared';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { useCheckInColors } from '@/features/check-in/check-in-colors';
import { CHECK_IN_LABELS, formatCheckInAverage } from '@/features/check-in/check-in-text';

import type { CheckInSlot } from './chart-data';
import { CheckInChart } from './check-in-chart';

interface CheckInSummaryProps {
  averages: CheckInAverages;
  slots: readonly CheckInSlot[];
  /** Qué promedia: "los días que contestaste" o "los días cerrados". */
  caption: string;
  /** El nombre de un punto del eje: 'Mié 23' o 'septiembre de 2026'. */
  describeSlotName: (slot: CheckInSlot) => string;
}

export function CheckInSummary({
  averages,
  slots,
  caption,
  describeSlotName,
}: CheckInSummaryProps) {
  const scaleColors = useCheckInColors();
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const hasData = slots.some((slot) => Object.keys(slot.values).length > 0);
  const selectedIndex = slots.findIndex((slot) => slot.key === selectedKey);

  function describeSlot(index: number): string {
    const slot = slots[index];
    if (!slot) return '';
    const answers = CHECK_IN_DIMENSIONS.flatMap((dimension) => {
      const value = slot.values[dimension];
      return value === undefined
        ? []
        : [`${CHECK_IN_LABELS[dimension].name} ${formatCheckInAverage(value)}`];
    });
    const name = describeSlotName(slot);
    return answers.length > 0 ? `${name}: ${answers.join(' · ')}` : `${name}: sin check-in`;
  }

  return (
    <Card className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Cómo te sentiste</Text>
        <Text className="font-body text-caption text-ink-muted">{caption}</Text>
      </View>
      <View className="flex-row gap-2">
        {CHECK_IN_DIMENSIONS.map((dimension) => (
          <View
            key={dimension}
            accessible
            accessibilityLabel={`${CHECK_IN_LABELS[dimension].name}: ${formatCheckInAverage(averages[dimension])} de 5`}
            className="bg-surface-300 flex-1 gap-0.5 rounded-md px-2.5 py-2"
          >
            {/* El nombre va solo en su línea: con el punto al lado, "Motivación" se cortaba. */}
            <Text numberOfLines={1} className="font-body-bold text-caption text-ink-muted">
              {CHECK_IN_LABELS[dimension].name}
            </Text>
            <View className="flex-row items-center gap-1.5">
              <View
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: scaleColors[dimension] }}
              />
              <Text className="font-heading text-heading-md text-ink">
                {formatCheckInAverage(averages[dimension])}
              </Text>
            </View>
          </View>
        ))}
      </View>
      {hasData ? (
        <>
          <CheckInChart
            slots={slots}
            selectedIndex={selectedIndex}
            onSelect={(index) => {
              const key = slots[index]?.key ?? null;
              setSelectedKey((current) => (current === key ? null : key));
            }}
            describeSlot={describeSlot}
          />
          <Text className="font-body-semibold text-caption text-ink-muted">
            {selectedIndex >= 0
              ? describeSlot(selectedIndex)
              : 'Toca un punto para ver sus valores.'}
          </Text>
        </>
      ) : (
        <Text className="font-body text-body text-ink-muted">
          Todavía no hay check-ins en estas fechas. Lo contestas en Hoy, en un toque.
        </Text>
      )}
    </Card>
  );
}
