import type { CheckInDimension } from '@ascua/shared';

import { useThemeColors } from '@/theme/colors';

/** Un color del palette por escala, el mismo en Hoy y en las gráficas. El morado es de la semana. */
export function useCheckInColors(): Readonly<Record<CheckInDimension, string>> {
  const colors = useThemeColors();
  return { mood: colors.weekRosa, energy: colors.weekAzul, motivation: colors.weekTurquesa };
}
