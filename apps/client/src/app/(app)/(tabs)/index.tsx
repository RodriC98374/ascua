import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { PointsCounter, ProtectorIndicator, StreakIndicator } from '@/components/gamification';
import { HabitCheck } from '@/components/habit-check';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckIcon, CloudIcon, StarIcon } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/progress-bar';
import { Screen } from '@/components/ui/screen';
import { useUid } from '@/features/auth/session';
import { useDailyLog, useGamificationState, useHabits } from '@/features/data/hooks';
import { trackWrite } from '@/features/sync/write-errors';
import { formatLongDate } from '@/features/today/format-date';
import { buildTodaySummary, type TodaySummary } from '@/features/today/today-summary';
import { useToday } from '@/features/today/use-today';
import { db } from '@/lib/firebase';
import { setHabitCompletion } from '@/operations/daily-log';
import { colors, emberGradient } from '@/theme/colors';

export default function TodayScreen() {
  const uid = useUid();
  const today = useToday();
  const habits = useHabits(uid);
  const log = useDailyLog(uid, today);
  const gamification = useGamificationState(uid);

  if (habits.isLoading || log.isLoading || !gamification.data) {
    return (
      <View className="bg-surface-100 flex-1 items-center justify-center">
        <ActivityIndicator color={colors.emberStrong} size="large" />
      </View>
    );
  }

  const state = gamification.data;
  const summary = buildTodaySummary({
    today,
    habits: habits.data,
    entries: log.data?.entries ?? {},
    state,
  });

  function toggle(habitId: string) {
    trackWrite(
      setHabitCompletion(db, uid, {
        today,
        habitId,
        completed: !summary.isDone(habitId),
        logExists: log.exists,
      }),
    );
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <View className="flex-row items-start justify-between">
          <View>
            <Text className="font-heading text-heading-lg text-ink">Hoy</Text>
            <Text className="font-body-semibold text-caption text-ink-muted">
              {formatLongDate(today)}
            </Text>
          </View>
          {(log.hasPendingWrites || habits.hasPendingWrites) && <PendingSyncChip />}
        </View>

        <View className="flex-row items-start justify-between">
          <StreakIndicator days={summary.streakDays} />
          <View className="items-end">
            <Text className="font-body-extrabold text-label text-ink-muted uppercase">Saldo</Text>
            <Text className="font-heading-extrabold text-display-md text-ink">
              {state.pointsBalance}
            </Text>
            <Text className="font-body-semibold text-caption text-ink-muted">puntos</Text>
          </View>
        </View>

        <ProtectorIndicator active={state.streakFreezesAvailable} />

        {summary.hasHabits ? (
          <>
            <ProgressCard summary={summary} />
            {summary.isPerfectDay && <PerfectDayBanner />}
            <HabitSection title="Hábitos principales">
              {summary.primaries.map((habit) => (
                <HabitCheck
                  key={habit.id}
                  name={habit.name}
                  tier="primary"
                  isDone={summary.isDone(habit.id)}
                  onToggle={() => toggle(habit.id)}
                />
              ))}
            </HabitSection>
            <HabitSection title="Hábitos secundarios">
              {summary.secondaries.map((habit) => (
                <HabitCheck
                  key={habit.id}
                  name={habit.name}
                  tier="secondary"
                  isDone={summary.isDone(habit.id)}
                  onToggle={() => toggle(habit.id)}
                />
              ))}
            </HabitSection>
            <View className="items-end gap-1">
              <PointsCounter today={summary.pointsToday} />
              <Text className="font-body-semibold text-caption text-ink-muted text-right">
                {pointsBreakdownText(summary)}
              </Text>
            </View>
          </>
        ) : (
          <EmptyState />
        )}
      </View>
    </Screen>
  );
}

function ProgressCard({ summary }: { summary: TodaySummary }) {
  const { primaryProgress, secondaryProgress } = summary;
  const detail = [
    primaryProgress.total > 0 && `${primaryProgress.done} de ${primaryProgress.total} principales`,
    secondaryProgress.total > 0 &&
      `${secondaryProgress.done} de ${secondaryProgress.total} secundarios`,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <Card>
      <View className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="font-heading text-heading-sm text-ink">Progreso de hoy</Text>
          <Text className="font-body-extrabold text-caption text-ink">
            {summary.progressPercent}%
          </Text>
        </View>
        <ProgressBar value={summary.progressPercent} />
        <Text className="font-body-semibold text-caption text-ink-muted">{detail}</Text>
        {summary.isGoalMet ? (
          <View className="mt-1 flex-row items-center gap-1.5">
            <CheckIcon size={16} color={colors.success} />
            <Text className="font-body-bold text-body text-success">Racha de hoy asegurada</Text>
          </View>
        ) : (
          <Text className="font-body text-body text-ink-muted mt-1">
            Cumple tus hábitos principales para sumar un día a tu racha.
          </Text>
        )}
      </View>
    </Card>
  );
}

function PerfectDayBanner() {
  return (
    <LinearGradient
      colors={emberGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{
        borderRadius: 18,
        paddingHorizontal: 16,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <StarIcon size={20} color={colors.inkOnFill} />
      <View>
        <Text className="font-body-bold text-body text-ink-on-fill">Día perfecto</Text>
        <Text className="font-body-semibold text-caption text-ink-on-fill">
          Ganaste +5 pts extra por completar todo
        </Text>
      </View>
    </LinearGradient>
  );
}

function HabitSection({ title, children }: { title: string; children: ReactNode[] }) {
  if (children.length === 0) return null;
  return (
    <View>
      <Text className="font-heading text-heading-md text-ink mb-2">{title}</Text>
      {children}
    </View>
  );
}

function PendingSyncChip() {
  return (
    <View
      accessibilityLabel="Hay cambios pendientes de sincronizar"
      className="bg-surface-300 flex-row items-center gap-1 rounded-full px-2 py-1"
    >
      <CloudIcon size={14} color={colors.inkMuted} />
      <Text className="font-body-bold text-caption text-ink-muted">Pendiente</Text>
    </View>
  );
}

function EmptyState() {
  return (
    <Card>
      <View className="gap-4">
        <View className="gap-1">
          <Text className="font-heading text-heading-md text-ink">Crea tu primer hábito</Text>
          <Text className="font-body text-body text-ink-muted">
            Elige hasta 3 principales: son los que mantienen viva tu racha.
          </Text>
        </View>
        <Button label="Agregar hábito" onPress={() => router.push('/habits/new')} />
      </View>
    </Card>
  );
}

function pointsBreakdownText({ pointsBreakdown }: TodaySummary): string {
  const parts = [
    pointsBreakdown.primary > 0 && `+${pointsBreakdown.primary} principales`,
    pointsBreakdown.secondary > 0 && `+${pointsBreakdown.secondary} secundarios`,
    pointsBreakdown.perfectDay > 0 && `+${pointsBreakdown.perfectDay} día perfecto`,
    pointsBreakdown.streak > 0 && `+${pointsBreakdown.streak} bono de racha`,
  ];
  return parts.filter(Boolean).join(' · ') || 'Marca un hábito para sumar puntos hoy';
}
