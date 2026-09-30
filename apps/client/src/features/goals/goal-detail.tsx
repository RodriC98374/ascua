import {
  dayTaskPoints,
  DAILY_TASK_POINTS_CAP,
  formatShortDate,
  goalDeadline,
  goalHabitProgress,
  goalHabitRange,
  goalTaskProgress,
  isTaskLocked,
  MAX_GOAL_TASKS,
  TASK_POINTS,
  type DateKey,
  type Goal,
  type HabitPeriodStats,
  type HabitRecord,
  type TaskRecord,
} from '@ascua/shared';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { formatDateWithYear } from '@/components/ui/date-field';
import { CheckIcon, CloseIcon, StarIcon } from '@/components/ui/icons';
import { PopoverMenu } from '@/components/ui/popover-menu';
import { ProgressBar } from '@/components/ui/progress-bar';
import { SectionHeader } from '@/components/ui/section-header';
import { Sparks } from '@/components/ui/sparks';
import { useDailyLogsInRange, useTasksByIds, useTodayTasks } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { celebrationFeedback } from '@/features/celebration/haptics';
import { playSound } from '@/features/sounds/sounds';
import { trackWrite } from '@/features/sync/write-errors';
import { TaskRow } from '@/features/tasks/task-row';
import { db } from '@/lib/firebase';
import { setGoalStatus, unlinkGoalTask } from '@/operations/goals';
import { setTaskCompletion } from '@/operations/tasks';
import { useThemeColors } from '@/theme/colors';

import { deadlineText, taskProgressText } from './goal-text';

interface GoalDetailProps {
  goal: Goal;
  habits: readonly HabitRecord[];
  today: DateKey;
}

/** Pendientes primero (por fecha), después las cumplidas (la más reciente arriba). */
function sortTasks(tasks: readonly TaskRecord[]): TaskRecord[] {
  const pending = tasks
    .filter((task) => task.completedDateKey === null)
    .sort((a, b) => a.dueDateKey.localeCompare(b.dueDateKey));
  const done = tasks
    .filter((task) => task.completedDateKey !== null)
    .sort((a, b) => (b.completedDateKey ?? '').localeCompare(a.completedDateKey ?? ''));
  return [...pending, ...done];
}

