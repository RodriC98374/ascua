import { HABIT_POINTS, type HabitTier } from '@ascua/shared';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Checkbox, FloatingPoints, useCheckToggle } from './check-parts';
import { SwipeToCheckRow } from './swipe-to-check-row';

/** Las filas no tienen forma propia (van en una tarjeta): el fondo de atrás usa `rounded-md`. */
export const ROW_RADIUS = 12;

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
  /** Línea chica bajo el nombre: el avance de un semanal ("2 de 3 esta semana"). */
  caption?: string;
}

/**
 * Fila de un hábito del día: tocar la casilla o el nombre, o deslizar la fila a la derecha, marca y
 * desmarca. La sección ya dice si es principal o secundario; todas van como filas de una tarjeta
 * por sección, como una lista del celular. Hecho, el nombre se apaga un poco: lo pendiente resalta.
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
  caption,
}: HabitCheckProps) {
  const check = useCheckToggle(isDone, onToggle);
  const isPrimary = tier === 'primary';

  return (
    <SwipeToCheckRow
      isDone={isDone}
      color={color}
      isDisabled={isToggleDisabled}
      borderRadius={ROW_RADIUS}
      onSwipeStart={check.onSwipeStart}
      onCommit={check.toggle}
    >
      {/* Fondo opaco (el de la tarjeta): tapa lo que aparece detrás al deslizar. */}
      <View className="bg-surface-200 min-h-14 flex-row items-center gap-1">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone, disabled: isToggleDisabled }}
          accessibilityLabel={`${name}, ${isPrimary ? 'principal' : 'secundario'}`}
          disabled={isToggleDisabled}
          onPressIn={check.onPressIn}
          onPress={check.onPress}
          className={`min-h-11 flex-1 flex-row items-center gap-3 py-2 ${isToggleDisabled ? '' : 'active:opacity-85'}`}
        >
          <View>
            <Checkbox isDone={isDone} size={28} color={color} />
            <FloatingPoints burst={check.pointsBurst} amount={HABIT_POINTS[tier]} />
          </View>
          <View className="flex-1">
            <Text
              className={`${isPrimary ? 'font-heading text-heading-sm' : 'font-body-semibold text-body'} ${isDone ? 'text-ink-muted' : 'text-ink'}`}
            >
              {name}
            </Text>
            {caption && (
              <Text className="font-body-semibold text-caption text-ink-muted">{caption}</Text>
            )}
          </View>
          {isArchived && (
            <View className="bg-surface-300 rounded-full px-2 py-[3px]">
              <Text className="font-body-bold text-caption text-ink-muted">Último día</Text>
            </View>
          )}
        </Pressable>
        {trailing ?? <View className="w-11" />}
      </View>
    </SwipeToCheckRow>
  );
}
