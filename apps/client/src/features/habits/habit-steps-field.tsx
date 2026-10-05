import {
  HABIT_STEP_TITLE_MAX_LENGTH,
  HABIT_STEPS_MAX,
  HABIT_STEPS_MIN,
  type HabitStep,
} from '@ascua/shared';
import { Pressable, Text, TextInput, View } from 'react-native';

import { FieldError, FieldLabel, Hint } from '@/components/ui/form-parts';
import { CloseIcon, PlusIcon } from '@/components/ui/icons';
import { Toggle } from '@/components/ui/toggle';
import { useThemeColors } from '@/theme/colors';

interface HabitStepsFieldProps {
  hasSteps: boolean;
  steps: readonly HabitStep[];
  error?: string | undefined;
  onToggle: (hasSteps: boolean) => void;
  onChange: (steps: HabitStep[]) => void;
}

/** Id corto de un paso: no cambia aunque se edite su texto, así las marcas del día lo siguen. */
function newStepId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptySteps(count: number): HabitStep[] {
  return Array.from({ length: count }, () => ({ id: newStepId(), title: '' }));
}

/**
 * "Con pasos" del formulario de hábito (fase 21, D27): opcional. Al activarlo avisa que el hábito
 * solo se cumple con todos los pasos marcados, y deja escribir, agregar y quitar pasos.
 */
export function HabitStepsField({
  hasSteps,
  steps,
  error,
  onToggle,
  onChange,
}: HabitStepsFieldProps) {
  const colors = useThemeColors();

  function toggle(value: boolean) {
    onToggle(value);
    // Al activar por primera vez, las filas mínimas ya listas para escribir.
    if (value && steps.length === 0) onChange(emptySteps(HABIT_STEPS_MIN));
  }

  return (
    <View className="gap-3">
      <View className="min-h-11 flex-row items-center gap-3">
        <View className="flex-1 gap-0.5">
          <FieldLabel>Con pasos</FieldLabel>
          <Hint>Para una rutina con varias cosas: cada paso tiene su casilla.</Hint>
        </View>
        <Toggle accessibilityLabel="Con pasos" value={hasSteps} onChange={toggle} />
      </View>

      {hasSteps && (
        <View className="gap-2">
          <View className="bg-warning-soft rounded-md px-3 py-2.5">
            <Text className="font-body-bold text-caption text-ink">
              El hábito solo cuenta como cumplido cuando marcas todos sus pasos.
            </Text>
          </View>

          {steps.map((step, index) => (
            <View key={step.id} className="flex-row items-center gap-2">
              <Text className="font-body-bold text-body text-ink-muted w-5 text-center">
                {index + 1}
              </Text>
              <TextInput
                accessibilityLabel={`Paso ${index + 1}`}
                value={step.title}
                onChangeText={(title) =>
                  onChange(steps.map((item) => (item.id === step.id ? { ...item, title } : item)))
                }
                maxLength={HABIT_STEP_TITLE_MAX_LENGTH}
                placeholder={index === 0 ? 'Ej.: Lavarme los dientes' : 'Otro paso'}
                placeholderTextColor={colors.inkFaint}
                autoCapitalize="sentences"
                className="bg-surface-200 border-border font-body text-body text-ink min-h-12 flex-1 rounded-sm border-2 px-4"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Quitar el paso ${index + 1}`}
                onPress={() => onChange(steps.filter((item) => item.id !== step.id))}
                className="h-11 w-11 items-center justify-center rounded-full active:opacity-85"
              >
                <CloseIcon size={18} color={colors.inkMuted} />
              </Pressable>
            </View>
          ))}

          {steps.length < HABIT_STEPS_MAX ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => onChange([...steps, ...emptySteps(1)])}
              className="min-h-11 flex-row items-center gap-2 self-start px-1 active:opacity-85"
            >
              <PlusIcon size={18} color={colors.emberStrong} />
              <Text className="font-body-bold text-body text-ember-strong">Agregar paso</Text>
            </Pressable>
          ) : (
            <Hint>{`Hasta ${HABIT_STEPS_MAX} pasos por hábito.`}</Hint>
          )}
          {error && <FieldError>{error}</FieldError>}
        </View>
      )}
    </View>
  );
}
