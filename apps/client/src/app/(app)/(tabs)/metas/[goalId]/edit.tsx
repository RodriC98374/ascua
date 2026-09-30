import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useGoals, useHabits } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { GoalForm } from '@/features/goals/goal-form';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { updateGoal, type GoalInput } from '@/operations/goals';

export default function EditGoalScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const uid = useUid();
  const habits = useHabits(uid);
  const goals = useGoals(uid);
  const goal = goals.data.find((candidate) => candidate.id === goalId);

  function handleSubmit(input: GoalInput) {
    trackWrite(updateGoal(db, uid, goalId, input));
    router.back();
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Editar meta" fallbackHref="/metas" />
        {!goals.isLoading && !goal && (
          <Text className="font-body text-body text-ink-muted">Esta meta ya no existe.</Text>
        )}
        {goal && !habits.isLoading && (
          <GoalForm habits={habits.data} goal={goal} onSubmit={handleSubmit} />
        )}
      </View>
    </Screen>
  );
}
