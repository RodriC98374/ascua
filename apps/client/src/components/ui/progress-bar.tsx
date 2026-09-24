import { LinearGradient } from 'expo-linear-gradient';
import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { useThemeColors } from '@/theme/colors';
import { DURATION, EASE_OUT } from '@/theme/motion';

/**
 * 8 px de alto. `value` 0..100; siempre va acompañada de la cifra en texto.
 * `color` pinta la barra con un color propio (el del hábito) y manda sobre `tone`.
 * Al cambiar el valor la barra se llena hasta el nuevo; al montarse ya aparece llena, para que una
 * pantalla con muchas barras no se mueva entera al abrirla.
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
  const colors = useThemeColors();
  const percent = Math.max(0, Math.min(100, value));
  const width = useSharedValue(percent);

  useEffect(() => {
    width.set(withTiming(percent, { duration: DURATION.slow, easing: EASE_OUT }));
  }, [percent, width]);

  const widthStyle = useAnimatedStyle(() => ({ width: `${width.value}%` }));
  const fill = color ?? (tone === 'success' ? colors.success : null);
  return (
    <View
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 0, max: 100, now: value }}
      className="bg-surface-300 h-2 w-full overflow-hidden rounded-full"
    >
      <Animated.View
        style={[
          { height: '100%', borderRadius: 999, overflow: 'hidden' },
          fill !== null && { backgroundColor: fill },
          widthStyle,
        ]}
      >
        {fill === null && (
          <LinearGradient
            colors={colors.emberGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ height: '100%', width: '100%' }}
          />
        )}
      </Animated.View>
    </View>
  );
}
