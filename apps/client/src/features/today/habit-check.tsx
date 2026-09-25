import { HABIT_POINTS, type HabitTier } from '@ascua/shared';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/colors';

import { Checkbox, FloatingPoints, useCheckToggle } from './check-parts';
import { SwipeToCheckRow } from './swipe-to-check-row';

/** `rounded-lg` de la ficha de un principal. */
const PRIMARY_ROW_RADIUS = 18;
/** Las secundarias no tienen forma propia: el fondo de atrás usa `rounded-md`. */
export const SECONDARY_ROW_RADIUS = 12;

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
 * Fila de un hábito del día: tocar la casilla o el nombre, o deslizar la fila a la derecha, marca y
 * desmarca. La sección ya dice si es principal o secundario; los principales van en su propia
 * ficha (cuentan para la racha) y los secundarios, como filas simples dentro de una tarjeta
 * compartida.
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
  const check = useCheckToggle(isDone, onToggle);
  const isPrimary = tier === 'primary';

  return (
    <SwipeToCheckRow
      isDone={isDone}
      color={color}
      isDisabled={isToggleDisabled}
      borderRadius={isPrimary ? PRIMARY_ROW_RADIUS : SECONDARY_ROW_RADIUS}
      onSwipeStart={check.onSwipeStart}
      onCommit={check.toggle}
    >
      <View
        // Fondo opaco también en las secundarias (el de su tarjeta): tapa lo que aparece detrás.
        className={`bg-surface-200 flex-row items-center gap-1 ${isPrimary ? 'min-h-14 rounded-lg pl-4 pr-1' : 'min-h-12'}`}
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
          onPressIn={check.onPressIn}
          onPress={check.onPress}
          className={`min-h-11 flex-1 flex-row items-center gap-3 py-2 ${isToggleDisabled ? '' : 'active:opacity-85'}`}
        >
          <View>
            <Checkbox isDone={isDone} size={isPrimary ? 28 : 24} color={color} />
            <FloatingPoints burst={check.pointsBurst} amount={HABIT_POINTS[tier]} />
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
    </SwipeToCheckRow>
  );
}
