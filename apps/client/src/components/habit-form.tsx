import {
  canBePrimary,
  HABIT_DESCRIPTION_MAX_LENGTH,
  HABIT_NAME_MAX_LENGTH,
  MAX_PRIMARY_HABITS,
  type HabitRecord,
  type HabitTier,
} from '@ascua/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { hasErrors, validateHabit, type HabitDraft } from '@/features/habits/habit-validation';
import type { HabitInput } from '@/operations/habits';

interface HabitFormProps {
  /** Todos los hábitos, para validar el máximo de principales y los nombres repetidos. */
  habits: readonly HabitRecord[];
  /** Al editar: el hábito actual. */
  habit?: HabitRecord;
  onSubmit: (input: HabitInput) => void;
}

const TIER_OPTIONS: { tier: HabitTier; label: string; help: string }[] = [
  { tier: 'primary', label: 'Principal', help: 'Cuenta para la racha y da 10 puntos.' },
  { tier: 'secondary', label: 'Secundario', help: 'Suma al día perfecto y da 5 puntos.' },
];

export function HabitForm({ habits, habit, onSubmit }: HabitFormProps) {
  const isPrimaryAllowed = canBePrimary(habits, habit?.id);
  const [draft, setDraft] = useState<HabitDraft>({
    name: habit?.name ?? '',
    description: habit?.description ?? '',
    tier: habit?.tier ?? (isPrimaryAllowed ? 'primary' : 'secondary'),
  });
  // Los errores de un campo se muestran después de salir de él o de intentar guardar.
  const [touched, setTouched] = useState<Partial<Record<keyof HabitDraft, boolean>>>({});
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const errors = validateHabit(draft, { habits, habitId: habit?.id });
  const visibleError = (field: keyof HabitDraft) =>
    hasTriedSubmit || touched[field] ? errors[field] : undefined;

  function update<Field extends keyof HabitDraft>(field: Field, value: HabitDraft[Field]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  function handleSubmit() {
    setHasTriedSubmit(true);
    if (hasErrors(errors)) return;
    onSubmit(draft);
  }

  const selectedHelp = TIER_OPTIONS.find((option) => option.tier === draft.tier)?.help;
  const tierError = visibleError('tier');

  return (
    <View className="gap-6">
      <View className="gap-4">
        <TextField
          label="Nombre"
          value={draft.name}
          onChangeText={(value) => update('name', value)}
          onBlur={() => setTouched((current) => ({ ...current, name: true }))}
          maxLength={HABIT_NAME_MAX_LENGTH}
          placeholder="Ej.: Leer 20 minutos"
          autoCapitalize="sentences"
          returnKeyType="next"
          error={visibleError('name')}
          hint={`${draft.name.trim().length}/${HABIT_NAME_MAX_LENGTH}`}
        />
        <TextField
          label="Descripción (opcional)"
          value={draft.description}
          onChangeText={(value) => update('description', value)}
          onBlur={() => setTouched((current) => ({ ...current, description: true }))}
          maxLength={HABIT_DESCRIPTION_MAX_LENGTH}
          multiline
          autoCapitalize="sentences"
          error={visibleError('description')}
          hint={`${draft.description.trim().length}/${HABIT_DESCRIPTION_MAX_LENGTH}`}
        />
      </View>

      <View className="gap-2">
        <Text className="font-body-bold text-caption text-ink-muted">Tipo</Text>
        <View accessibilityRole="radiogroup" className="flex-row gap-2">
          {TIER_OPTIONS.map((option) => {
            const isSelected = option.tier === draft.tier;
            const isDisabled = option.tier === 'primary' && !isPrimaryAllowed;
            return (
              <Pressable
                key={option.tier}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isDisabled }}
                disabled={isDisabled}
                onPress={() => update('tier', option.tier)}
                className={`min-h-12 flex-1 items-center justify-center rounded-md border-2 ${isSelected ? 'border-ember-strong bg-warning-soft' : 'border-border bg-surface-200'} ${isDisabled ? 'opacity-40' : 'active:opacity-85'}`}
              >
                <Text
                  className={`font-body-extrabold text-button ${isSelected ? 'text-ember-strong' : 'text-ink-muted'}`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text className="font-body-semibold text-caption text-ink-muted">{selectedHelp}</Text>
        {tierError ? (
          <Text accessibilityLiveRegion="polite" className="font-body-bold text-caption text-error">
            {tierError}
          </Text>
        ) : (
          !isPrimaryAllowed && (
            <Text className="font-body-semibold text-caption text-warning">
              Ya tienes {MAX_PRIMARY_HABITS} hábitos principales. Cambia uno a secundario para
              elegir este.
            </Text>
          )
        )}
      </View>

      <View className="gap-2">
        {hasTriedSubmit && hasErrors(errors) && (
          <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
            Revisa los campos marcados antes de guardar.
          </Text>
        )}
        <Button label="Guardar" onPress={handleSubmit} />
      </View>
    </View>
  );
}
