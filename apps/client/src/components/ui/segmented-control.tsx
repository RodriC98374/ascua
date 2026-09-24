import { useEffect, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

import { useActiveColorScheme, useThemeColors } from '@/theme/colors';
import { SPRING_SOFT } from '@/theme/motion';

interface SegmentedControlProps<T extends string> {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  accessibilityLabel: string;
}

/** Relleno de la pista (`p-1`). */
const TRACK_PADDING = 4;

/**
 * Opciones excluyentes en una píldora (Semana / Mes / Año). Cada opción mide 44 px de alto. La
 * pastilla de la elegida se desliza hasta la nueva: se ve de dónde viene el cambio.
 */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  const colors = useThemeColors();
  const isDark = useActiveColorScheme() === 'dark';
  const [trackWidth, setTrackWidth] = useState(0);
  const selectedIndex = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );
  const segmentWidth = trackWidth > 0 ? (trackWidth - TRACK_PADDING * 2) / options.length : 0;
  const position = useSharedValue(selectedIndex);

  useEffect(() => {
    position.set(withSpring(selectedIndex, SPRING_SOFT));
  }, [selectedIndex, position]);

  const pillStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: position.value * segmentWidth }],
  }));

  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      onLayout={(event) => setTrackWidth(event.nativeEvent.layout.width)}
      className="bg-surface-300 flex-row rounded-md p-1"
    >
      {segmentWidth > 0 && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: TRACK_PADDING,
              bottom: TRACK_PADDING,
              left: TRACK_PADDING,
              width: segmentWidth,
              borderRadius: 8,
              // En oscuro las superficies se aclaran al subir: la elegida va un tono sobre la pista.
              backgroundColor: isDark ? colors.border : colors.surface200,
              // shadow-sm del diseño.
              shadowColor: colors.shadowNeutral,
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.08,
              shadowRadius: 2,
              elevation: 1,
            },
            pillStyle,
          ]}
        />
      )}
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => onChange(option.value)}
            // Antes de medir la pista, la elegida se marca con su fondo, sin pastilla.
            className={`min-h-11 flex-1 items-center justify-center rounded-sm ${isSelected && segmentWidth === 0 ? 'bg-surface-200 dark:bg-border' : ''}`}
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
