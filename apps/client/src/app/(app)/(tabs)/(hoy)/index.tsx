import {
  DEFAULT_REMINDER_SETTINGS,
  formatLongDate,
  MAX_PRIMARY_HABITS,
  PERFECT_DAY_BONUS,
  streakRiskAt,
  type DateKey,
  type GamificationState,
  type HabitRecord,
} from '@ascua/shared';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState, type ReactNode } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { HabitActions } from '@/features/habits/habit-actions';
import { HabitCheck } from '@/features/today/habit-check';
import { TodayHero } from '@/features/today/today-hero';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { ArrowIcon, CloudIcon, StarIcon } from '@/components/ui/icons';
import { Screen } from '@/components/ui/screen';
import { Sparks } from '@/components/ui/sparks';
import { celebrationFeedback } from '@/features/celebration/haptics';
import { StreakCelebrationModal } from '@/features/celebration/streak-celebration';
import { useTodayMoments } from '@/features/celebration/use-today-moments';
import { useUid } from '@/features/auth/session';
import { useDailyLog, useGamificationState, useHabits, useUserProfile } from '@/data/hooks';
import { canMove, moveHabit, type MoveOffset } from '@/features/habits/habit-order';
import { trackWrite } from '@/features/sync/write-errors';
import { buildTodaySummary, type TodaySummary } from '@/features/today/today-summary';
import { useMinuteClock } from '@/features/today/use-minute-clock';
import { useToday } from '@/features/today/use-today';
import { db } from '@/lib/firebase';
import { setHabitCompletion } from '@/operations/daily-log';
import { reorderHabits } from '@/operations/habits';
import { useThemeColors } from '@/theme/colors';
import { SPRING_POP } from '@/theme/motion';

export default function TodayScreen() {
  const colors = useThemeColors();
  const uid = useUid();
  const today = useToday();
  const habits = useHabits(uid);
  const log = useDailyLog(uid, today);
  const gamification = useGamificationState(uid);
  // El perfil no frena la pantalla: mientras llega se usa la hora por defecto.
  const profile = useUserProfile(uid);

  if (habits.isLoading || log.isLoading || !gamification.data) {
    return (
      <View className="bg-surface-100 flex-1 items-center justify-center">
        <ActivityIndicator color={colors.emberStrong} size="large" />
      </View>
    );
  }

  return (
    <TodayContent
      uid={uid}
      today={today}
      habits={habits}
      log={log}
      state={gamification.data}
      riskTime={
        profile.data?.reminderSettings.streakRiskReminderTime ??
        DEFAULT_REMINDER_SETTINGS.streakRiskReminderTime
      }
    />
  );
}

interface TodayContentProps {
  uid: string;
  today: DateKey;
  habits: ReturnType<typeof useHabits>;
  log: ReturnType<typeof useDailyLog>;
  state: GamificationState;
  /** 'HH:mm' desde la que Hoy avisa que la racha está en riesgo. */
  riskTime: string;
}

/** Hoy con los datos ya cargados: aquí viven los momentos de logro, que comparan render a render. */
function TodayContent({ uid, today, habits, log, state, riskTime }: TodayContentProps) {
  const [isReordering, setIsReordering] = useState(false);
  const now = useMinuteClock();
  const summary = buildTodaySummary({
    today,
    habits: habits.data,
    entries: log.data?.entries ?? {},
    state,
  });
  const moments = useTodayMoments({
    today,
    isGoalMet: summary.isGoalMet,
    isPerfectDay: summary.isPerfectDay,
    streakDays: summary.streakDays,
    streakBonus: summary.pointsBreakdown.streak,
  });
  const risk = streakRiskAt({
    now,
    riskTime,
    isGoalMet: summary.isGoalMet,
    hasPrimaries: summary.primaries.length > 0,
    currentStreak: state.currentStreak,
    streakFreezesAvailable: state.streakFreezesAvailable,
  });
  const canReorder = habits.data.filter((habit) => habit.status === 'active').length > 1;

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

  function move(habitId: string, offset: MoveOffset) {
    trackWrite(reorderHabits(db, uid, moveHabit(habits.data, habitId, offset), habits.data));
  }

  function row(habit: HabitRecord) {
    const isArchived = habit.status === 'archived';
    let trailing: ReactNode;
    if (isReordering) {
      trailing = isArchived ? undefined : (
        <View className="flex-row">
          <MoveButton
            direction="up"
            habitName={habit.name}
            isEnabled={canMove(habits.data, habit.id, -1)}
            onPress={() => move(habit.id, -1)}
          />
          <MoveButton
            direction="down"
            habitName={habit.name}
            isEnabled={canMove(habits.data, habit.id, 1)}
            onPress={() => move(habit.id, 1)}
          />
        </View>
      );
    } else if (!isArchived) {
      trailing = <HabitActions habit={habit} />;
    }
    return (
      <HabitCheck
        key={habit.id}
        name={habit.name}
        tier={habit.tier}
        color={habit.color}
        isDone={summary.isDone(habit.id)}
        isArchived={isArchived}
        isToggleDisabled={isReordering}
        onToggle={() => toggle(habit.id)}
        trailing={trailing}
      />
    );
  }

  const reorderAction = canReorder && (
    <Button
      label={isReordering ? 'Listo' : 'Ordenar'}
      variant="link"
      onPress={() => setIsReordering((current) => !current)}
    />
  );
  const hasPrimaries = summary.primaries.length > 0;

  return (
    <View className="flex-1">
      <Screen edges={['top']}>
        <View className="gap-6">
          <View className="flex-row items-start justify-between gap-2">
            <View className="flex-1">
              <Text className="font-heading-extrabold text-display-md text-ink">Hoy</Text>
              <Text className="font-body-semibold text-body text-ink-muted">
                {formatLongDate(today)}
              </Text>
            </View>
            {(log.hasPendingWrites || habits.hasPendingWrites) && <PendingSyncChip />}
          </View>

          {summary.hasHabits ? (
            <>
              <TodayHero
                summary={summary}
                pointsBalance={state.pointsBalance}
                streakFreezesAvailable={state.streakFreezesAvailable}
                risk={risk}
              />
              {summary.isPerfectDay && <PerfectDayBanner burst={moments.perfectDayBurst} />}

              {hasPrimaries && (
                <HabitSection
                  title="Principales"
                  progress={summary.primaryProgress}
                  action={reorderAction}
                >
                  <View className="gap-2">{summary.primaries.map(row)}</View>
                </HabitSection>
              )}
              {summary.secondaries.length > 0 && (
                <HabitSection
                  title="Secundarios"
                  progress={summary.secondaryProgress}
                  action={hasPrimaries ? undefined : reorderAction}
                >
                  <Card className="py-1">
                    {summary.secondaries.map((habit, index) => (
                      <View key={habit.id} className={index > 0 ? 'border-border border-t' : ''}>
                        {row(habit)}
                      </View>
                    ))}
                  </Card>
                </HabitSection>
              )}

              <PointsBreakdown summary={summary} />
            </>
          ) : (
            <EmptyState />
          )}
          {/* Espacio para que el botón flotante no tape la última fila. */}
          <View className="h-16" />
        </View>
      </Screen>
      {!isReordering && <Fab label="Crear hábito" onPress={() => router.push('/habits/new')} />}
      <StreakCelebrationModal
        uid={uid}
        today={today}
        celebration={moments.celebration}
        onClose={moments.dismissCelebration}
      />
    </View>
  );
}

