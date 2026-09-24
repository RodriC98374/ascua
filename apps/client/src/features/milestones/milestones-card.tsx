import { milestoneProgress, STREAK_MILESTONES, type StreakMilestone } from '@ascua/shared';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ProgressBar } from '@/components/ui/progress-bar';
import { plural } from '@/features/statistics/statistics-text';

import { StreakBadge } from './streak-badge';

/** Lo que dice cada hito al ganarlo, en la celebración y cuando ya están todos. */
export const MILESTONE_MESSAGES: Record<StreakMilestone, string> = {
  7: 'Una semana entera con la racha encendida.',
  30: 'Un mes completo: esto ya es un hábito.',
  100: 'Cien días. Pocas brasas duran tanto.',
  365: 'Un año entero sin apagarse.',
};

/**
 * Insignias de racha de todos los tiempos: las ganadas con la mejor racha y cuánto le falta a la
 * racha actual para la próxima.
 */
export function MilestonesCard({
  longestStreak,
  currentStreak,
}: {
  longestStreak: number;
  currentStreak: number;
}) {
  const { earned, next } = milestoneProgress(longestStreak, currentStreak);
  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Insignias de racha</Text>
        <Text className="font-body text-caption text-ink-muted">
          {next
            ? `Te ${next.remaining === 1 ? 'falta' : 'faltan'} ${plural(next.remaining, 'día', 'días')} de racha para la de ${next.days}.`
            : MILESTONE_MESSAGES[365]}
        </Text>
      </View>
      <View className="flex-row justify-between">
        {STREAK_MILESTONES.map((days) => {
          const isEarned = earned.includes(days);
          return (
            <View key={days} className="items-center gap-1.5">
              <StreakBadge days={days} size={60} isEarned={isEarned} />
              <Text
                className={`font-body-bold text-caption ${isEarned ? 'text-ink' : 'text-ink-muted'}`}
              >
                {days} días
              </Text>
            </View>
          );
        })}
      </View>
      {next && (
        <View className="gap-1.5">
          <ProgressBar value={(currentStreak / next.days) * 100} />
          <Text className="font-body-semibold text-caption text-ink-muted">
            {currentStreak} de {next.days} días
          </Text>
        </View>
      )}
    </Card>
  );
}
