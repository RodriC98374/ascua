import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useGoals, useHabits } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { GoalDetail } from '@/features/goals/goal-detail';
import { useToday } from '@/features/today/use-today';

export default function GoalScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const uid = useUid();
  const today = useToday();
  const goals = useGoals(uid);
  const habits = useHabits(uid);
  const goal = goals.data.find((candidate) => candidate.id === goalId);

  return (
    <Screen edges={['top']}>
      <View className="gap-4">
        <ScreenHeader title="Meta" fallbackHref="/metas" />
        {!goals.isLoading && !goal && (
          <Text className="font-body text-body text-ink-muted">Esta meta ya no existe.</Text>
        )}
        {goal && !habits.isLoading && <GoalDetail goal={goal} habits={habits.data} today={today} />}
      </View>
    </Screen>
  );
}
