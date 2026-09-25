import { router } from 'expo-router';
import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { useUid } from '@/features/auth/session';
import { trackWrite } from '@/features/sync/write-errors';
import { TaskForm } from '@/features/tasks/task-form';
import { useToday } from '@/features/today/use-today';
import { db } from '@/lib/firebase';
import { createTask, type TaskInput } from '@/operations/tasks';

export default function NewTaskScreen() {
  const uid = useUid();
  const today = useToday();

  function handleSubmit(input: TaskInput) {
    // No se espera la escritura: sin conexión queda en cola.
    trackWrite(createTask(db, uid, input).write);
    router.back();
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Nueva tarea" fallbackHref="/" />
        <TaskForm today={today} onSubmit={handleSubmit} />
      </View>
    </Screen>
  );
}
