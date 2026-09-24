import { Pressable, type PressableProps } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { DURATION, SPRING_SOFT } from '@/theme/motion';

interface PressableScaleProps extends PressableProps {
  /** Cuánto se hunde al tocarlo. */
  pressedScale?: number;
}

/**
 * `Pressable` que se hunde un poco al tocarlo y vuelve con un resorte: la respuesta se siente en
 * el dedo, no solo en el color. Las clases van al `Pressable`; la escala, a una vista que lo envuelve
 * (NativeWind no aplica clases a los componentes de Reanimated).
 */
export function PressableScale({
  pressedScale = 0.96,
  onPressIn,
  onPressOut,
  ...props
}: PressableScaleProps) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={animatedStyle}>
      <Pressable
        {...props}
        onPressIn={(event) => {
          scale.set(withTiming(pressedScale, { duration: DURATION.fast }));
          onPressIn?.(event);
        }}
        onPressOut={(event) => {
          scale.set(withSpring(1, SPRING_SOFT));
          onPressOut?.(event);
        }}
      />
    </Animated.View>
  );
}
