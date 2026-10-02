// Fila de un hábito con cantidad (D20): un contador hasta la meta del día. La casilla no se toca:
// se marca sola al llegar a la meta, así la fila se lee como un hábito más. Sin puntos parciales:
// los puntos llegan al tocar la meta, igual que un hábito normal.
import { HABIT_POINTS, strongHabitColor, type HabitTier } from '@ascua/shared';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MinusIcon, PlusIcon } from '@/components/ui/icons';
import { selectionFeedback, tapFeedback } from '@/features/celebration/haptics';
import { HabitIcon } from '@/features/habits/habit-icon';
import { playSound } from '@/features/sounds/sounds';
import { useThemeColors } from '@/theme/colors';

import { Checkbox, FloatingPoints } from './check-parts';

interface QuantityCheckProps {
  name: string;
  tier: HabitTier;
  color: string;
  /** El campo `icon` del hábito: si eligió uno, va antes del nombre. */
  icon?: unknown;
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
  icon,
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
  // Cada vez que el contador llega a la meta sube un "+N" desde la casilla.
  const [pointsBurst, setPointsBurst] = useState(0);
  const isPrimary = tier === 'primary';

  function increment() {
    const wasDone = count >= amount;
    onIncrement();
    if (!wasDone && count + 1 >= amount) {
      tapFeedback();
      playSound('tick');
      setPointsBurst((bursts) => bursts + 1);
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
    // Una fila más de la tarjeta de su sección, como las casillas.
    <View className="bg-surface-200 gap-1 py-2">
      <View
        accessibilityLabel={`${name}, ${isPrimary ? 'principal' : 'secundario'}, ${count} de ${amount} ${unit}`}
        className="min-h-11 flex-row items-center gap-1"
      >
        <View className="flex-1 flex-row items-center gap-3">
          <View>
            <Checkbox isDone={isDone} size={28} color={color} />
            <FloatingPoints burst={pointsBurst} amount={HABIT_POINTS[tier]} />
          </View>
          <HabitIcon icon={icon} size={18} color={strongHabitColor(color)} />
          <Text
            className={`flex-1 ${isPrimary ? 'font-heading text-heading-sm' : 'font-body-semibold text-body'} ${isDone ? 'text-ink-muted' : 'text-ink'}`}
          >
            {name}
          </Text>
          {isArchived && (
            <View className="bg-surface-300 rounded-full px-2 py-[3px]">
              <Text className="font-body-bold text-caption text-ink-muted">Último día</Text>
            </View>
          )}
        </View>
        {trailing ?? <View className="w-11" />}
      </View>
      {/* El contador, alineado con el nombre del hábito. */}
      <View className="flex-row items-center gap-3 pb-1 pl-10">
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
    <View className="flex-row items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Restar uno"
        disabled={disabled}
        onPress={onDecrement}
        className={`border-border h-11 w-11 items-center justify-center rounded-full border-2 ${disabled ? 'opacity-30' : 'active:opacity-85'}`}
      >
        <MinusIcon size={18} color={colors.inkMuted} />
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sumar uno"
        disabled={disabled}
        onPress={onIncrement}
        className={`h-11 w-11 items-center justify-center rounded-full ${disabled ? 'opacity-30' : 'active:opacity-85'}`}
        style={{ backgroundColor: color }}
      >
        <PlusIcon size={18} color={colors.inkOnFill} />
      </Pressable>
    </View>
  );
}
