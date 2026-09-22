import { strongHabitColor, type HabitTier } from '@ascua/shared';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CheckIcon } from '@/components/ui/icons';
import { colors } from '@/theme/colors';

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
 * Fila de un hábito del día: casilla, nombre y etiqueta marcan y desmarcan.
 * Los principales van en su propia ficha (cuentan para la racha); los secundarios, como filas
 * simples dentro de una tarjeta compartida.
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
  const isPrimary = tier === 'primary';
  return (
    <View
      className={`flex-row items-center gap-1 ${isPrimary ? 'bg-surface-200 min-h-14 rounded-lg pl-4 pr-1' : 'min-h-12'}`}
      style={
        isPrimary
          ? {
              shadowColor: colors.ink,
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
        onPress={onToggle}
        className={`min-h-11 flex-1 flex-row items-center gap-3 py-2 ${isToggleDisabled ? '' : 'active:opacity-85'}`}
      >
        <Checkbox isDone={isDone} size={isPrimary ? 28 : 24} color={color} />
        <Text
          className={`flex-1 ${isPrimary ? 'font-heading text-heading-sm text-ink' : 'font-body text-body text-ink-muted'}`}
        >
          {name}
        </Text>
        <View
          className={`rounded-full px-2 py-[3px] ${isPrimary ? 'bg-warning-soft' : 'bg-surface-300'}`}
        >
          <Text
            className={`font-body-extrabold text-label uppercase ${isPrimary ? 'text-ember-strong' : 'text-ink-muted'}`}
          >
            {isArchived ? 'Último día' : isPrimary ? 'Principal' : 'Secundario'}
          </Text>
        </View>
      </Pressable>
      {trailing ?? <View className="w-11" />}
    </View>
  );
}

// Marcada: relleno pastel con borde y check del tono oscuro del mismo color.
function Checkbox({ isDone, size, color }: { isDone: boolean; size: number; color: string }) {
  const box = { width: size, height: size, borderRadius: 8 };
  if (!isDone) {
    return <View className="border-border bg-surface-300 border-[1.5px]" style={box} />;
  }
  const strong = strongHabitColor(color);
  return (
    <View
      style={{
        ...box,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: color,
        borderWidth: 2,
        borderColor: strong,
      }}
    >
      <CheckIcon size={size / 2} color={strong} />
    </View>
  );
}
