import { MAX_STREAK_FREEZES } from '@ascua/shared';
import { Text, View } from 'react-native';

import { ShieldIcon } from '@/components/ui/icons';
import { colors } from '@/theme/colors';

/** Protectores disponibles (0–2): escudo, un punto por cupo y la cifra. */
export function ProtectorIndicator({ active }: { active: number }) {
  return (
    <View
      accessibilityLabel={`${active} de ${MAX_STREAK_FREEZES} protectores`}
      className="flex-row items-center gap-2"
    >
      <ShieldIcon size={20} color={colors.protegido} filled={active > 0} />
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
