import {
  canBePrimary,
  categoryOf,
  habitIconOf,
  HABIT_CATEGORIES,
  HABIT_COLORS,
  HABIT_DESCRIPTION_MAX_LENGTH,
  HABIT_NAME_MAX_LENGTH,
  MAX_PRIMARY_HABITS,
  reminderDaysFor,
  strongHabitColor,
  TARGET_UNIT_MAX_LENGTH,
  TIMES_PER_WEEK_MAX,
  TIMES_PER_WEEK_MIN,
  type HabitCategory,
  type HabitRecord,
  type HabitScheduleType,
  type HabitTier,
} from '@ascua/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { ScreenFooter } from '@/components/ui/screen';
import { choiceContainer, choiceLabel } from '@/components/ui/choice-styles';
import { FieldError, FieldLabel, FormSection, Hint } from '@/components/ui/form-parts';
import { CheckIcon } from '@/components/ui/icons';
import { TextField } from '@/components/ui/text-field';
import { TimeField } from '@/components/ui/time-field';
import { Toggle } from '@/components/ui/toggle';
import { HabitIcon } from '@/features/habits/habit-icon';
import { HabitIconPicker } from '@/features/habits/habit-icon-picker';
import { scheduleText, WEEKDAY_OPTIONS } from '@/features/habits/habit-text';
import {
  draftReminder,
  hasErrors,
  validateHabit,
  type HabitDraft,
} from '@/features/habits/habit-validation';
import { Checkbox } from '@/features/today/check-parts';
import type { NewHabitInput } from '@/operations/habits';

interface HabitFormProps {
  /** Todos los hábitos, para validar el máximo de principales y los nombres repetidos. */
  habits: readonly HabitRecord[];
  /** Al editar: el hábito actual. Frecuencia y meta quedan fijas y no se muestran para cambiarlas. */
  habit?: HabitRecord;
  onSubmit: (input: NewHabitInput) => void;
}

const TIER_OPTIONS: { tier: HabitTier; label: string; help: string }[] = [
  { tier: 'primary', label: 'Principal', help: 'Cuenta para la racha y da 10 puntos.' },
  { tier: 'secondary', label: 'Secundario', help: 'Suma al día perfecto y da 5 puntos.' },
];

const SCHEDULE_OPTIONS: { type: HabitScheduleType; label: string; help: string }[] = [
  { type: 'daily', label: 'Todos los días', help: 'Cuenta y castiga cada día.' },
  { type: 'days_of_week', label: 'Días fijos', help: 'Solo cuenta (y castiga) los días elegidos.' },
  {
    type: 'times_per_week',
    label: 'Veces por semana',
    help: 'No entra en la racha. Suma puntos hasta la meta de la semana (lunes a domingo).',
  },
];

const MAX_FIXED_DAYS = 6;

/** Hora propuesta al activar un recordatorio nuevo. */
const DEFAULT_REMINDER_TIME = '20:00';

function reminderHelp(schedule: HabitDraft['schedule']): string {
  if (schedule.type === 'times_per_week') {
    return 'Llega a tu celular esos días si todavía no lo marcaste. La semana que llegas a tu meta deja de sonar.';
  }
  return 'Llega a tu celular esos días si todavía no lo marcaste.';
}

/** Lo que ya no se puede cambiar al editar, en gris y con el porqué. */
function FixedValue({ value, note }: { value: string; note?: string }) {
  return (
    <View className="bg-surface-100 gap-0.5 rounded-md px-3 py-2.5">
      <Text className="font-body-bold text-body text-ink">{value}</Text>
      {note && <Hint>{note}</Hint>}
    </View>
  );
}

/** Círculo de opción única: deja claro que se elige una sola de la lista. */
function RadioDot({ isSelected }: { isSelected: boolean }) {
  return (
    <View
      className={`h-5 w-5 items-center justify-center rounded-full border-2 ${isSelected ? 'border-ember-strong' : 'border-ink-faint'}`}
    >
      {isSelected && <View className="bg-ember-strong h-2.5 w-2.5 rounded-full" />}
    </View>
  );
}

/**
 * Días de L a D en una sola fila que se reparte el ancho (a 360 px no caben siete círculos de 44);
 * marca los elegidos. Sirve para los días fijos y para el recordatorio.
 */
