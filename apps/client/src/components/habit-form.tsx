import { canBePrimary, MAX_PRIMARY_HABITS, type HabitRecord, type HabitTier } from '@ascua/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import {
  HABIT_DESCRIPTION_MAX_LENGTH,
  HABIT_NAME_MAX_LENGTH,
  type HabitInput,
} from '@/operations/habits';

interface HabitFormProps {
  /** Todos los hábitos, para validar el máximo de principales. */
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
  const [name, setName] = useState(habit?.name ?? '');
  const [description, setDescription] = useState(habit?.description ?? '');
  const [tier, setTier] = useState<HabitTier>(
    habit?.tier ?? (isPrimaryAllowed ? 'primary' : 'secondary'),
  );

  const selectedHelp = TIER_OPTIONS.find((option) => option.tier === tier)?.help;

  return (
    <View className="gap-6">
      <View className="gap-4">
        <TextField
          label="Nombre"
          value={name}
          onChangeText={setName}
          maxLength={HABIT_NAME_MAX_LENGTH}
          placeholder="Ej.: Leer 20 minutos"
          autoCapitalize="sentences"
          returnKeyType="next"
        />
        <TextField
          label="Descripción (opcional)"
          value={description}
          onChangeText={setDescription}
          maxLength={HABIT_DESCRIPTION_MAX_LENGTH}
          multiline
          autoCapitalize="sentences"
        />
      </View>

      <View className="gap-2">
        <Text className="font-body-bold text-caption text-ink-muted">Tipo</Text>
        <View accessibilityRole="radiogroup" className="flex-row gap-2">
          {TIER_OPTIONS.map((option) => {
            const isSelected = option.tier === tier;
            const isDisabled = option.tier === 'primary' && !isPrimaryAllowed;
            return (
              <Pressable
                key={option.tier}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected, disabled: isDisabled }}
                disabled={isDisabled}
                onPress={() => setTier(option.tier)}
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
        {!isPrimaryAllowed && (
          <Text className="font-body-semibold text-caption text-warning">
            Ya tienes {MAX_PRIMARY_HABITS} hábitos principales. Cambia uno a secundario para elegir
            este.
          </Text>
        )}
      </View>

      <Button
        label="Guardar"
        isDisabled={name.trim() === ''}
        onPress={() => onSubmit({ name, description, tier })}
      />
    </View>
  );
}
