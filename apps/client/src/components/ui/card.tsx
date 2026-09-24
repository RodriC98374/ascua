import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useThemeColors } from '@/theme/colors';

/** Contenedor base: surface-200, radio lg, padding 16. Nunca una Card dentro de otra. */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  const colors = useThemeColors();
  return (
    <View
      className={`bg-surface-200 rounded-lg p-4 ${className}`}
      // Sombra cálida del diseño (shadow-md); en Android, elevation.
      style={{
        shadowColor: colors.shadowWarm,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.18,
        shadowRadius: 12,
        elevation: 2,
      }}
    >
      {children}
    </View>
  );
}
