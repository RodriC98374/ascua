import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { HabitForm } from '@/components/habit-form';
import { ScreenHeader } from '@/components/screen-header';
import { Screen } from '@/components/ui/screen';
import { useUid } from '@/features/auth/session';
import { useHabits } from '@/features/data/hooks';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { updateHabit, type HabitInput } from '@/operations/habits';

/** Editar un hábito. Archivar vive en su menú de tres puntos (Hoy y Ajustes). */
export default function EditHabitScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const uid = useUid();
  const habits = useHabits(uid);
  const habit = habits.data.find((candidate) => candidate.id === habitId);

  function handleSubmit(input: HabitInput) {
    trackWrite(updateHabit(db, uid, habitId, input));
    router.back();
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Editar hábito" fallbackHref="/" />
        {!habits.isLoading && !habit && (
          <Text className="font-body text-body text-ink-muted">Este hábito ya no existe.</Text>
        )}
        {habit?.status === 'archived' && (
          <Text className="font-body text-body text-ink-muted">
            Este hábito está archivado desde el {habit.archivedDateKey}.
          </Text>
        )}
        {habit?.status === 'active' && (
          <HabitForm habits={habits.data} habit={habit} onSubmit={handleSubmit} />
        )}
      </View>
    </Screen>
  );
}
