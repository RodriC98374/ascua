import { isTaskLocked } from '@ascua/shared';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useTodayTasks } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { trackWrite } from '@/features/sync/write-errors';
import { TaskForm } from '@/features/tasks/task-form';
import { useToday } from '@/features/today/use-today';
import { db } from '@/lib/firebase';
import { updateTask, type TaskInput } from '@/operations/tasks';

/** Editar una tarea. Borrarla o pasarla a mañana vive en su menú de tres puntos, en Hoy. */
export default function EditTaskScreen() {
  const { taskId } = useLocalSearchParams<{ taskId: string }>();
  const uid = useUid();
  const today = useToday();
  const tasks = useTodayTasks(uid, today);
  const task = tasks.data.find((candidate) => candidate.id === taskId);

  function handleSubmit(input: TaskInput) {
    trackWrite(updateTask(db, uid, taskId, input));
    router.back();
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Editar tarea" fallbackHref="/" />
        {!tasks.isLoading && (!task || isTaskLocked(task, today)) && (
          <Text className="font-body text-body text-ink-muted">
            Esta tarea ya no se puede editar.
          </Text>
        )}
        {task && !isTaskLocked(task, today) && (
          <TaskForm today={today} task={task} onSubmit={handleSubmit} />
        )}
      </View>
    </Screen>
  );
}
