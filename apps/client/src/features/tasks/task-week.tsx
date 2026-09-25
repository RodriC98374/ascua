// Las tareas de la semana en Mes: un donut por día con la parte cumplida y, debajo, las tareas del
// día elegido. Cada tarea cuenta en un solo día (`taskDays`).
import {
  dateKeyRange,
  formatLongDate,
  formatWeekdayInitial,
  strongHabitColor,
  TASK_COLOR,
  taskDays,
  type DateKey,
  type Period,
  type TaskDay,
  type TaskRecord,
} from '@ascua/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';

import { Card } from '@/components/ui/card';
import { CheckIcon } from '@/components/ui/icons';
import { useThemeColors } from '@/theme/colors';

import { taskDayText } from './task-text';

const DONUT_SIZE = 40;
const DONUT_STROKE = 7;

export function TaskWeek({
  tasks,
  period,
  today,
}: {
  tasks: readonly TaskRecord[];
  period: Period;
  today: DateKey;
}) {
  const days = taskDays(tasks, dateKeyRange(period.startDateKey, period.endDateKey));
  const hasTasks = days.some((day) => day.completionRate !== null);
  const isCurrent = period.startDateKey <= today && today <= period.endDateKey;
  // Empieza en hoy si la semana es la actual; si no, en el primer día con tareas.
  const [selectedDateKey, setSelectedDateKey] = useState<DateKey | null>(() =>
    isCurrent ? today : (days.find((day) => day.completionRate !== null)?.dateKey ?? null),
  );
  const selectedDay = days.find((day) => day.dateKey === selectedDateKey);

  return (
    <Card className="gap-4">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Tareas</Text>
        <Text className="font-body text-caption text-ink-muted">
          {hasTasks
            ? 'Cuántas cumpliste cada día. Toca un día para ver sus tareas.'
            : isCurrent
              ? 'Cuando anotes tareas en Hoy, aquí verás cuántas cumples cada día.'
              : 'No tuviste tareas esta semana.'}
        </Text>
      </View>
      {hasTasks && (
        <>
          <View className="flex-row">
            {days.map((day) => (
              <DayDonut
                key={day.dateKey}
                day={day}
                today={today}
                isSelected={day.dateKey === selectedDateKey}
                onPress={() => setSelectedDateKey(day.dateKey)}
              />
            ))}
          </View>
          {selectedDay && <DayTasks day={selectedDay} today={today} />}
        </>
      )}
    </Card>
  );
}

function DayDonut({
  day,
  today,
  isSelected,
  onPress,
}: {
  day: TaskDay<TaskRecord>;
  today: DateKey;
  isSelected: boolean;
  onPress: () => void;
}) {
  const colors = useThemeColors();
  const total = day.done.length + day.pending.length;
  const isToday = day.dateKey === today;
  const radius = (DONUT_SIZE - DONUT_STROKE) / 2;
  const circumference = 2 * Math.PI * radius;
  const doneLength = circumference * (day.completionRate ?? 0);
  const center = DONUT_SIZE / 2;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected }}
      accessibilityLabel={`${formatLongDate(day.dateKey)}: ${taskDayText(day, today)}`}
      onPress={onPress}
      className={`flex-1 items-center gap-1 rounded-md py-1.5 ${isSelected ? 'bg-warning-soft' : 'active:bg-surface-300'}`}
    >
      <View style={{ width: DONUT_SIZE, height: DONUT_SIZE }}>
        {/* Girado para que el arco empiece arriba; `origin` del SVG falla en web. */}
        <Svg width={DONUT_SIZE} height={DONUT_SIZE} style={{ transform: [{ rotate: '-90deg' }] }}>
          <Circle
            cx={center}
            cy={center}
            r={radius}
            stroke={colors.border}
            strokeWidth={DONUT_STROKE}
            fill="none"
          />
          {doneLength > 0 && (
            <Circle
              cx={center}
              cy={center}
              r={radius}
              stroke={TASK_COLOR}
              strokeWidth={DONUT_STROKE}
              strokeDasharray={`${doneLength} ${circumference}`}
              fill="none"
            />
          )}
        </Svg>
        <View className="absolute inset-0 items-center justify-center">
          {total > 0 && (
            <Text className="font-body-bold text-label text-ink">
              {day.done.length}/{total}
            </Text>
          )}
        </View>
      </View>
      <Text
        className={`text-label ${isToday ? 'font-body-bold text-ember-strong' : 'font-body text-ink-muted'}`}
      >
        {formatWeekdayInitial(day.dateKey)}
      </Text>
    </Pressable>
  );
}

function DayTasks({ day, today }: { day: TaskDay<TaskRecord>; today: DateKey }) {
  const tasks = [...day.done, ...day.pending];
  return (
    <View className="border-border gap-2 border-t pt-3">
      <View className="gap-0.5">
        <Text className="font-body-bold text-body text-ink">{formatLongDate(day.dateKey)}</Text>
        <Text className="font-body text-caption text-ink-muted">{taskDayText(day, today)}</Text>
      </View>
      {tasks.map((task) => {
        const isDone = task.completedDateKey !== null;
        return (
          <View key={task.id} className="flex-row items-center gap-2">
            <View className="h-4 w-4 items-center justify-center">
              {isDone ? (
                <CheckIcon size={16} color={strongHabitColor(TASK_COLOR)} />
              ) : (
                <View className="border-border h-2.5 w-2.5 rounded-full border-[1.5px]" />
              )}
            </View>
            <Text
              className={`font-body text-body flex-1 ${isDone ? 'text-ink' : 'text-ink-muted'}`}
            >
              {task.title}
            </Text>
          </View>
        );
      })}
    </View>
  );
}