function WeekdayPicker({
  days,
  selected,
  onToggle,
}: {
  days: readonly number[];
  selected: readonly number[];
  onToggle: (isoWeekday: number) => void;
}) {
  return (
    <View className="flex-row gap-1.5">
      {WEEKDAY_OPTIONS.filter((day) => days.includes(day.isoWeekday)).map((day) => {
        const isSelected = selected.includes(day.isoWeekday);
        return (
          <Pressable
            key={day.isoWeekday}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            onPress={() => onToggle(day.isoWeekday)}
            className={`h-11 max-w-11 flex-1 items-center justify-center rounded-full border-2 ${choiceContainer(isSelected)}`}
          >
            <Text className={`font-body-extrabold text-button ${choiceLabel(isSelected)}`}>
              {day.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function HabitForm({ habits, habit, onSubmit }: HabitFormProps) {
  const isNew = !habit;
  const isPrimaryAllowed = canBePrimary(habits, habit?.id);
  const [draft, setDraft] = useState<HabitDraft>({
    name: habit?.name ?? '',
    description: habit?.description ?? '',
    tier: habit?.tier ?? (isPrimaryAllowed ? 'primary' : 'secondary'),
    category: habit?.category ?? 'health',
    icon: habitIconOf(habit?.icon),
    color: habit?.color ?? categoryOf('health').color,
    schedule: habit?.schedule ?? { type: 'daily' },
    hasTarget: Boolean(habit?.target),
    targetAmount: habit?.target ? String(habit.target.amount) : '',
    targetUnit: habit?.target?.unit ?? '',
    hasReminder: Boolean(habit?.reminder),
    reminderTime: habit?.reminder?.time ?? DEFAULT_REMINDER_TIME,
    reminderDays: habit?.reminder?.daysOfWeek ?? WEEKDAY_OPTIONS.map((day) => day.isoWeekday),
  });
  // Los errores de un campo se muestran después de salir de él o de intentar guardar.
  const [touched, setTouched] = useState<Partial<Record<keyof HabitDraft, boolean>>>({});
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false);

  const errors = validateHabit(draft, { habits, habitId: habit?.id, isNew });
  const visibleError = (field: keyof HabitDraft) =>
    hasTriedSubmit || touched[field] ? errors[field] : undefined;

  function update<Field extends keyof HabitDraft>(field: Field, value: HabitDraft[Field]) {
    setDraft((current) => ({ ...current, [field]: value }));
  }

  // La categoría propone su color; si no gusta, se cambia después en la paleta.
  function selectCategory(category: HabitCategory) {
    setDraft((current) => ({ ...current, category, color: categoryOf(category).color }));
  }

  function selectScheduleType(type: HabitScheduleType) {
    setDraft((current) => ({
      ...current,
      schedule:
        type === 'daily'
          ? { type }
          : type === 'days_of_week'
            ? { type, daysOfWeek: [] }
            : { type, timesPerWeek: TIMES_PER_WEEK_MIN },
    }));
  }

  function toggleWeekday(isoWeekday: number) {
    setDraft((current) => {
      if (current.schedule.type !== 'days_of_week') return current;
      const { daysOfWeek } = current.schedule;
      const isSelected = daysOfWeek.includes(isoWeekday);
      if (!isSelected && daysOfWeek.length >= MAX_FIXED_DAYS) return current;
      const nextDays = isSelected
        ? daysOfWeek.filter((day) => day !== isoWeekday)
        : [...daysOfWeek, isoWeekday];
      return { ...current, schedule: { type: 'days_of_week', daysOfWeek: nextDays } };
    });
  }

  function toggleReminderDay(isoWeekday: number) {
    setTouched((current) => ({ ...current, reminderDays: true }));
    setDraft((current) => ({
      ...current,
      reminderDays: current.reminderDays.includes(isoWeekday)
        ? current.reminderDays.filter((day) => day !== isoWeekday)
        : [...current.reminderDays, isoWeekday],
    }));
  }

  function handleSubmit() {
    setHasTriedSubmit(true);
    if (hasErrors(errors)) return;
    onSubmit({
      name: draft.name.trim(),
      description: draft.description.trim() || null,
      tier: draft.tier,
      category: draft.category,
      icon: draft.icon,
      color: draft.color,
      schedule: draft.schedule,
      target: draft.hasTarget
        ? { amount: Number(draft.targetAmount), unit: draft.targetUnit.trim() }
        : null,
      reminder: draftReminder(draft),
    });
  }

  const selectedHelp = TIER_OPTIONS.find((option) => option.tier === draft.tier)?.help;
  const tierError = visibleError('tier');
  const reminderDaysError = visibleError('reminderDays');

  return (
    <View className="gap-6">
      <FormSection title="Lo básico">
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
      </FormSection>

      <FormSection title="Cómo cuenta">
        <View className="gap-2">
          <FieldLabel>Tipo</FieldLabel>
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
                  className={`min-h-12 flex-1 items-center justify-center rounded-md border-2 ${choiceContainer(isSelected)} ${isDisabled ? 'opacity-40' : ''}`}
                >
                  <Text className={`font-body-extrabold text-button ${choiceLabel(isSelected)}`}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Hint>{selectedHelp}</Hint>
          {tierError ? (
            <FieldError>{tierError}</FieldError>
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
          <FieldLabel>Frecuencia</FieldLabel>
          {isNew ? (
            <>
              <View accessibilityRole="radiogroup" className="gap-2">
                {SCHEDULE_OPTIONS.map((option) => {
                  const isSelected = option.type === draft.schedule.type;
                  return (
                    <Pressable
                      key={option.type}
                      accessibilityRole="radio"
                      accessibilityState={{ checked: isSelected }}
                      onPress={() => selectScheduleType(option.type)}
                      className={`flex-row items-center gap-3 rounded-md border-2 px-3 py-2.5 ${choiceContainer(isSelected)}`}
                    >
                      <RadioDot isSelected={isSelected} />
                      <View className="flex-1 gap-0.5">
                        <Text
                          className={`font-body-extrabold text-button ${isSelected ? 'text-ember-strong' : 'text-ink'}`}
                        >
                          {option.label}
                        </Text>
                        <Hint>{option.help}</Hint>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {draft.schedule.type === 'days_of_week' && (
                <View className="gap-1">
                  <WeekdayPicker
                    days={WEEKDAY_OPTIONS.map((day) => day.isoWeekday)}
                    selected={draft.schedule.daysOfWeek}
                    onToggle={toggleWeekday}
                  />
                  {(hasTriedSubmit || touched.schedule) && errors.schedule && (
                    <FieldError>{errors.schedule}</FieldError>
                  )}
                </View>
              )}

              {draft.schedule.type === 'times_per_week' && (
                <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
                  {Array.from(
                    { length: TIMES_PER_WEEK_MAX - TIMES_PER_WEEK_MIN + 1 },
                    (_, index) => TIMES_PER_WEEK_MIN + index,
                  ).map((n) => {
                    const isSelected =
                      draft.schedule.type === 'times_per_week' && draft.schedule.timesPerWeek === n;
                    return (
                      <Pressable
                        key={n}
                        accessibilityRole="radio"
                        accessibilityState={{ checked: isSelected }}
                        onPress={() =>
                          update('schedule', { type: 'times_per_week', timesPerWeek: n })
                        }
                        className={`h-11 w-11 items-center justify-center rounded-full border-2 ${choiceContainer(isSelected)}`}
                      >
                        <Text
                          className={`font-body-extrabold text-button ${choiceLabel(isSelected)}`}
                        >
                          {n}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </>
          ) : (
            <FixedValue
              value={scheduleText(draft.schedule)}
              note="No se puede cambiar: archiva el hábito y crea uno nuevo si hace falta otra frecuencia."
            />
          )}
        </View>

        {isNew ? (
          <View className="gap-2">
            <View className="min-h-11 flex-row items-center gap-3">
              <View className="flex-1 gap-0.5">
                <FieldLabel>Con cantidad</FieldLabel>
                <Hint>Para contar vasos, páginas, minutos…</Hint>
              </View>
              <Toggle
                accessibilityLabel="Con cantidad"
                value={draft.hasTarget}
                onChange={(hasTarget) => update('hasTarget', hasTarget)}
              />
            </View>
            {draft.hasTarget && (
              <View className="flex-row gap-2">
                <View className="w-24">
                  <TextField
                    label="Meta"
                    value={draft.targetAmount}
                    onChangeText={(value) => update('targetAmount', value)}
                    onBlur={() => setTouched((current) => ({ ...current, targetAmount: true }))}
                    keyboardType="number-pad"
                    placeholder="8"
                    error={visibleError('targetAmount')}
                  />
                </View>
                <View className="flex-1">
                  <TextField
                    label="Unidad"
                    value={draft.targetUnit}
                    onChangeText={(value) => update('targetUnit', value)}
                    onBlur={() => setTouched((current) => ({ ...current, targetUnit: true }))}
                    maxLength={TARGET_UNIT_MAX_LENGTH}
                    placeholder="vasos"
                    autoCapitalize="none"
                    error={visibleError('targetUnit')}
                  />
                </View>
              </View>
            )}
          </View>
        ) : (
          <View className="gap-2">
            <FieldLabel>Cantidad</FieldLabel>
            <FixedValue
              value={
                draft.hasTarget
                  ? `${draft.targetAmount} ${draft.targetUnit} al día`
                  : 'Sin cantidad: se marca hecho o no'
              }
              note="Tampoco se puede cambiar después de crearlo."
            />
          </View>
        )}
      </FormSection>

      <FormSection title="Recordatorio">
        <View className="min-h-11 flex-row items-center gap-3">
          <View className="flex-1 gap-0.5">
            <FieldLabel>Recordarme</FieldLabel>
            <Hint>{reminderHelp(draft.schedule)}</Hint>
          </View>
          <Toggle
            accessibilityLabel="Recordarme"
            value={draft.hasReminder}
            onChange={(hasReminder) => update('hasReminder', hasReminder)}
          />
        </View>
        {draft.hasReminder && (
          <>
            <View className="border-border -my-2 border-t">
              <TimeField
                label="Hora"
                value={draft.reminderTime}
                onChange={(value) => update('reminderTime', value)}
              />
            </View>
            <View className="gap-2">
              <FieldLabel>Qué días</FieldLabel>
              <WeekdayPicker
                days={reminderDaysFor(draft.schedule)}
                selected={draft.reminderDays}
                onToggle={toggleReminderDay}
              />
              {reminderDaysError && <FieldError>{reminderDaysError}</FieldError>}
            </View>
          </>
        )}
      </FormSection>

      <FormSection title="Aspecto">
        {/* Vista previa: la casilla de Hoy con el color y el ícono elegidos. */}
        <View className="bg-surface-100 min-h-14 flex-row items-center gap-3 rounded-md px-3">
          <Checkbox isDone size={28} color={draft.color} />
          <HabitIcon icon={draft.icon} size={18} color={strongHabitColor(draft.color)} />
          <Text numberOfLines={1} className="font-heading text-heading-sm text-ink flex-1">
            {draft.name.trim() || 'Tu hábito'}
          </Text>
          <Text className="font-body-semibold text-caption text-ink-faint">Así se verá</Text>
        </View>

        <View className="gap-2">
          <FieldLabel>Categoría</FieldLabel>
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
            {HABIT_CATEGORIES.map((option) => {
              const isSelected = option.id === draft.category;
              return (
                <Pressable
                  key={option.id}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => selectCategory(option.id)}
                  className={`min-h-11 flex-row items-center gap-2 rounded-full border-2 px-3 ${choiceContainer(isSelected)}`}
                >
                  <View
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: option.color }}
                  />
                  <Text className={`font-body-extrabold text-button ${choiceLabel(isSelected)}`}>
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <View className="gap-2">
          <FieldLabel>Color</FieldLabel>
          {/* Cuatro por fila: los doce colores caben en tres filas parejas a 360 px. */}
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap">
            {HABIT_COLORS.map((color) => {
              const isSelected = color === draft.color;
              return (
                <Pressable
                  key={color}
                  accessibilityRole="radio"
                  accessibilityLabel={`Color ${color}`}
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => update('color', color)}
                  className="h-12 w-1/4 items-center justify-center active:opacity-85"
                >
                  {/* El elegido lleva un check del tono oscuro de su color, no solo un aro. */}
                  <View
                    className="h-10 w-10 items-center justify-center rounded-full"
                    style={{
                      backgroundColor: color,
                      borderWidth: isSelected ? 2 : 0,
                      borderColor: strongHabitColor(color),
                    }}
                  >
                    {isSelected && <CheckIcon size={18} color={strongHabitColor(color)} />}
                  </View>
                </Pressable>
              );
            })}
          </View>
          <Hint>Lo propone la categoría. Cámbialo si quieres.</Hint>
        </View>

        <HabitIconPicker value={draft.icon} onChange={(icon) => update('icon', icon)} />
      </FormSection>

      <ScreenFooter>
        <View className="gap-2">
          {hasTriedSubmit && hasErrors(errors) && (
            <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
              Revisa los campos marcados antes de guardar.
            </Text>
          )}
          <Button label="Guardar" onPress={handleSubmit} />
        </View>
      </ScreenFooter>
    </View>
  );
}
