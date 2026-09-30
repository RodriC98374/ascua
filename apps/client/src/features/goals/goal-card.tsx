import {
  goalDeadline,
  goalTaskProgress,
  type DateKey,
  type Goal,
  type HabitRecord,
  type Task,
} from '@ascua/shared';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ChevronIcon, StarIcon } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useThemeColors } from '@/theme/colors';

import { deadlineText, taskProgressText } from './goal-text';

interface GoalCardProps {
  goal: Goal;
  tasks: readonly Task[];
  habits: readonly HabitRecord[];
  today: DateKey;
}

/** Una meta en la lista: avance de sus tareas, fecha límite y sus hábitos. Tocarla la abre. */
export function GoalCard({ goal, tasks, habits, today }: GoalCardProps) {
  const colors = useThemeColors();
  const progress = goalTaskProgress(goal, tasks);
  const deadline = goalDeadline(goal, today);
  const linkedHabits = habits.filter((habit) => goal.habitIds.includes(habit.id));
  const isAchieved = goal.status === 'achieved';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${goal.title}, ${taskProgressText(progress)}`}
      onPress={() => router.push({ pathname: '/metas/[goalId]', params: { goalId: goal.id } })}
      className="active:opacity-85"
    >
      <Card className="gap-3">
        <View className="flex-row items-start gap-2">
          <View className="flex-1 gap-0.5">
            <Text className="font-heading text-heading-sm text-ink">{goal.title}</Text>
            {deadline && (
              <Text
                className={`font-body-bold text-caption ${deadline.isOverdue ? 'text-warning' : 'text-ink-muted'}`}
              >
                {deadlineText(deadline)}
              </Text>
            )}
            {isAchieved && (
              <View className="flex-row items-center gap-1">
                <StarIcon size={14} color={colors.emberStrong} />
                <Text className="font-body-bold text-caption text-ember-strong">Lograda</Text>
              </View>
            )}
          </View>
          <ChevronIcon size={18} direction="right" color={colors.inkFaint} />
        </View>

        {!isAchieved && (
          <View className="gap-1.5">
            <ProgressBar value={Math.round((progress.rate ?? 0) * 100)} tone="success" />
            <Text className="font-body-semibold text-caption text-ink-muted">
              {taskProgressText(progress)}
            </Text>
          </View>
        )}

        {linkedHabits.length > 0 && (
          <View className="flex-row flex-wrap gap-1.5">
            {linkedHabits.map((habit) => (
              <View
                key={habit.id}
                className="bg-surface-100 flex-row items-center gap-1.5 rounded-full px-2 py-1"
              >
                <View className="h-2 w-2 rounded-full" style={{ backgroundColor: habit.color }} />
                <Text className="font-body-semibold text-caption text-ink-muted">{habit.name}</Text>
              </View>
            ))}
          </View>
        )}
      </Card>
    </Pressable>
  );
}
