// Tareas en Hoy: las vencidas primero, las de hoy y las cumplidas hoy; debajo, los puntos del día
// frente al tope y, plegadas, las próximas.
import {
  DAILY_TASK_POINTS_CAP,
  TASK_POINTS,
  todayTaskList,
  type DateKey,
  type DayTaskPoints,
  type TaskRecord,
} from '@ascua/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronIcon } from '@/components/ui/icons';
import { useThemeColors } from '@/theme/colors';

import { TaskActions } from './task-actions';
import { TaskRow } from './task-row';
import { taskPointsText } from './task-text';

interface TasksSectionProps {
  tasks: readonly TaskRecord[];
  today: DateKey;
  taskPoints: DayTaskPoints;
  onToggle: (task: TaskRecord) => void;
}

export function TasksSection({ tasks, today, taskPoints, onToggle }: TasksSectionProps) {
  const colors = useThemeColors();
  const [isShowingUpcoming, setIsShowingUpcoming] = useState(false);
  const list = todayTaskList(tasks, today);
  const forToday = [...list.overdue, ...list.dueToday, ...list.doneToday];
  const remainingPoints = Math.max(0, DAILY_TASK_POINTS_CAP - taskPoints.points);

  const row = (task: TaskRecord, index: number) => (
    <View key={task.id} className={index > 0 ? 'border-border border-t' : ''}>
      <TaskRow
        task={task}
        today={today}
        pointsOnComplete={Math.min(TASK_POINTS[task.size], remainingPoints)}
        onToggle={() => onToggle(task)}
        trailing={<TaskActions task={task} today={today} />}
      />
    </View>
  );

  return (
    <View className="gap-3">
      <View className="min-h-11 flex-row items-center gap-3">
        <Text className="font-heading text-heading-md text-ink">Tareas</Text>
        <Text className="font-body-bold text-caption text-ink-muted flex-1">
          {forToday.length > 0 && `${list.doneToday.length} de ${forToday.length}`}
        </Text>
        <Button label="Agregar" variant="link" onPress={() => router.push('/tasks/new')} />
      </View>

      {forToday.length > 0 ? (
        <Card className="py-1">{forToday.map(row)}</Card>
      ) : (
        <Text className="font-body text-body text-ink-muted">
          {list.upcoming.length > 0
            ? 'Nada pendiente para hoy.'
            : 'Anota lo que tengas que hacer: una llamada, un trámite, una entrega.'}
        </Text>
      )}
      <Text className="font-body-semibold text-caption text-ink-muted">
        {taskPointsText(taskPoints)}
      </Text>

      {list.upcoming.length > 0 && (
        <View className="gap-2">
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ expanded: isShowingUpcoming }}
            onPress={() => setIsShowingUpcoming((current) => !current)}
            className="min-h-11 flex-row items-center gap-1 self-start active:opacity-85"
          >
            <Text className="font-body-bold text-body text-ink-muted">
              Próximas · {list.upcoming.length}
            </Text>
            <View style={{ transform: [{ rotate: isShowingUpcoming ? '90deg' : '0deg' }] }}>
              <ChevronIcon size={18} direction="right" color={colors.inkMuted} />
            </View>
          </Pressable>
          {isShowingUpcoming && <Card className="py-1">{list.upcoming.map(row)}</Card>}
        </View>
      )}
    </View>
  );
}
