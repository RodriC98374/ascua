import {
  HABIT_COLORS_BY_HUE,
  strongHabitColor,
  visibleHabitColors,
  type HabitColor,
} from '@ascua/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { FieldLabel, Hint } from '@/components/ui/form-parts';
import { CheckIcon, PlusIcon } from '@/components/ui/icons';
import { useThemeColors } from '@/theme/colors';

interface HabitColorPickerProps {
  value: HabitColor;
  onChange: (color: HabitColor) => void;
}

/**
 * Campo "Color" del formulario de hábito: ocho colores a la vista (entre ellos, el elegido) y "Más
 * colores", que abre una hoja con toda la paleta.
 */
export function HabitColorPicker({ value, onChange }: HabitColorPickerProps) {
  const colors = useThemeColors();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="gap-2">
      <FieldLabel>Color</FieldLabel>
      {/* Cuatro por fila: los ocho caben en dos filas parejas a 360 px. */}
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap">
        {visibleHabitColors(value).map((color) => (
          <Swatch
            key={color}
            color={color}
            isSelected={color === value}
            widthClass="w-1/4"
            onPress={() => onChange(color)}
          />
        ))}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={() => setIsOpen(true)}
        className="min-h-11 flex-row items-center gap-2 self-start px-1 active:opacity-85"
      >
        <PlusIcon size={18} color={colors.emberStrong} />
        <Text className="font-body-bold text-body text-ember-strong">Más colores</Text>
      </Pressable>
      <Hint>Cada hábito nuevo empieza con un color distinto. Cámbialo si quieres.</Hint>

      <BottomSheet
        isOpen={isOpen}
        title="Color del hábito"
        subtitle={`${HABIT_COLORS_BY_HUE.length} colores para elegir.`}
        onClose={() => setIsOpen(false)}
      >
        {/* Ordenados por tono, seis por fila: a 360 px cada casilla mide más de 44 px. */}
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap pb-1">
          {HABIT_COLORS_BY_HUE.map((color) => (
            <Swatch
              key={color}
              color={color}
              isSelected={color === value}
              widthClass="w-1/6"
              onPress={() => {
                onChange(color);
                setIsOpen(false);
              }}
            />
          ))}
        </View>
      </BottomSheet>
    </View>
  );
}

function Swatch({
  color,
  isSelected,
  widthClass,
  onPress,
}: {
  color: HabitColor;
  isSelected: boolean;
  widthClass: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={`Color ${color}`}
      accessibilityState={{ checked: isSelected }}
      onPress={onPress}
      className={`h-12 items-center justify-center active:opacity-85 ${widthClass}`}
    >
      {/* El elegido lleva un check del tono oscuro de su color, no solo un aro. */}
      <View
        className="h-10 w-10 items-center justify-center rounded-full"
        style={{
          backgroundColor: color,
          borderWidth: isSelected ? 2 : 0,
          borderColor: strongHabitColor(color),
        }}
      >
        {isSelected && <CheckIcon size={18} color={strongHabitColor(color)} />}
      </View>
    </Pressable>
  );
}