export function GoalDetail({ goal, habits, today }: GoalDetailProps) {
  const colors = useThemeColors();
  const uid = useUid();
  const tasks = useTasksByIds(uid, goal.taskIds);
  const todayTasks = useTodayTasks(uid, today);
  const range = goalHabitRange(goal, today);
  const logs = useDailyLogsInRange(uid, range.startDateKey, range.endDateKey);
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);
  const [burst, setBurst] = useState(0);

  const progress = goalTaskProgress(goal, tasks.data);
  const deadline = goalDeadline(goal, today);
  const habitRows = goalHabitProgress({ goal, habits, logs: logs.data, today });
  const remainingTaskPoints = Math.max(
    0,
    DAILY_TASK_POINTS_CAP - dayTaskPoints(todayTasks.data, today).points,
  );
  const isActive = goal.status === 'active';
  const canAddTask = isActive && goal.taskIds.length < MAX_GOAL_TASKS;

  function achieve() {
    celebrationFeedback();
    playSound('chime');
    setBurst((count) => count + 1);
    trackWrite(setGoalStatus(db, uid, goal.id, 'achieved', today));
  }

  return (
    <View className="gap-6">
      <View className="gap-2">
        <Text className="font-heading-extrabold text-display-md text-ink">{goal.title}</Text>
        {goal.description && (
          <Text className="font-body text-body text-ink-muted">{goal.description}</Text>
        )}
        <Text className="font-body-semibold text-caption text-ink-muted">
          Desde el {formatShortDate(goal.startDateKey)}
          {goal.targetDateKey ? ` · Límite: ${formatDateWithYear(goal.targetDateKey)}` : ''}
        </Text>
      </View>

      {goal.status === 'achieved' ? (
        <View>
          <LinearGradient
            colors={colors.emberGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 18,
              padding: 16,
              flexDirection: 'row',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <View>
              <StarIcon size={28} color={colors.inkOnFill} />
              <Sparks burst={burst} radius={40} count={10} />
            </View>
            <View className="flex-1">
              <Text className="font-heading text-heading-md text-ink-on-fill">¡Meta lograda!</Text>
              <Text className="font-body-semibold text-caption text-ink-on-fill">
                La lograste el {goal.achievedDateKey && formatShortDate(goal.achievedDateKey)}. Te
                lo ganaste.
              </Text>
            </View>
          </LinearGradient>
        </View>
      ) : (
        <Card className="gap-3">
          <View className="flex-row items-baseline justify-between">
            <Text className="font-body-bold text-body text-ink">Avance</Text>
            {deadline && (
              <Text
                className={`font-body-bold text-caption ${deadline.isOverdue ? 'text-warning' : 'text-ink-muted'}`}
              >
                {deadlineText(deadline)}
              </Text>
            )}
          </View>
          <Text className="font-heading-extrabold text-display-md text-ink">
            {progress.rate === null ? '—' : `${Math.round(progress.rate * 100)}%`}
          </Text>
          <ProgressBar value={Math.round((progress.rate ?? 0) * 100)} tone="success" />
          <Text className="font-body-semibold text-caption text-ink-muted">
            {taskProgressText(progress)}
            {goal.status === 'archived' ? ' · Archivada' : ''}
          </Text>
        </Card>
      )}

      <View className="gap-2">
        <SectionHeader
          title="Tareas"
          progress={{ done: progress.done, total: progress.total }}
          action={
            canAddTask ? (
              <Button
                label="Agregar"
                variant="link"
                onPress={() =>
                  router.push({ pathname: '/metas/[goalId]/task', params: { goalId: goal.id } })
                }
              />
            ) : undefined
          }
        />
        {tasks.data.length === 0 ? (
          <Text className="font-body text-body text-ink-muted">
            {isActive
              ? 'Divide la meta en pasos chicos: cada tarea aparece en Hoy el día que toca y suma sus puntos.'
              : 'Esta meta no tiene tareas.'}
          </Text>
        ) : (
          <Card className="py-1">
            {sortTasks(tasks.data).map((task, index) => (
              <View key={task.id} className={index > 0 ? 'border-border border-t' : ''}>
                {isTaskLocked(task, today) ? (
                  <LockedTaskRow task={task} />
                ) : (
                  <TaskRow
                    task={task}
                    today={today}
                    pointsOnComplete={Math.min(TASK_POINTS[task.size], remainingTaskPoints)}
                    onToggle={() =>
                      trackWrite(
                        setTaskCompletion(db, uid, task.id, task.completedDateKey !== today, today),
                      )
                    }
                    trailing={
                      <PopoverMenu
                        label={`Opciones de ${task.title}`}
                        items={[
                          {
                            label: 'Quitar de la meta',
                            Icon: CloseIcon,
                            onPress: () => trackWrite(unlinkGoalTask(db, uid, goal.id, task.id)),
                          },
                        ]}
                      />
                    }
                  />
                )}
              </View>
            ))}
          </Card>
        )}
      </View>

      {habitRows.length > 0 && (
        <View className="gap-2">
          <SectionHeader title="Hábitos" />
          <Card className="gap-4">
            {habitRows.map((row) => (
              <View key={row.habit.id} className="gap-1.5">
                <View className="flex-row items-center gap-2">
                  <View
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: row.habit.color }}
                  />
                  <Text className="font-body-bold text-body text-ink flex-1">{row.habit.name}</Text>
                  <Text className="font-body-extrabold text-body text-ink">
                    {row.completionRate === null ? '—' : `${Math.round(row.completionRate * 100)}%`}
                  </Text>
                </View>
                <ProgressBar
                  value={Math.round((row.completionRate ?? 0) * 100)}
                  color={row.habit.color}
                />
                <Text className="font-body-semibold text-caption text-ink-muted">
                  {row.scheduledDays === 0
                    ? 'Todavía sin días cerrados desde que empezó la meta'
                    : habitCountText(row)}
                </Text>
              </View>
            ))}
          </Card>
        </View>
      )}

      <View className="gap-2">
        {isActive && <Button label="¡La logré!" onPress={achieve} />}
        {goal.status !== 'active' && (
          <Button
            label={goal.status === 'achieved' ? 'Reabrir la meta' : 'Reactivar la meta'}
            variant="secondary"
            onPress={() => trackWrite(setGoalStatus(db, uid, goal.id, 'active', today))}
          />
        )}
        {goal.status !== 'archived' && (
          <View className="flex-row justify-center gap-2">
            <Button
              label="Editar"
              variant="link"
              onPress={() =>
                router.push({ pathname: '/metas/[goalId]/edit', params: { goalId: goal.id } })
              }
            />
            <Button label="Archivar" variant="link" onPress={() => setIsConfirmingArchive(true)} />
          </View>
        )}
      </View>

      <ConfirmDialog
        isVisible={isConfirmingArchive}
        title={`¿Archivar “${goal.title}”?`}
        message="Sale de tus metas activas. Sus tareas y hábitos siguen igual, y puedes reactivarla cuando quieras."
        confirmLabel="Archivar"
        onConfirm={() => {
          setIsConfirmingArchive(false);
          trackWrite(setGoalStatus(db, uid, goal.id, 'archived', today));
        }}
        onCancel={() => setIsConfirmingArchive(false)}
      />
    </View>
  );
}

/**
 * "20 de 20 días" o, en un semanal, "15 de 15 marcas": las marcas de más en una semana no suman
 * constancia (el % ya tiene tope), así que la cifra tampoco pasa de lo pedido.
 */
function habitCountText(row: HabitPeriodStats<HabitRecord>): string {
  const isWeekly = row.habit.schedule.type === 'times_per_week';
  const done = isWeekly ? Math.min(row.completedDays, row.scheduledDays) : row.completedDays;
  return `${done} de ${row.scheduledDays} ${isWeekly ? 'marcas' : 'días'} desde que empezó la meta`;
}

/** Tarea cumplida en un día pasado: ya es parte de ese día y no se toca. */
function LockedTaskRow({ task }: { task: TaskRecord }) {
  const colors = useThemeColors();
  return (
    <View className="min-h-14 flex-row items-center gap-3 py-2">
      <View className="bg-success-soft h-7 w-7 items-center justify-center rounded-full">
        <CheckIcon size={14} color={colors.success} />
      </View>
      <View className="flex-1">
        <Text className="font-body text-body text-ink-muted">{task.title}</Text>
        <Text className="font-body-semibold text-caption text-ink-muted">
          Cumplida el {task.completedDateKey && formatShortDate(task.completedDateKey)}
        </Text>
      </View>
    </View>
  );
}
