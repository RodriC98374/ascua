import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { colors, emberGradient } from '@/theme/colors';

/**
 * 8 px de alto. `value` 0..100; siempre va acompañada de la cifra en texto.
 * `color` pinta la barra con un color propio (el del hábito) y manda sobre `tone`.
 */
export function ProgressBar({
  value,
  tone = 'ember',
  color,
}: {
  value: number;
  tone?: 'ember' | 'success';
  color?: string;
}) {
  const width = `${Math.max(0, Math.min(100, value))}%` as const;
  const fill = color ?? (tone === 'success' ? colors.success : null);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: value }}
      className="bg-surface-300 h-2 w-full overflow-hidden rounded-full"
    >
      {fill === null ? (
        <LinearGradient
          colors={emberGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ height: '100%', width, borderRadius: 999 }}
        />
      ) : (
        <View style={{ height: '100%', width, borderRadius: 999, backgroundColor: fill }} />
      )}
    </View>
  );
}
