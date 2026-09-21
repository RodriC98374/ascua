import { router } from 'expo-router';
import { View } from 'react-native';

import { HabitForm } from '@/components/habit-form';
import { ScreenHeader } from '@/components/screen-header';
import { Screen } from '@/components/ui/screen';
import { useUid } from '@/features/auth/session';
import { useHabits } from '@/features/data/hooks';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { createHabit, type HabitInput } from '@/operations/habits';

export default function NewHabitScreen() {
  const uid = useUid();
  const habits = useHabits(uid);

  function handleSubmit(input: HabitInput) {
    // Al final de la lista. No se espera la escritura: sin conexión queda en cola.
    const sortOrder = Math.max(-1, ...habits.data.map((habit) => habit.sortOrder)) + 1;
    const { write } = createHabit(db, uid, input, sortOrder);
    trackWrite(write);
    router.back();
  }

  return (
    <Screen>
      <View className="gap-6">
        <ScreenHeader title="Nuevo hábito" fallbackHref="/ajustes" />
        {!habits.isLoading && <HabitForm habits={habits.data} onSubmit={handleSubmit} />}
      </View>
    </Screen>
  );
}