function HabitSection({
  title,
  progress,
  action,
  children,
}: {
  title: string;
  progress: { done: number; total: number };
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <View className="gap-3">
      <View className="min-h-11 flex-row items-center gap-3">
        <Text className="font-heading text-heading-md text-ink">{title}</Text>
        <Text className="font-body-bold text-caption text-ink-muted flex-1">
          {progress.done} de {progress.total}
        </Text>
        {action}
      </View>
      {children}
    </View>
  );
}

function MoveButton({
  direction,
  habitName,
  isEnabled,
  onPress,
}: {
  direction: 'up' | 'down';
  habitName: string;
  isEnabled: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${direction === 'up' ? 'Subir' : 'Bajar'} ${habitName}`}
      disabled={!isEnabled}
      onPress={onPress}
      className={`h-11 w-11 items-center justify-center rounded-md ${isEnabled ? 'active:opacity-85' : 'opacity-30'}`}
    >
      <ArrowIcon direction={direction} size={18} color={colors.emberStrong} />
    </Pressable>
  );
}

/**
 * Aparece al completar todo. Si el día se vuelve perfecto con la pantalla abierta (`burst`), entra
 * con un rebote, la estrella gira y saltan chispas.
 */
function PerfectDayBanner({ burst }: { burst: number }) {
  const colors = useThemeColors();
  const pop = useSharedValue(1);

  useEffect(() => {
    if (burst === 0) return;
    celebrationFeedback();
    pop.set(0);
    pop.set(withSpring(1, SPRING_POP));
  }, [burst, pop]);

  const bannerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(pop.value, [0, 0.4], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(pop.value, [0, 1], [0.85, 1]) }],
  }));
  const starStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${interpolate(pop.value, [0, 1], [-180, 0])}deg` }],
  }));

  return (
    <Animated.View style={bannerStyle}>
      <LinearGradient
        colors={colors.emberGradient}
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
        <View>
          <Animated.View style={starStyle}>
            <StarIcon size={20} color={colors.inkOnFill} />
          </Animated.View>
          <Sparks burst={burst} radius={34} count={8} />
        </View>
        <View>
          <Text className="font-body-bold text-body text-ink-on-fill">Día perfecto</Text>
          <Text className="font-body-semibold text-caption text-ink-on-fill">
            Ganaste +{PERFECT_DAY_BONUS} pts extra por completar todo
          </Text>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function PendingSyncChip() {
  const colors = useThemeColors();
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
            Elige hasta {MAX_PRIMARY_HABITS} principales: son los que mantienen viva tu racha.
          </Text>
        </View>
        <Button label="Crear hábito" onPress={() => router.push('/habits/new')} />
      </View>
    </Card>
  );
}

/** De dónde salen los puntos de hoy, en una frase. */
function PointsBreakdown({ summary: { pointsBreakdown } }: { summary: TodaySummary }) {
  const parts = [
    pointsBreakdown.primary > 0 && `${pointsBreakdown.primary} por principales`,
    pointsBreakdown.secondary > 0 && `${pointsBreakdown.secondary} por secundarios`,
    pointsBreakdown.perfectDay > 0 && `${pointsBreakdown.perfectDay} por día perfecto`,
    pointsBreakdown.streak > 0 && `${pointsBreakdown.streak} de bono de racha`,
  ].filter((part): part is string => Boolean(part));
  const text =
    parts.length === 0
      ? 'Marca un hábito para sumar puntos hoy.'
      : `Hoy sumas ${joinSpanish(parts)}.`;
  return <Text className="font-body-semibold text-caption text-ink-muted">{text}</Text>;
}

function joinSpanish(parts: string[]): string {
  if (parts.length <= 1) return parts.join('');
  return `${parts.slice(0, -1).join(', ')} y ${parts.at(-1)}`;
}
