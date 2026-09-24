import { HABIT_POINTS, strongHabitColor, type HabitTier } from '@ascua/shared';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { CheckIcon } from '@/components/ui/icons';
import { selectionFeedback, tapFeedback } from '@/features/celebration/haptics';
import { useThemeColors } from '@/theme/colors';
import { DURATION, EASE_OUT, SPRING_POP } from '@/theme/motion';

interface HabitCheckProps {
  name: string;
  tier: HabitTier;
  /** Color del hábito: pinta la casilla marcada. */
  color: string;
  isDone: boolean;
  /** Archivado hoy: todavía cuenta, pero es su último día. */
  isArchived?: boolean;
  /** Mientras se reordena la lista, tocar la fila no marca. */
  isToggleDisabled?: boolean;
  onToggle: () => void;
  /** Acción a la derecha, fuera del área que marca (menú o flechas para ordenar). */
  trailing?: ReactNode;
}

/**
 * Fila de un hábito del día: casilla y nombre marcan y desmarcan. La sección ya dice si es
 * principal o secundario; los principales van en su propia ficha (cuentan para la racha) y los
 * secundarios, como filas simples dentro de una tarjeta compartida.
 */
export function HabitCheck({
  name,
  tier,
  color,
  isDone,
  isArchived = false,
  isToggleDisabled = false,
  onToggle,
  trailing,
}: HabitCheckProps) {
  const colors = useThemeColors();
  // Cada vez que se marca desde aquí sube un "+10" desde la casilla.
  const [pointsBurst, setPointsBurst] = useState(0);
  const isPrimary = tier === 'primary';

  function press() {
    if (isDone) {
      selectionFeedback();
    } else {
      tapFeedback();
      setPointsBurst((count) => count + 1);
    }
    onToggle();
  }

  return (
    <View
      className={`flex-row items-center gap-1 ${isPrimary ? 'bg-surface-200 min-h-14 rounded-lg pl-4 pr-1' : 'min-h-12'}`}
      style={
        isPrimary
          ? {
              shadowColor: colors.shadowNeutral,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 1,
            }
          : undefined
      }
    >
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: isDone, disabled: isToggleDisabled }}
        accessibilityLabel={`${name}, ${isPrimary ? 'principal' : 'secundario'}`}
        disabled={isToggleDisabled}
        onPress={press}
        className={`min-h-11 flex-1 flex-row items-center gap-3 py-2 ${isToggleDisabled ? '' : 'active:opacity-85'}`}
      >
        <View>
          <Checkbox isDone={isDone} size={isPrimary ? 28 : 24} color={color} />
          <FloatingPoints burst={pointsBurst} amount={HABIT_POINTS[tier]} />
        </View>
        <Text
          className={`flex-1 ${isPrimary ? 'font-heading text-heading-sm text-ink' : 'font-body text-body text-ink-muted'}`}
        >
          {name}
        </Text>
        {isArchived && (
          <View className="bg-surface-300 rounded-full px-2 py-[3px]">
            <Text className="font-body-bold text-caption text-ink-muted">Último día</Text>
          </View>
        )}
      </Pressable>
      {trailing ?? <View className="w-11" />}
    </View>
  );
}

/**
 * Marcada: relleno pastel con borde y check del tono oscuro del mismo color. Al marcarla el relleno
 * entra con un rebote y el check aparece un instante después; al desmarcarla se apaga rápido.
 */
function Checkbox({ isDone, size, color }: { isDone: boolean; size: number; color: string }) {
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
function FloatingPoints({ burst, amount }: { burst: number; amount: number }) {
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
