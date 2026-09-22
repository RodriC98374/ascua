import type { DayStatsStatus } from '@ascua/shared';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { CheckIcon, SnowflakeIcon, StarIcon } from '@/components/ui/icons';
import { colors, emberGradient } from '@/theme/colors';

import { DAY_STATUS_LABELS } from './statistics-text';

interface ChipStyle {
  container: string;
  text: string;
  icon?: ReactNode;
}

const CHIP_STYLES: Record<Exclude<DayStatsStatus, 'perfect'>, ChipStyle> = {
  completed: {
    container: 'bg-success-soft',
    text: 'text-success',
    icon: <CheckIcon size={12} color={colors.success} />,
  },
  frozen: {
    container: 'bg-protegido-soft',
    text: 'text-protegido',
    icon: <SnowflakeIcon size={12} color={colors.protegido} />,
  },
  missed: { container: 'bg-error-soft', text: 'text-error' },
  inactive: { container: 'bg-vacio-soft', text: 'text-ink-muted' },
  open: { container: 'bg-surface-300', text: 'text-ink-muted' },
  no_data: { container: 'bg-surface-300', text: 'text-ink-muted' },
  future: { container: 'bg-surface-300', text: 'text-ink-muted' },
};

/** Etiqueta del estado de un día, con su color e ícono (nunca solo el color). */
export function StatusChip({ status, isToday }: { status: DayStatsStatus; isToday: boolean }) {
  if (status === 'perfect') {
    return (
      <LinearGradient
        colors={emberGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ alignSelf: 'flex-start', borderRadius: 999 }}
      >
        <View className="flex-row items-center gap-1 px-3 py-1">
          <StarIcon size={12} color={colors.inkOnFill} />
          <Text className="font-body-extrabold text-label text-ink-on-fill uppercase">
            {DAY_STATUS_LABELS.perfect}
          </Text>
        </View>
      </LinearGradient>
    );
  }
  if (status === 'open' && isToday) {
    return (
      <View className="border-ember-strong self-start rounded-full border-2 px-3 py-0.5">
        <Text className="font-body-extrabold text-label text-ember-strong uppercase">
          Hoy, en curso
        </Text>
      </View>
    );
  }
  const style = CHIP_STYLES[status];
  return (
    <View
      className={`flex-row items-center gap-1 self-start rounded-full px-3 py-1 ${style.container}`}
    >
      {style.icon}
      <Text className={`font-body-extrabold text-label uppercase ${style.text}`}>
        {DAY_STATUS_LABELS[status]}
      </Text>
    </View>
  );
}
