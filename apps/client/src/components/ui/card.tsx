import type { ReactNode } from 'react';
import { View } from 'react-native';

import { useThemeColors } from '@/theme/colors';

/**
 * Contenedor base: surface-200 (blanco en claro, sobre el fondo gris cálido), radio lg, padding
 * 16. Nunca una Card dentro de otra.
 */
export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  const colors = useThemeColors();
  return (
    <View
      className={`bg-surface-200 rounded-lg p-4 ${className}`}
      // Sombra neutra y corta: separa la tarjeta del fondo sin teñirla. El brillo cálido de la
      // brasa queda para lo que sí es de la racha (la tarjeta de Hoy y el botón flotante).
      style={{
        shadowColor: colors.shadowNeutral,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      {children}
    </View>
  );
}
