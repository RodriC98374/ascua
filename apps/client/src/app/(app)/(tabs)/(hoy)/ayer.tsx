import { addDays, formatLongDate, graceDateKey, startOfWeek } from '@ascua/shared';
import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { SectionHeader } from '@/components/ui/section-header';
import { useDailyLog, useDailyLogsInRange, useGamificationState, useHabits } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { graceDayMessage } from '@/features/today/grace-day-text';
import { habitMarks } from '@/features/today/habit-marks';
import { HabitRow } from '@/features/today/habit-row';
import { buildTodaySummary } from '@/features/today/today-summary';
import { useToday } from '@/features/today/use-today';
import { useThemeColors } from '@/theme/colors';

/**
 * Ayer, el día de gracia (D29): se pueden marcar los hábitos que se olvidaron hasta las 00:00 de
 * hoy. Después el día se cierra y sus puntos y su racha pasan a la cuenta. Solo hábitos: las tareas
 * se marcan el mismo día y el check-in, también.
 */
export default function YesterdayScreen() {
  const colors = useThemeColors();
  const uid = useUid();
  const today = useToday();
  const yesterday = addDays(today, -1);
  const habits = useHabits(uid);
  const log = useDailyLog(uid, yesterday);
  const weekLogs = useDailyLogsInRange(uid, startOfWeek(yesterday), yesterday);
  const gamification = useGamificationState(uid);
  const state = gamification.data;

  if (habits.isLoading || log.isLoading || !state) {
    return (
      <View className="bg-surface-100 flex-1 items-center justify-center">
        <ActivityIndicator color={colors.emberStrong} size="large" />
      </View>
    );
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Ayer" fallbackHref="/" />
        {graceDateKey(today, state.lastClosedDateKey) === null ? (
          <ClosedNotice />
        ) : (
          <YesterdayContent
            uid={uid}
            yesterday={yesterday}
            habits={habits}
            log={log}
            weekLogs={weekLogs.data}
            state={state}
          />
        )}
      </View>
    </Screen>
  );
}

function YesterdayContent({
  uid,
  yesterday,
  habits,
  log,
  weekLogs,
  state,
}: {
  uid: string;
  yesterday: string;
  habits: ReturnType<typeof useHabits>;
  log: ReturnType<typeof useDailyLog>;
  weekLogs: ReturnType<typeof useDailyLogsInRange>['data'];
  state: NonNullable<ReturnType<typeof useGamificationState>['data']>;
}) {
  const entries = log.data?.entries ?? {};
  const summary = buildTodaySummary({
    today: yesterday,
    habits: habits.data,
    entries,
    weekLogs,
    state,
  });
  const marks = habitMarks({
    uid,
    dateKey: yesterday,
    logExists: log.exists,
    entries,
    isDone: summary.isDone,
  });

  const row = (habit: (typeof summary.primaries)[number], caption?: string) => (
    <HabitRow
      habit={habit}
      marks={marks}
      isDone={summary.isDone(habit.id)}
      count={summary.countOf(habit.id)}
      entry={entries[habit.id]}
      caption={caption}
    />
  );

  const pending = graceDayMessage({
    missingPrimaries: summary.primaryProgress.total - summary.primaryProgress.done,
    missingOthers: summary.secondaryProgress.total - summary.secondaryProgress.done,
    streakDays: state.currentStreak,
    freezes: state.streakFreezesAvailable,
  });

  return (
    <>
      <View className="gap-1">
        <Text className="font-body-semibold text-body text-ink-muted">
          {formatLongDate(yesterday)}
        </Text>
        <Text className="font-body text-body text-ink-muted">
          Tienes hasta las 00:00 para marcar lo que hiciste ayer. Después el día se cierra y suma a
          tu racha y a tus puntos.
        </Text>
      </View>

      {summary.hasHabits ? (
        <>
          <Card className="gap-1">
            <Text className="font-heading text-heading-md text-ink">
              {summary.isGoalMet
                ? `Ayer cuenta: tu racha llega a ${summary.streakDays} ${summary.streakDays === 1 ? 'día' : 'días'}`
                : 'Ayer todavía no suma a tu racha'}
            </Text>
            <Text className="font-body text-body text-ink-muted">
              {pending ?? 'Marcaste todo lo de ayer.'}
            </Text>
            <Text className="font-body-semibold text-body text-ink-muted">
              Con lo marcado, ayer suma +{summary.pointsToday} pts a tu saldo cuando se cierre el
              día.
            </Text>
          </Card>

          {summary.primaries.length > 0 && (
            <Section title="Principales" progress={summary.primaryProgress}>
              {summary.primaries.map((habit, index) => (
                <View key={habit.id} className={index > 0 ? 'border-border border-t' : ''}>
                  {row(habit)}
                </View>
              ))}
            </Section>
          )}
          {summary.secondaries.length > 0 && (
            <Section title="Secundarios" progress={summary.secondaryProgress}>
              {summary.secondaries.map((habit, index) => (
                <View key={habit.id} className={index > 0 ? 'border-border border-t' : ''}>
                  {row(habit)}
                </View>
              ))}
            </Section>
          )}
          {summary.weeklies.length > 0 && (
            <Section
              title="Semanales"
              progress={{
                done: summary.weeklies.filter((weekly) => weekly.isMet).length,
                total: summary.weeklies.length,
              }}
            >
              {summary.weeklies.map((weekly, index) => (
                <View key={weekly.habit.id} className={index > 0 ? 'border-border border-t' : ''}>
                  {row(weekly.habit, `${weekly.count} de ${weekly.target} esa semana`)}
                </View>
              ))}
            </Section>
          )}
        </>
      ) : (
        <Card>
          <Text className="font-body text-body text-ink-muted">
            Ayer no tenías hábitos que marcar.
          </Text>
        </Card>
      )}
    </>
  );
}

function Section({
  title,
  progress,
  children,
}: {
  title: string;
  progress: { done: number; total: number };
  children: ReactNode;
}) {
  return (
    <View className="gap-2">
      <SectionHeader title={title} progress={progress} />
      <Card className="py-1">{children}</Card>
    </View>
  );
}

function ClosedNotice() {
  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Ayer ya se cerró</Text>
        <Text className="font-body text-body text-ink-muted">
          Lo que marcaste quedó guardado y ya suma a tu racha y a tus puntos. Un día cerrado no se
          puede cambiar.
        </Text>
      </View>
      <Button label="Volver a Hoy" onPress={() => router.replace('/')} />
    </Card>
  );
}
