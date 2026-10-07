import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ChevronIcon, ClockIcon } from '@/components/ui/icons';
import { useThemeColors } from '@/theme/colors';

import { graceDayMessage } from './grace-day-text';
import type { TodaySummary } from './today-summary';

interface GraceDayBandProps {
  /** Ayer calculado como un día suelto: de aquí salen los hábitos que quedaron sin marcar. */
  summary: TodaySummary;
  /** Racha y protectores oficiales antes de ayer. */
  streakDays: number;
  freezes: number;
}

/**
 * Aviso en Hoy mientras ayer sigue abierto (día de gracia, D29): dice qué quedó sin marcar y lleva a
 * marcarlo. Sin pendientes no se muestra.
 */
export function GraceDayBand({ summary, streakDays, freezes }: GraceDayBandProps) {
  const colors = useThemeColors();
  const message = graceDayMessage({
    missingPrimaries: summary.primaryProgress.total - summary.primaryProgress.done,
    missingOthers: summary.secondaryProgress.total - summary.secondaryProgress.done,
    streakDays,
    freezes,
  });
  if (!message) return null;
  // Con principales sin marcar la racha está en juego (aviso cálido); con solo secundarios, no.
  const isStreakAtStake = summary.primaryProgress.total > summary.primaryProgress.done;
  const tone = isStreakAtStake
    ? { container: 'bg-warning-soft', text: 'text-warning', color: colors.warning }
    : { container: 'bg-surface-300', text: 'text-ink-muted', color: colors.inkMuted };

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Marcar ayer"
      accessibilityHint={message}
      onPress={() => router.push('/ayer')}
      className={`${tone.container} min-h-14 flex-row items-center gap-3 rounded-xl px-4 py-3 active:opacity-85`}
    >
      <ClockIcon size={20} color={tone.color} />
      <View className="flex-1 gap-0.5">
        <Text className={`font-body-bold text-caption ${tone.text}`}>{message}</Text>
        <Text className={`font-body-extrabold text-caption ${tone.text}`}>Marcar ayer</Text>
      </View>
      <ChevronIcon direction="right" size={18} color={tone.color} />
    </Pressable>
  );
}
