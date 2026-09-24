import { useEffect } from 'react';
import { Pressable } from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { useActiveColorScheme, useThemeColors } from '@/theme/colors';
import { SPRING_SOFT } from '@/theme/motion';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
}

/** Recorrido del pulgar: pista de 56, relleno de 4 por lado y pulgar de 24. */
const THUMB_TRAVEL = 56 - 4 * 2 - 24;

/**
 * Interruptor con los colores del diseño, igual en Android y en web (el `Switch` de React Native
 * usa otro color de pulgar en web). El pulgar se desliza y la pista pasa de gris a brasa. El área
 * táctil llega a 44 px con `hitSlop`.
 */
export function Toggle({ value, onChange, accessibilityLabel }: ToggleProps) {
  const colors = useThemeColors();
  const isDark = useActiveColorScheme() === 'dark';
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.set(withSpring(value ? 1 : 0, SPRING_SOFT));
  }, [value, progress]);

  const offColor = colors.border;
  const onColor = colors.ember;
  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], [offColor, onColor]),
  }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * THUMB_TRAVEL }],
  }));

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
    >
      <Animated.View
        style={[
          {
            height: 32,
            width: 56,
            borderRadius: 999,
            paddingHorizontal: 4,
            justifyContent: 'center',
          },
          trackStyle,
        ]}
      >
        <Animated.View
          style={[
            {
              height: 24,
              width: 24,
              borderRadius: 12,
              // En oscuro el pulgar va claro: el fondo de pantalla desaparecería sobre la pista.
              backgroundColor: isDark ? colors.ink : colors.surface100,
              // shadow-sm del diseño.
              shadowColor: colors.shadowNeutral,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.15,
              shadowRadius: 2,
              elevation: 2,
            },
            thumbStyle,
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}
