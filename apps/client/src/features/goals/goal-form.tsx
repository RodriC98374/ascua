import {
  GOAL_DESCRIPTION_MAX_LENGTH,
  GOAL_TITLE_MAX_LENGTH,
  MAX_GOAL_HABITS,
  todayDateKey,
  type Goal,
  type HabitRecord,
} from '@ascua/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { choiceContainer, choiceLabel } from '@/components/ui/choice-styles';
import { DateField } from '@/components/ui/date-field';
import { FieldError, FormSection, Hint } from '@/components/ui/form-parts';
import { TextField } from '@/components/ui/text-field';
import type { GoalInput } from '@/operations/goals';

import { hasGoalErrors, validateGoal, type GoalDraft } from './goal-validation';

interface GoalFormProps {
  /** Hábitos para vincular: los activos, y los archivados que la meta ya tenía. */
  habits: readonly HabitRecord[];
  /** Al editar: la meta actual. */
  goal?: Goal;
  onSubmit: (input: GoalInput) => void;
}

export function GoalForm({ habits, goal, onSubmit }: GoalFormProps) {
  const startDateKey = goal?.startDateKey ?? todayDateKey();
  const [draft, setDraft] = useState<GoalDraft>({
    title: goal?.title ?? '',
    description: goal?.description ?? '',
    targetDateKey: goal?.targetDateKey ?? null,
    habitIds: goal?.habitIds ?? [],
  });
  const [touched, setTouched] = useState<Partial<Record<keyof GoalDraft, boolean>>>({});
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const errors = validateGoal(draft, startDateKey);
  const visibleError = (field: keyof GoalDraft) =>
    hasTriedSubmit || touched[field] ? errors[field] : undefined;
  const linkable = habits.filter(
    (habit) => habit.status === 'active' || draft.habitIds.includes(habit.id),
  );
  const isHabitLimitReached = draft.habitIds.length >= MAX_GOAL_HABITS;

  function toggleHabit(habitId: string) {
    setDraft((current) => ({
      ...current,
      habitIds: current.habitIds.includes(habitId)
        ? current.habitIds.filter((id) => id !== habitId)
        : [...current.habitIds, habitId],
    }));
  }

  function handleSubmit() {
    setHasTriedSubmit(true);
    if (hasGoalErrors(errors)) return;
    onSubmit({
      title: draft.title,
      description: draft.description,
      targetDateKey: draft.targetDateKey,
      habitIds: draft.habitIds,
    });
  }

  return (
    <View className="gap-6">
      <FormSection title="Tu meta">
        <TextField
          label="Qué quieres lograr"
          value={draft.title}
          onChangeText={(title) => setDraft((current) => ({ ...current, title }))}
          onBlur={() => setTouched((current) => ({ ...current, title: true }))}
          maxLength={GOAL_TITLE_MAX_LENGTH}
          placeholder="Ej.: Aprobar Cálculo II"
          autoCapitalize="sentences"
          error={visibleError('title')}
          hint={`${draft.title.trim().length}/${GOAL_TITLE_MAX_LENGTH}`}
        />
        <TextField
          label="Por qué te importa (opcional)"
          value={draft.description}
          onChangeText={(description) => setDraft((current) => ({ ...current, description }))}
          onBlur={() => setTouched((current) => ({ ...current, description: true }))}
          maxLength={GOAL_DESCRIPTION_MAX_LENGTH}
          multiline
          autoCapitalize="sentences"
          error={visibleError('description')}
          hint={`${draft.description.trim().length}/${GOAL_DESCRIPTION_MAX_LENGTH}`}
        />
        <View className="border-border -my-2 border-t">
          <DateField
            label="Fecha límite"
            hint="Opcional. Te dice cuánto falta."
            value={draft.targetDateKey}
            minDateKey={todayDateKey() > startDateKey ? todayDateKey() : startDateKey}
            onChange={(targetDateKey) => setDraft((current) => ({ ...current, targetDateKey }))}
          />
        </View>
        {visibleError('targetDateKey') && <FieldError>{visibleError('targetDateKey')}</FieldError>}
      </FormSection>

      <FormSection title="Hábitos que te acercan">
        <Hint>
          Elige los que ayudan a esta meta: verás qué tan constante eres con ellos desde que la
          empezaste. Las tareas se agregan después, desde la meta.
        </Hint>
        {linkable.length === 0 ? (
          <Text className="font-body text-body text-ink-muted">
            Todavía no tienes hábitos. Puedes crear la meta igual y vincularlos después.
          </Text>
        ) : (
          <View className="flex-row flex-wrap gap-2">
            {linkable.map((habit) => {
              const isSelected = draft.habitIds.includes(habit.id);
              const isDisabled = !isSelected && isHabitLimitReached;
              return (
                <Pressable
                  key={habit.id}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected, disabled: isDisabled }}
                  disabled={isDisabled}
                  onPress={() => toggleHabit(habit.id)}
                  className={`min-h-11 flex-row items-center gap-2 rounded-full border-2 px-3 ${choiceContainer(isSelected)} ${isDisabled ? 'opacity-40' : ''}`}
                >
                  <View className="h-3 w-3 rounded-full" style={{ backgroundColor: habit.color }} />
                  <Text className={`font-body-extrabold text-button ${choiceLabel(isSelected)}`}>
                    {habit.name}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
        <Hint>
          Elegidos: {draft.habitIds.length} de {MAX_GOAL_HABITS}
        </Hint>
        {visibleError('habitIds') && <FieldError>{visibleError('habitIds')}</FieldError>}
      </FormSection>

      <View className="gap-2">
        {hasTriedSubmit && hasGoalErrors(errors) && (
          <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
            Revisa los campos marcados antes de guardar.
          </Text>
        )}
        <Button label="Guardar" onPress={handleSubmit} />
      </View>
    </View>
  );
}
