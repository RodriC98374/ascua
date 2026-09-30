import { router } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useGoals, useHabits } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { GoalForm } from '@/features/goals/goal-form';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { createGoal, type GoalInput } from '@/operations/goals';

export default function NewGoalScreen() {
  const uid = useUid();
  const habits = useHabits(uid);
  const goals = useGoals(uid);

  function handleSubmit(input: GoalInput) {
    // Al final de la lista. Sin esperar la escritura: sin conexión queda en cola.
    const sortOrder = Math.max(-1, ...goals.data.map((goal) => goal.sortOrder)) + 1;
    const { goalId, write } = createGoal(db, uid, input, sortOrder);
    trackWrite(write);
    router.replace({ pathname: '/metas/[goalId]', params: { goalId } });
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Nueva meta" fallbackHref="/metas" />
        {!habits.isLoading && !goals.isLoading && (
          <GoalForm habits={habits.data} onSubmit={handleSubmit} />
        )}
      </View>
    </Screen>
  );
}
