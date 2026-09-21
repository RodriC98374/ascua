import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { colors, emberGradient } from '@/theme/colors';

/** 8 px de alto. `value` 0..100; siempre va acompañada de la cifra en texto. */
export function ProgressBar({
  value,
  tone = 'ember',
}: {
  value: number;
  tone?: 'ember' | 'success';
}) {
  const width = `${Math.max(0, Math.min(100, value))}%` as const;
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: value }}
      className="bg-surface-300 h-2 w-full overflow-hidden rounded-full"
    >
      {tone === 'ember' ? (
        <LinearGradient
          colors={emberGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: '100%', width, borderRadius: 999 }}
        />
      ) : (
        <View
          style={{ height: '100%', width, borderRadius: 999, backgroundColor: colors.success }}
        />
      )}
    </View>
  );
}
