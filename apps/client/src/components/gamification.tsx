// Indicadores de gamificación del sistema de diseño: racha, puntos de hoy y protectores.
import { MAX_STREAK_FREEZES } from '@ascua/shared';
import { Text, View } from 'react-native';

import { EmberIcon, ShieldIcon } from '@/components/ui/icons';
import { colors } from '@/theme/colors';

export function StreakIndicator({ days }: { days: number }) {
  return (
    <View className="flex-row items-center gap-3">
      <EmberIcon size={22} color={colors.emberStrong} />
      <View>
        <Text className="font-heading-extrabold text-display-lg text-ember-strong">{days}</Text>
        <Text className="font-body-extrabold text-label text-ink-muted uppercase">
          {days === 1 ? 'día de racha' : 'días de racha'}
        </Text>
      </View>
    </View>
  );
}

/** Los puntos de hoy siempre llevan "hoy" y la aclaración de cuándo se pueden gastar. */
export function PointsCounter({ today }: { today: number }) {
  return (
    <View className="items-end">
      <View className="bg-warning-soft rounded-full px-3 py-[5px]">
        <Text className="font-body-extrabold text-button text-ember-strong">+{today} hoy</Text>
      </View>
      <Text className="font-body-semibold text-caption text-ink-muted mt-1">
        {today} disponibles mañana
      </Text>
    </View>
  );
}

export function ProtectorIndicator({ active }: { active: number }) {
  return (
    <View className="flex-row items-center gap-2">
      <ShieldIcon size={16} color={colors.protegido} filled={active > 0} />
      <View className="flex-row gap-[5px]">
        {Array.from({ length: MAX_STREAK_FREEZES }, (_, index) => (
          <View
            key={index}
            className={`h-2.5 w-2.5 rounded-full border-[1.5px] ${index < active ? 'border-protegido-fill bg-protegido-fill' : 'border-border bg-surface-300'}`}
          />
        ))}
      </View>
      <Text className="font-body-semibold text-caption text-ink-muted">
        {active}/{MAX_STREAK_FREEZES} protectores
      </Text>
    </View>
  );
}
