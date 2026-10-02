import {
  CATEGORY_HABIT_ICONS,
  HABIT_ICON_GROUPS,
  type HabitCategory,
  type HabitIcon as HabitIconId,
} from '@ascua/shared';
import { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { choiceContainer, choiceLabel } from '@/components/ui/choice-styles';
import { FieldLabel, Hint } from '@/components/ui/form-parts';
import { HabitIcon } from '@/features/habits/habit-icon';
import { useThemeColors } from '@/theme/colors';

interface HabitIconPickerProps {
  /** El ícono elegido, o `null` si lleva el de su categoría. */
  value: HabitIconId | null;
  /** La categoría del hábito: da el ícono mientras no se elija otro. */
  category: HabitCategory;
  onChange: (icon: HabitIconId | null) => void;
}

/**
 * Campo "Ícono" del formulario de hábito: muestra el que lleva y abre una hoja con el catálogo por
 * grupos. Solo íconos del catálogo (un emoji puede ir en el nombre, no aquí). Todo hábito se ve con
 * ícono: si no se elige, lleva el de su categoría.
 */
export function HabitIconPicker({ value, category, onChange }: HabitIconPickerProps) {
  const colors = useThemeColors();
  const { height } = useWindowDimensions();
  const [isOpen, setIsOpen] = useState(false);

  function select(icon: HabitIconId | null) {
    onChange(icon);
    setIsOpen(false);
  }

  return (
    <View className="gap-2">
      <FieldLabel>Ícono</FieldLabel>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Cambiar el ícono"
        onPress={() => setIsOpen(true)}
        className="border-border bg-surface-200 min-h-12 flex-row items-center gap-3 rounded-md border-[1.5px] px-3 active:opacity-85"
      >
        <View className="bg-surface-100 h-9 w-9 items-center justify-center rounded-full">
          <HabitIcon icon={value ?? CATEGORY_HABIT_ICONS[category]} size={20} color={colors.ink} />
        </View>
        <Text className="font-body-bold text-body text-ink flex-1">
          {value ? 'Ícono elegido' : 'El de la categoría'}
        </Text>
        <Text className="font-body-bold text-body text-ember-strong">Cambiar</Text>
      </Pressable>
      <Hint>Se ve junto al nombre en Hoy. Si no eliges uno, lleva el de su categoría.</Hint>

      <BottomSheet
        isOpen={isOpen}
        title="Ícono del hábito"
        subtitle="Elige uno o deja el de la categoría."
        onClose={() => setIsOpen(false)}
      >
        {/* La hoja no pasa de la mitad de la pantalla: el catálogo se recorre con el dedo. */}
        <ScrollView style={{ maxHeight: height * 0.5 }} contentContainerClassName="gap-4 pb-1">
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: value === null }}
            onPress={() => select(null)}
            className={`min-h-11 flex-row items-center gap-2 self-start rounded-full border-2 px-4 ${choiceContainer(value === null)}`}
          >
            <HabitIcon
              icon={CATEGORY_HABIT_ICONS[category]}
              size={18}
              color={value === null ? colors.emberStrong : colors.inkMuted}
            />
            <Text className={`font-body-extrabold text-button ${choiceLabel(value === null)}`}>
              El de la categoría
            </Text>
          </Pressable>
          {HABIT_ICON_GROUPS.map((group) => (
            <View key={group.label} className="gap-1">
              <Text className="font-body-bold text-caption text-ink-muted">{group.label}</Text>
              {/* Seis por fila: a 360 px cada casilla mide más de 44 px. */}
              <View accessibilityRole="radiogroup" className="flex-row flex-wrap">
                {group.icons.map((icon) => {
                  const isSelected = icon === value;
                  return (
                    <Pressable
                      key={icon}
                      accessibilityRole="radio"
                      accessibilityLabel={`Ícono ${icon}`}
                      accessibilityState={{ checked: isSelected }}
                      onPress={() => select(icon)}
                      className="h-12 w-1/6 items-center justify-center"
                    >
                      <View
                        className={`h-11 w-11 items-center justify-center rounded-md border-2 ${isSelected ? choiceContainer(true) : 'border-transparent active:opacity-70'}`}
                      >
                        <HabitIcon
                          icon={icon}
                          size={22}
                          color={isSelected ? colors.emberStrong : colors.ink}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}
        </ScrollView>
      </BottomSheet>
    </View>
  );
}
