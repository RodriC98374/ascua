import type { RewardTier } from '@ascua/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';

import { emberGradient } from '@/theme/colors';

import { TIER_LABELS } from './reward-catalog';

const PLAIN_TIERS = {
  small: { chip: 'bg-week-verde-soft', text: 'text-week-verde' },
  medium: { chip: 'bg-week-azul-soft', text: 'text-week-azul' },
};

/** Nivel de una recompensa. La grande lleva el degradado de marca: es el premio mayor. */
export function RewardChip({ tier }: { tier: RewardTier }) {
  const label = TIER_LABELS[tier].singular;
  const text = 'font-body-extrabold text-label uppercase';
  if (tier === 'large') {
    return (
      <LinearGradient
        colors={emberGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          alignSelf: 'flex-start',
          borderRadius: 999,
          paddingHorizontal: 8,
          paddingVertical: 3,
        }}
      >
        <Text className={`${text} text-ink-on-fill`}>{label}</Text>
      </LinearGradient>
    );
  }
  const classes = PLAIN_TIERS[tier];
  return (
    <View className={`self-start rounded-full px-2 py-[3px] ${classes.chip}`}>
      <Text className={`${text} ${classes.text}`}>{label}</Text>
    </View>
  );
}
