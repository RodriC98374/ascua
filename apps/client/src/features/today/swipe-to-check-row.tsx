// Fila de Hoy que se desliza hacia la derecha para marcar o desmarcar. Detrás aparece el color del
// hábito con "Marcar" (o "Desmarcar"), que crece al llegar al umbral; al soltar, la fila vuelve.
// Tocar la fila sigue funcionando igual: el gesto solo se activa con un movimiento horizontal
// claro, y si el dedo va primero en vertical gana el scroll.
import { strongHabitColor } from '@ascua/shared';
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { CheckIcon, CloseIcon } from '@/components/ui/icons';
import { selectionFeedback } from '@/features/celebration/haptics';
import { useThemeColors } from '@/theme/colors';
import { SPRING_SOFT } from '@/theme/motion';

import { isSwipeCommitted, SWIPE, swipeOffset, swipeThreshold } from './swipe-to-check';

interface SwipeToCheckRowProps {
  isDone: boolean;
  /** Color del hábito (pastel): el fondo que aparece al marcar. */
  color: string;
  /** Mientras se ordena la lista no se desliza. */
  isDisabled: boolean;
  /** El radio de la fila, para que el fondo de atrás tenga su misma forma. */
  borderRadius: number;
  /** El gesto se activó: el toque que lo termina no debe marcar otra vez. */
  onSwipeStart: () => void;
  /** Se soltó pasado el umbral. */
  onCommit: () => void;
  children: ReactNode;
}

export function SwipeToCheckRow({
  isDone,
  color,
  isDisabled,
  borderRadius,
  onSwipeStart,
  onCommit,
  children,
}: SwipeToCheckRowProps) {
  const colors = useThemeColors();
  const width = useSharedValue(0);
  const offset = useSharedValue(0);
  const isArmed = useSharedValue(false);

  const pan = Gesture.Pan()
    .enabled(!isDisabled)
    .activeOffsetX(SWIPE.activationDistance)
    .failOffsetY([-SWIPE.verticalTolerance, SWIPE.verticalTolerance])
    .onStart(() => {
      scheduleOnRN(onSwipeStart);
    })
    .onUpdate((event) => {
      const threshold = swipeThreshold(width.get());
      offset.set(swipeOffset(event.translationX, threshold));
      // Una vibración corta al cruzar el umbral, en cualquier sentido: "si sueltas, cuenta".
      const isPastThreshold = event.translationX >= threshold;
      if (isPastThreshold !== isArmed.get()) {
        isArmed.set(isPastThreshold);
        scheduleOnRN(selectionFeedback);
      }
    })
    .onEnd((event) => {
      if (isSwipeCommitted(event.translationX, event.velocityX, swipeThreshold(width.get()))) {
        scheduleOnRN(onCommit);
      }
    })
    .onFinalize(() => {
      isArmed.set(false);
      // Vuelve sin pasarse: la fila nunca asoma a la izquierda de su lugar.
      offset.set(withSpring(0, { ...SPRING_SOFT, overshootClamping: true }));
    });

  const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: offset.get() }] }));
  const revealStyle = useAnimatedStyle(() => ({
    opacity: interpolate(offset.get(), [0, SWIPE.activationDistance * 1.5], [0, 1], 'clamp'),
  }));
  const labelStyle = useAnimatedStyle(() => {
    const threshold = swipeThreshold(width.get());
    return {
      transform: [
        { scale: interpolate(offset.get(), [threshold * 0.5, threshold], [0.8, 1.12], 'clamp') },
      ],
    };
  });

  const strong = strongHabitColor(color);
  const tint = isDone ? colors.inkMuted : strong;
  return (
    <View onLayout={(event) => width.set(event.nativeEvent.layout.width)}>
      <Animated.View
        pointerEvents="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={[
          {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            borderRadius,
            justifyContent: 'center',
            paddingLeft: 16,
            backgroundColor: isDone ? colors.surface300 : color,
          },
          revealStyle,
        ]}
      >
        <Animated.View
          style={[
            { flexDirection: 'row', alignItems: 'center', gap: 6, transformOrigin: 'left' },
            labelStyle,
          ]}
        >
          {isDone ? <CloseIcon size={18} color={tint} /> : <CheckIcon size={20} color={tint} />}
          <Text className="font-body-bold text-body" style={{ color: tint }}>
            {isDone ? 'Desmarcar' : 'Marcar'}
          </Text>
        </Animated.View>
      </Animated.View>
      {/* En web, `pan-y` deja al navegador el scroll vertical que empieza sobre la fila. */}
      <GestureDetector gesture={pan} touchAction="pan-y">
        <Animated.View style={rowStyle}>{children}</Animated.View>
      </GestureDetector>
    </View>
  );
}
