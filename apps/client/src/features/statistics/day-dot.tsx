import type { DayStatsStatus } from '@ascua/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { useThemeColors } from '@/theme/colors';

/**
 * Punto de estado del día, como en la grilla del diseño. Nunca va solo: siempre lo acompaña
 * el porcentaje o la etiqueta del estado. Hoy es un anillo sin relleno (el día sigue abierto).
 */
export function DayDot({
  status,
  isToday = false,
  size = 10,
}: {
  status: DayStatsStatus;
  isToday?: boolean;
  size?: number;
}) {
  const colors = useThemeColors();
  const shape = { width: size, height: size, borderRadius: size / 2 };
  if (isToday && status === 'open') {
    return <View style={{ ...shape, borderWidth: 2, borderColor: colors.emberStrong }} />;
  }
  if (status === 'perfect') {
    return (
      <LinearGradient
        colors={colors.emberGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={shape}
      />
    );
  }
  if (status === 'inactive') {
    return (
      <View
        style={{
          ...shape,
          backgroundColor: colors.vacioSoft,
          borderWidth: 1.5,
          borderColor: colors.border,
        }}
      />
    );
  }
  const color =
    status === 'completed'
      ? colors.success
      : status === 'frozen'
        ? colors.protegido
        : status === 'missed'
          ? colors.error
          : undefined;
  // Abiertos del pasado, sin datos y futuros: sin punto, pero ocupando su lugar.
  return <View style={{ ...shape, backgroundColor: color ?? 'transparent' }} />;
}
