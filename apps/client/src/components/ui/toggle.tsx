import { Pressable, View } from 'react-native';

import { useThemeColors } from '@/theme/colors';

interface ToggleProps {
  value: boolean;
  onChange: (value: boolean) => void;
  accessibilityLabel: string;
}

/**
 * Interruptor con los colores del diseño, igual en Android y en web (el `Switch` de React Native
 * usa otro color de pulgar en web). El área táctil llega a 44 px con `hitSlop`.
 */
export function Toggle({ value, onChange, accessibilityLabel }: ToggleProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ checked: value }}
      onPress={() => onChange(!value)}
      hitSlop={8}
      className={`h-8 w-14 justify-center rounded-full px-1 ${value ? 'bg-ember' : 'bg-border'}`}
    >
      <View
        // En oscuro el pulgar va claro: el fondo de pantalla desaparecería sobre la pista.
        className={`bg-surface-100 dark:bg-ink h-6 w-6 rounded-full ${value ? 'self-end' : 'self-start'}`}
        style={{
          // shadow-sm del diseño.
          shadowColor: colors.shadowNeutral,
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.15,
          shadowRadius: 2,
          elevation: 2,
        }}
      />
    </Pressable>
  );
}
