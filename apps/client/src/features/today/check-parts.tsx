// Piezas comunes de las filas que se marcan en Hoy (hábitos y tareas): la casilla, el "+10" que
// sube al marcar y lo que pasa al tocar o deslizar (vibración, sonido y los puntos que suben).
import { strongHabitColor } from '@ascua/shared';
import { useEffect, useRef, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CheckIcon } from '@/components/ui/icons';
import { selectionFeedback, tapFeedback } from '@/features/celebration/haptics';
import { playSound } from '@/features/sounds/sounds';
import { DURATION, EASE_OUT, SPRING_POP } from '@/theme/motion';

/** Tocar y deslizar hacen lo mismo: marcar suena, vibra y hace subir los puntos. */
export function useCheckToggle(isDone: boolean, onToggle: () => void) {
  // Cada vez que se marca desde aquí sube un "+N" desde la casilla.
  const [pointsBurst, setPointsBurst] = useState(0);
  // En web, soltar un deslizamiento también llega como toque: ese no debe marcar otra vez.
  const isSwipingRef = useRef(false);

  function toggle() {
    if (isDone) {
      selectionFeedback();
    } else {
      tapFeedback();
      playSound('tick');
      setPointsBurst((count) => count + 1);
    }
    onToggle();
  }

  return {
    pointsBurst,
    toggle,
    /** Para el `Pressable` de la fila. */
    onPressIn: () => {
      isSwipingRef.current = false;
    },
    onPress: () => {
      if (!isSwipingRef.current) toggle();
    },
    /** Para `SwipeToCheckRow`. */
    onSwipeStart: () => {
      isSwipingRef.current = true;
    },
  };
}

/**
 * Marcada: relleno pastel con borde y check del tono oscuro del mismo color. Al marcarla el relleno
 * entra con un rebote y el check aparece un instante después; al desmarcarla se apaga rápido.
 */
export function Checkbox({
  isDone,
  size,
  color,
}: {
  isDone: boolean;
  size: number;
  color: string;
}) {
  const progress = useSharedValue(isDone ? 1 : 0);

  useEffect(() => {
    progress.set(
      isDone
        ? withSpring(1, SPRING_POP)
        : withTiming(0, { duration: DURATION.fast, easing: EASE_OUT }),
    );
  }, [isDone, progress]);

  const fillStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.35], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.55, 1]) }],
  }));
  const checkStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0.45, 0.8], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(progress.value, [0.45, 1], [0.3, 1], 'clamp') }],
  }));

  const box = { width: size, height: size, borderRadius: 8 };
  const strong = strongHabitColor(color);
  return (
    <View className="border-border bg-surface-300 border-[1.5px]" style={box}>
      <Animated.View
        style={[
          {
            ...box,
            position: 'absolute',
            top: -1.5,
            left: -1.5,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: color,
            borderWidth: 2,
            borderColor: strong,
          },
          fillStyle,
        ]}
      >
        <Animated.View style={checkStyle}>
          <CheckIcon size={size / 2} color={strong} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

/** "+10" que sube desde la casilla y se desvanece: los puntos se ven llegar. */
export function FloatingPoints({ burst, amount }: { burst: number; amount: number }) {
  const progress = useSharedValue(1);

  useEffect(() => {
    if (burst === 0) return;
    progress.set(0);
    progress.set(withTiming(1, { duration: 750, easing: EASE_OUT }));
  }, [burst, progress]);

  const style = useAnimatedStyle(() => ({
    opacity: progress.value >= 1 ? 0 : interpolate(progress.value, [0, 0.15, 0.7, 1], [0, 1, 1, 0]),
    transform: [
      { translateY: interpolate(progress.value, [0, 1], [0, -24]) },
      { scale: interpolate(progress.value, [0, 0.2, 1], [0.6, 1.1, 1]) },
    ],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ position: 'absolute', left: -6, right: -6, top: -18, alignItems: 'center' }, style]}
    >
      <Text className="font-heading-extrabold text-heading-sm text-ember-strong">+{amount}</Text>
    </Animated.View>
  );
}
