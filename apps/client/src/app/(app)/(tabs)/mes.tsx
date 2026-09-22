import { periodContaining, periodNavigation, type Period, type PeriodKind } from '@ascua/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { useHabits } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { PeriodHeader } from '@/features/statistics/period-header';
import { MonthView, WeekView } from '@/features/statistics/range-view';
import { YearView } from '@/features/statistics/year-view';
import { useToday } from '@/features/today/use-today';
import { colors } from '@/theme/colors';

const KIND_OPTIONS = [
  { value: 'week', label: 'Semana' },
  { value: 'month', label: 'Mes' },
  { value: 'year', label: 'Año' },
] as const satisfies readonly { value: PeriodKind; label: string }[];

/** Progreso por semana, mes y año: grilla, gráficas y cumplimiento por hábito. */
export default function ProgressScreen() {
  const uid = useUid();
  const today = useToday();
  const habits = useHabits(uid);
  const [period, setPeriod] = useState<Period>(() => periodContaining('month', today));

  // Se puede ir hacia atrás hasta el primer día del primer hábito (también de los archivados).
  const firstDateKey = habits.data.reduce<string | null>(
    (first, habit) => (first === null || habit.startDateKey < first ? habit.startDateKey : first),
    null,
  );
  const navigation = periodNavigation(period, { today, firstDateKey });

  function changeKind(kind: PeriodKind) {
    // Se queda en la misma zona del calendario: hoy, o el último día del periodo que se veía.
    const anchor = period.endDateKey < today ? period.endDateKey : today;
    setPeriod(periodContaining(kind, anchor));
  }

  const viewProps = { uid, period, today, habits: habits.data };

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <Text className="font-heading-extrabold text-display-md text-ink">Tu progreso</Text>
        <View className="gap-3">
          <SegmentedControl
            options={KIND_OPTIONS}
            value={period.kind}
            onChange={changeKind}
            accessibilityLabel="Periodo"
          />
          <PeriodHeader
            period={period}
            today={today}
            navigation={navigation}
            onChange={setPeriod}
          />
        </View>

        {habits.isLoading ? (
          <ActivityIndicator color={colors.emberStrong} />
        ) : habits.data.length === 0 ? (
          <Card className="gap-4">
            <View className="gap-1">
              <Text className="font-heading text-heading-md text-ink">Tu progreso empieza hoy</Text>
              <Text className="font-body text-body text-ink-muted">
                Crea tus hábitos y aquí verás cada día, tu racha y cuánto cumples cada uno.
              </Text>
            </View>
            <Button label="Crear hábito" onPress={() => router.push('/habits/new')} />
          </Card>
        ) : period.kind === 'week' ? (
          <WeekView key={period.startDateKey} {...viewProps} />
        ) : period.kind === 'month' ? (
          <MonthView key={period.startDateKey} {...viewProps} />
        ) : (
          <YearView
            key={period.startDateKey}
            {...viewProps}
            onOpenMonth={(monthKey) => setPeriod(periodContaining('month', `${monthKey}-01`))}
          />
        )}
      </View>
    </Screen>
  );
}
