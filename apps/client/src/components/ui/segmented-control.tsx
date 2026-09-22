import { Pressable, Text, View } from 'react-native';

import { colors } from '@/theme/colors';

interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** Opciones excluyentes en una píldora (Semana / Mes / Año). Cada opción mide 44 px de alto. */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      className="bg-surface-300 flex-row rounded-md p-1"
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            className={`min-h-11 flex-1 items-center justify-center rounded-sm ${isSelected ? 'bg-surface-200' : ''}`}
            style={
              isSelected
                ? {
                    // shadow-sm del diseño.
                    shadowColor: colors.ink,
                    shadowOffset: { width: 0, height: 1 },
                    shadowOpacity: 0.08,
                    shadowRadius: 2,
                    elevation: 1,
                  }
                : undefined
            }
          >
            <Text
              className={`font-body-bold text-button ${isSelected ? 'text-ember-strong' : 'text-ink-muted'}`}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
