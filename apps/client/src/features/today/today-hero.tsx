// Tarjeta principal de Hoy: el brasero con la racha, qué falta para asegurarla y los puntos.
import { MAX_STREAK_FREEZES, type StreakRisk } from '@ascua/shared';
import { Text, View } from 'react-native';

import { StreakHearth } from '@/features/today/streak-hearth';
import { CheckIcon, ShieldIcon } from '@/components/ui/icons';
import { RollingNumber } from '@/components/ui/rolling-number';
import { StreakRiskBand } from '@/features/today/streak-risk-band';
import type { TodaySummary } from '@/features/today/today-summary';
import { useThemeColors } from '@/theme/colors';

interface TodayHeroProps {
  summary: TodaySummary;
  pointsBalance: number;
  streakFreezesAvailable: number;
  /** Desde la hora de racha en riesgo y sin la meta cumplida. */
  risk: StreakRisk | null;
}

export function TodayHero({
  summary,
  pointsBalance,
  streakFreezesAvailable,
  risk,
}: TodayHeroProps) {
  const colors = useThemeColors();
  const { primaryProgress, streakDays } = summary;
  return (
    <View
      className="bg-surface-200 rounded-xl"
      style={{
        shadowColor: colors.shadowWarm,
        shadowOffset: { width: 0, height: 12 },
        shadowOpacity: 0.22,
        shadowRadius: 20,
        elevation: 4,
      }}
    >
      {risk && <StreakRiskBand risk={risk} streakDays={streakDays} />}
      <View className="flex-row items-center gap-5 p-5">
        <StreakHearth
          done={primaryProgress.done}
          total={primaryProgress.total}
          isStreakAlive={streakDays > 0}
        />
        <View className="flex-1 gap-1">
          <View>
            <RollingNumber
              value={streakDays}
              lineHeight={44}
              className="font-heading-extrabold text-display-lg text-ember-strong"
            />
            <Text className="font-body-bold text-body text-ink-muted">
              {streakDays === 1 ? 'día de racha' : 'días de racha'}
            </Text>
          </View>
          <GoalStatus summary={summary} />
        </View>
      </View>

      <View className="border-border flex-row items-start gap-4 border-t px-5 py-4">
        <View className="flex-1">
          <View
            accessible
            accessibilityLabel={`+${summary.pointsToday} hoy`}
            className="flex-row items-center"
          >
            <Text className="font-heading text-heading-md text-ember-strong">+</Text>
            <RollingNumber
              value={summary.pointsToday}
              lineHeight={24}
              className="font-heading text-heading-md text-ember-strong"
            />
            <Text className="font-heading text-heading-md text-ember-strong"> hoy</Text>
          </View>
          <Text className="font-body-semibold text-caption text-ink-muted">disponibles mañana</Text>
        </View>
        <View className="flex-1">
          <Text className="font-heading text-heading-md text-ink">{pointsBalance}</Text>
          <Text className="font-body-semibold text-caption text-ink-muted">puntos para gastar</Text>
        </View>
        <View
          accessibilityLabel={`${streakFreezesAvailable} de ${MAX_STREAK_FREEZES} protectores`}
          className="items-end"
        >
          <View className="h-6 flex-row items-center gap-1">
            {Array.from({ length: MAX_STREAK_FREEZES }, (_, index) => (
              <ShieldIcon
                key={index}
                size={18}
                color={index < streakFreezesAvailable ? colors.protegido : colors.inkFaint}
                filled={index < streakFreezesAvailable}
              />
            ))}
          </View>
          <Text className="font-body-semibold text-caption text-ink-muted">protectores</Text>
        </View>
      </View>
    </View>
  );
}

function GoalStatus({ summary }: { summary: TodaySummary }) {
  const colors = useThemeColors();
  const { primaryProgress, isGoalMet } = summary;
  if (primaryProgress.total === 0) {
    return (
      <Text className="font-body text-caption text-ink-muted">
        Agrega un hábito principal para encender tu racha.
      </Text>
    );
  }
  if (isGoalMet) {
    return (
      <View className="flex-row items-center gap-1.5">
        <CheckIcon size={16} color={colors.success} />
        <Text className="font-body-bold text-body text-success">Racha de hoy asegurada</Text>
      </View>
    );
  }
  const remaining = primaryProgress.total - primaryProgress.done;
  return (
    <Text className="font-body-semibold text-caption text-ink-muted">
      {remaining === 1
        ? 'Te falta 1 principal para sumar el día.'
        : `Te faltan ${remaining} principales para sumar el día.`}
    </Text>
  );
}
