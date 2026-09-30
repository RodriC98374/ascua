import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useUid } from '@/features/auth/session';
import { trackWrite } from '@/features/sync/write-errors';
import { TaskForm } from '@/features/tasks/task-form';
import { useToday } from '@/features/today/use-today';
import { db } from '@/lib/firebase';
import { createGoalTask } from '@/operations/goals';
import type { TaskInput } from '@/operations/tasks';

/** Nueva tarea de una meta: la misma de Hoy, que además suma al avance de la meta. */
export default function NewGoalTaskScreen() {
  const { goalId } = useLocalSearchParams<{ goalId: string }>();
  const uid = useUid();
  const today = useToday();

  function handleSubmit(input: TaskInput) {
    trackWrite(createGoalTask(db, uid, goalId, input).write);
    router.back();
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Nueva tarea de la meta" fallbackHref="/metas" />
        <TaskForm today={today} onSubmit={handleSubmit} />
      </View>
    </Screen>
  );
}
