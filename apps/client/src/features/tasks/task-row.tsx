import { TASK_COLOR, TASK_POINTS, type DateKey, type TaskRecord } from '@ascua/shared';
import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Checkbox, FloatingPoints, useCheckToggle } from '@/features/today/check-parts';
import { SECONDARY_ROW_RADIUS } from '@/features/today/habit-check';
import { SwipeToCheckRow } from '@/features/today/swipe-to-check-row';

import { taskDueLabel } from './task-text';

interface TaskRowProps {
  task: TaskRecord;
  today: DateKey;
  /**
   * Lo que suma al marcarla ahora: sus puntos, o menos si el día está cerca del tope. El "+N" que
   * sube solo aparece si suma algo.
   */
  pointsOnComplete: number;
  onToggle: () => void;
  trailing?: ReactNode;
}

/**
 * Fila de una tarea: se marca tocándola o deslizándola, como un hábito. Debajo del título, para
 * cuándo es (o cuánto lleva vencida) y cuánto vale.
 */
export function TaskRow({ task, today, pointsOnComplete, onToggle, trailing }: TaskRowProps) {
  const isDone = task.completedDateKey === today;
  const check = useCheckToggle(isDone, onToggle);
  const dueLabel = taskDueLabel(task, today);
  const isOverdue = task.completedDateKey === null && task.dueDateKey < today;
  const detail = [dueLabel, `${TASK_POINTS[task.size]} pts`].filter(Boolean).join(' · ');

  return (
    <SwipeToCheckRow
      isDone={isDone}
      color={TASK_COLOR}
      isDisabled={false}
      borderRadius={SECONDARY_ROW_RADIUS}
      onSwipeStart={check.onSwipeStart}
      onCommit={check.toggle}
    >
      <View className="bg-surface-200 min-h-12 flex-row items-center gap-1">
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isDone }}
          accessibilityLabel={`${task.title}, tarea, ${detail}`}
          onPressIn={check.onPressIn}
          onPress={check.onPress}
          className="min-h-11 flex-1 flex-row items-center gap-3 py-2 active:opacity-85"
        >
          <View>
            <Checkbox isDone={isDone} size={24} color={TASK_COLOR} />
            {pointsOnComplete > 0 && (
              <FloatingPoints burst={check.pointsBurst} amount={pointsOnComplete} />
            )}
          </View>
          <View className="flex-1">
            <Text className={`font-body text-body ${isDone ? 'text-ink-muted' : 'text-ink'}`}>
              {task.title}
            </Text>
            <Text
              className={`font-body-semibold text-caption ${isOverdue ? 'text-warning' : 'text-ink-muted'}`}
            >
              {detail}
            </Text>
          </View>
        </Pressable>
        {trailing ?? <View className="w-11" />}
      </View>
    </SwipeToCheckRow>
  );
}
