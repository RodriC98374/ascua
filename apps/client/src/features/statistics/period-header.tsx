import {
  describePeriodRelative,
  formatPeriodLabel,
  type DateKey,
  type Period,
  type PeriodKind,
  type PeriodNavigation,
} from '@ascua/shared';
import { Pressable, Text, View } from 'react-native';

import { ChevronIcon } from '@/components/ui/icons';
import { colors } from '@/theme/colors';

const STEP_LABELS: Record<PeriodKind, { previous: string; next: string }> = {
  week: { previous: 'Semana anterior', next: 'Semana siguiente' },
  month: { previous: 'Mes anterior', next: 'Mes siguiente' },
  year: { previous: 'Año anterior', next: 'Año siguiente' },
};

/** Nombre del periodo con flechas para ir al anterior y al siguiente. */
export function PeriodHeader({
  period,
  today,
  navigation,
  onChange,
}: {
  period: Period;
  today: DateKey;
  navigation: PeriodNavigation;
  onChange: (period: Period) => void;
}) {
  const relative = describePeriodRelative(period, today);
  const labels = STEP_LABELS[period.kind];
  return (
    <View className="flex-row items-center gap-2">
      <StepButton
        direction="left"
        label={labels.previous}
        target={navigation.previous}
        onChange={onChange}
      />
      <View className="flex-1 items-center">
        <Text className="font-heading text-heading-lg text-ink">{formatPeriodLabel(period)}</Text>
        {relative && (
          <Text className="font-body-semibold text-caption text-ink-muted">{relative}</Text>
        )}
      </View>
      <StepButton
        direction="right"
        label={labels.next}
        target={navigation.next}
        onChange={onChange}
      />
    </View>
  );
}

function StepButton({
  direction,
  label,
  target,
  onChange,
}: {
  direction: 'left' | 'right';
  label: string;
  target: Period | null;
  onChange: (period: Period) => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: !target }}
      disabled={!target}
      onPress={() => target && onChange(target)}
      className="active:bg-surface-300 h-11 w-11 items-center justify-center rounded-full"
    >
      <ChevronIcon direction={direction} color={target ? colors.emberStrong : colors.border} />
    </Pressable>
  );
}
