// Fila de un hábito con cantidad (D20): en vez de una casilla, un contador hasta la meta del día.
// Sin puntos parciales: los puntos llegan al tocar la meta, igual que un hábito normal.
import { HABIT_POINTS, type HabitTier } from '@ascua/shared';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MinusIcon, PlusIcon } from '@/components/ui/icons';
import { selectionFeedback, tapFeedback } from '@/features/celebration/haptics';
import { playSound } from '@/features/sounds/sounds';
import { useThemeColors } from '@/theme/colors';

import { FloatingPoints } from './check-parts';

interface QuantityCheckProps {
  name: string;
  tier: HabitTier;
  color: string;
  amount: number;
  unit: string;
  count: number;
  isDone: boolean;
  isArchived?: boolean;
  onIncrement: () => void;
  onDecrement: () => void;
  /** Semanal combinado con cantidad: "2 de 3 esta semana", además de la meta del día. */
  weeklyCaption?: string;
  trailing?: ReactNode;
}

export function QuantityCheck({
  name,
  tier,
  color,
  amount,
  unit,
  count,
  isDone,
  isArchived = false,
  onIncrement,
  onDecrement,
  weeklyCaption,
  trailing,
}: QuantityCheckProps) {
  const colors = useThemeColors();
  const isPrimary = tier === 'primary';

  function increment() {
    const wasDone = count >= amount;
    onIncrement();
    if (!wasDone && count + 1 >= amount) {
      tapFeedback();
      playSound('tick');
    } else {
      selectionFeedback();
    }
  }

  function decrement() {
    if (count <= 0) return;
    selectionFeedback();
    onDecrement();
  }

  return (
    <View
      className={`bg-surface-200 gap-2 ${isPrimary ? 'rounded-lg px-4 py-3' : 'min-h-12 px-0 py-2'}`}
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
      <View className="flex-row items-center gap-3">
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
        {trailing ?? <View className="w-11" />}
      </View>
      <View className="flex-row items-center gap-3">
        <Stepper
          color={color}
          disabled={isArchived}
          onDecrement={decrement}
          onIncrement={increment}
        />
        <View className="flex-1">
          <Text className="font-body-bold text-body text-ink">
            {count} de {amount} {unit}
          </Text>
          {weeklyCaption && (
            <Text className="font-body-semibold text-caption text-ink-muted">{weeklyCaption}</Text>
          )}
        </View>
        <View>
          <FloatingPoints burst={isDone ? 1 : 0} amount={HABIT_POINTS[tier]} />
        </View>
      </View>
    </View>
  );
}

function Stepper({
  color,
  disabled,
  onDecrement,
  onIncrement,
}: {
  color: string;
  disabled: boolean;
  onDecrement: () => void;
  onIncrement: () => void;
}) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Restar uno"
        disabled={disabled}
        onPress={onDecrement}
        className={`border-border h-9 w-9 items-center justify-center rounded-full border-2 ${disabled ? 'opacity-30' : 'active:opacity-85'}`}
      >
        <MinusIcon size={16} color={colors.inkMuted} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sumar uno"
        disabled={disabled}
        onPress={onIncrement}
        className={`h-9 w-9 items-center justify-center rounded-full ${disabled ? 'opacity-30' : 'active:opacity-85'}`}
        style={{ backgroundColor: color }}
      >
        <PlusIcon size={16} color={colors.inkOnFill} />
      </Pressable>
    </View>
  );
}
