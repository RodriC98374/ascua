import {
  DAILY_TASK_POINTS_CAP,
  formatShortDate,
  TASK_POINTS,
  TASK_TITLE_MAX_LENGTH,
  type DateKey,
  type TaskRecord,
  type TaskSize,
} from '@ascua/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import type { TaskInput } from '@/operations/tasks';

import { dueDateOptions } from './task-text';
import { hasTaskErrors, validateTask, type TaskDraft } from './task-validation';

interface TaskFormProps {
  today: DateKey;
  /** Al editar: la tarea actual. */
  task?: TaskRecord;
  onSubmit: (input: TaskInput) => void;
}

const SIZE_OPTIONS: { size: TaskSize; label: string }[] = [
  { size: 'small', label: 'Pequeña' },
  { size: 'medium', label: 'Mediana' },
  { size: 'large', label: 'Grande' },
];

export function TaskForm({ today, task, onSubmit }: TaskFormProps) {
  const [draft, setDraft] = useState<TaskDraft>({
    title: task?.title ?? '',
    size: task?.size ?? 'medium',
    dueDateKey: task?.dueDateKey ?? today,
  });
  const [isTitleTouched, setIsTitleTouched] = useState(false);
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const errors = validateTask(draft, today, task?.dueDateKey);
  const titleError = hasTriedSubmit || isTitleTouched ? errors.title : undefined;

  // Una vencida que se edita puede conservar su fecha: aparece primero entre los días.
  const days = dueDateOptions(today);
  if (task && task.dueDateKey < today) {
    days.unshift({
      dateKey: task.dueDateKey,
      label: `Vencida (${formatShortDate(task.dueDateKey)})`,
    });
  }

  function handleSubmit() {
    setHasTriedSubmit(true);
    if (hasTaskErrors(errors)) return;
    onSubmit(draft);
  }

  return (
    <View className="gap-6">
      <TextField
        label="Qué tienes que hacer"
        value={draft.title}
        onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
        onBlur={() => setIsTitleTouched(true)}
        maxLength={TASK_TITLE_MAX_LENGTH}
        placeholder="Ej.: Pagar la luz"
        autoCapitalize="sentences"
        returnKeyType="done"
        error={titleError}
        hint={`${draft.title.trim().length}/${TASK_TITLE_MAX_LENGTH}`}
      />

      <View className="gap-2">
        <Text className="font-body-bold text-caption text-ink-muted">Tamaño</Text>
        <View accessibilityRole="radiogroup" className="flex-row gap-2">
          {SIZE_OPTIONS.map((option) => {
            const isSelected = option.size === draft.size;
            return (
              <Pressable
                key={option.size}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => setDraft((current) => ({ ...current, size: option.size }))}
                className={`min-h-14 flex-1 items-center justify-center rounded-md border-2 py-1 ${isSelected ? 'border-ember-strong bg-warning-soft' : 'border-border bg-surface-200 active:opacity-85'}`}
              >
                <Text
                  className={`font-body-extrabold text-button ${isSelected ? 'text-ember-strong' : 'text-ink-muted'}`}
                >
                  {option.label}
                </Text>
                <Text
                  className={`font-body-semibold text-caption ${isSelected ? 'text-ember-strong' : 'text-ink-muted'}`}
                >
                  {TASK_POINTS[option.size]} pts
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="font-body-semibold text-caption text-ink-muted">
          Pasan a tu saldo al cerrar el día, hasta {DAILY_TASK_POINTS_CAP} pts por día entre todas
          tus tareas. No cuentan para la racha.
        </Text>
      </View>

      <View className="gap-2">
        <Text className="font-body-bold text-caption text-ink-muted">Para cuándo</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {days.map((day) => {
            const isSelected = day.dateKey === draft.dueDateKey;
            return (
              <Pressable
                key={day.dateKey}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => setDraft((current) => ({ ...current, dueDateKey: day.dateKey }))}
                className={`min-h-11 justify-center rounded-full border-2 px-4 ${isSelected ? 'border-ink bg-surface-300' : 'border-border bg-surface-200 active:opacity-85'}`}
              >
                <Text
                  className={`font-body-extrabold text-button ${isSelected ? 'text-ink' : 'text-ink-muted'}`}
                >
                  {day.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        {hasTriedSubmit && errors.dueDateKey && (
          <Text accessibilityLiveRegion="polite" className="font-body-bold text-caption text-error">
            {errors.dueDateKey}
          </Text>
        )}
      </View>

      <View className="gap-2">
        {hasTriedSubmit && hasTaskErrors(errors) && (
          <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
            Revisa los campos marcados antes de guardar.
          </Text>
        )}
        <Button label="Guardar" onPress={handleSubmit} />
      </View>
    </View>
  );
}
