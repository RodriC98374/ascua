import { canWriteReflection, formatDateRange, reflectionWeekEnd } from '@ascua/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useHabits, useWeeklyReflection } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { ReflectionForm } from '@/features/reflections/reflection-form';
import { WeekSummary } from '@/features/reflections/week-summary';
import { trackWrite } from '@/features/sync/write-errors';
import { useToday } from '@/features/today/use-today';
import { db } from '@/lib/firebase';
import { saveReflection, type ReflectionAnswers } from '@/operations/reflections';

/** Reflexión de una semana (fase 18): el resumen arriba y las tres preguntas debajo. */
export default function ReflectionScreen() {
  const { weekStartDateKey } = useLocalSearchParams<{ weekStartDateKey: string }>();
  const uid = useUid();
  const today = useToday();
  const habits = useHabits(uid);
  const reflection = useWeeklyReflection(uid, weekStartDateKey);
  const isWritable = canWriteReflection(weekStartDateKey, today);

  function handleSubmit(answers: ReflectionAnswers) {
    trackWrite(saveReflection(db, uid, weekStartDateKey, answers, reflection.exists));
    router.back();
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Reflexión semanal" fallbackHref="/metas" />
        {!isWritable ? (
          <Text className="font-body text-body text-ink-muted">
            Esta semana todavía no termina. La reflexión se abre el domingo.
          </Text>
        ) : (
          <>
            <Text className="font-heading text-heading-md text-ink">
              Semana del {formatDateRange(weekStartDateKey, reflectionWeekEnd(weekStartDateKey))}
            </Text>
            {!habits.isLoading && (
              <WeekSummary weekStartDateKey={weekStartDateKey} habits={habits.data} today={today} />
            )}
            {!reflection.isLoading && (
              <ReflectionForm reflection={reflection.data} onSubmit={handleSubmit} />
            )}
          </>
        )}
      </View>
    </Screen>
  );
}
