import type { StreakRisk } from '@ascua/shared';
import { Text, View } from 'react-native';

import { ClockIcon } from '@/components/ui/icons';
import { useThemeColors } from '@/theme/colors';

import { streakRiskMessage } from './streak-risk-text';

/**
 * Franja de la tarjeta de Hoy desde la hora de "racha en riesgo": cuánto queda para la medianoche
 * y qué pasa si no se cumplen los principales. Sin alarmas: dice lo que está en juego.
 */
export function StreakRiskBand({ risk, streakDays }: { risk: StreakRisk; streakDays: number }) {
  const colors = useThemeColors();
  return (
    <View className="bg-warning-soft flex-row items-center gap-2 rounded-t-xl px-5 py-3">
      <ClockIcon size={18} color={colors.warning} />
      <Text className="font-body-bold text-caption text-warning flex-1">
        {streakRiskMessage(risk, streakDays)}
      </Text>
    </View>
  );
}
