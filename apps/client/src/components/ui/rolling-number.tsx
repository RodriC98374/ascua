import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { SPRING_POP } from '@/theme/motion';

interface RollingNumberProps {
  value: number;
  /** Clases del texto (fuente, tamaño y color). */
  className: string;
  /** Alto de línea del texto: es lo que recorre cada cifra al rodar. */
  lineHeight: number;
}

/**
 * Un número que rueda al cambiar, como un contador: el anterior sale hacia arriba y el nuevo entra
 * desde abajo (al revés si baja). Al montarse no se anima.
 */
export function RollingNumber({ value, className, lineHeight }: RollingNumberProps) {
  const [pair, setPair] = useState<{ current: number; previous: number | null }>({
    current: value,
    previous: null,
  });
  // Estado derivado de la prop anterior: se guarda en el render, sin efecto (patrón de React).
  if (pair.current !== value) setPair({ current: value, previous: pair.current });

  const progress = useSharedValue(1);
  const direction = pair.previous !== null && pair.current < pair.previous ? -1 : 1;

  useEffect(() => {
    if (pair.previous === null) return;
    progress.set(0);
    progress.set(withSpring(1, SPRING_POP));
  }, [pair, progress]);

  const incoming = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.6], [0, 1], 'clamp'),
    transform: [{ translateY: (1 - progress.value) * lineHeight * direction }],
  }));
  const outgoing = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5], [1, 0], 'clamp'),
    transform: [{ translateY: -progress.value * lineHeight * direction }],
  }));

  return (
    <View style={{ height: lineHeight, overflow: 'hidden' }}>
      {pair.previous !== null && (
        <Animated.View
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
          style={[{ position: 'absolute', left: 0, top: 0 }, outgoing]}
        >
          <Text className={className}>{pair.previous}</Text>
        </Animated.View>
      )}
      <Animated.View style={incoming}>
        <Text className={className}>{pair.current}</Text>
      </Animated.View>
    </View>
  );
}
