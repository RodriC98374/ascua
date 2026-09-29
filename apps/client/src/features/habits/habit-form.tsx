import {
  canBePrimary,
  categoryOf,
  HABIT_CATEGORIES,
  HABIT_COLORS,
  HABIT_DESCRIPTION_MAX_LENGTH,
  HABIT_NAME_MAX_LENGTH,
  MAX_PRIMARY_HABITS,
  reminderDaysFor,
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
import { TextField } from '@/components/ui/text-field';
import { TimeField } from '@/components/ui/time-field';
import { Toggle } from '@/components/ui/toggle';
import {
  draftReminder,
  hasErrors,
  validateHabit,
  type HabitDraft,
} from '@/features/habits/habit-validation';
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

const WEEKDAY_OPTIONS = [
  { isoWeekday: 1, label: 'L' },
  { isoWeekday: 2, label: 'M' },
  { isoWeekday: 3, label: 'X' },
  { isoWeekday: 4, label: 'J' },
  { isoWeekday: 5, label: 'V' },
  { isoWeekday: 6, label: 'S' },
  { isoWeekday: 7, label: 'D' },
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

/** Círculos de L a D; marca los elegidos. Sirve para los días fijos y para el recordatorio. */
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
    <View className="flex-row flex-wrap gap-2">
      {WEEKDAY_OPTIONS.filter((day) => days.includes(day.isoWeekday)).map((day) => {
        const isSelected = selected.includes(day.isoWeekday);
        return (
          <Pressable
            key={day.isoWeekday}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            onPress={() => onToggle(day.isoWeekday)}
            className={`h-11 w-11 items-center justify-center rounded-full border-2 ${isSelected ? 'border-ink bg-surface-300' : 'border-border bg-surface-200 active:opacity-85'}`}
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
  );
}

function describeSchedule(schedule: HabitDraft['schedule']): string {
  if (schedule.type === 'daily') return 'Todos los días';
  if (schedule.type === 'days_of_week') {
    const labels = WEEKDAY_OPTIONS.filter((day) =>
      schedule.daysOfWeek.includes(day.isoWeekday),
    ).map((day) => day.label);
    return `Días fijos: ${labels.join(', ')}`;
  }
  const { timesPerWeek } = schedule;
  return `${timesPerWeek} ${timesPerWeek === 1 ? 'vez' : 'veces'} por semana`;
}

export function HabitForm({ habits, habit, onSubmit }: HabitFormProps) {
  const isNew = !habit;
  const isPrimaryAllowed = canBePrimary(habits, habit?.id);
  const [draft, setDraft] = useState<HabitDraft>({
    name: habit?.name ?? '',
    description: habit?.description ?? '',
    tier: habit?.tier ?? (isPrimaryAllowed ? 'primary' : 'secondary'),
    category: habit?.category ?? 'health',
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
        <Text className="font-body-bold text-caption text-ink-muted">Frecuencia</Text>
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
                    className={`gap-0.5 rounded-md border-2 px-3 py-2 ${isSelected ? 'border-ember-strong bg-warning-soft' : 'border-border bg-surface-200 active:opacity-85'}`}
                  >
                    <Text
                      className={`font-body-extrabold text-button ${isSelected ? 'text-ember-strong' : 'text-ink'}`}
                    >
                      {option.label}
                    </Text>
                    <Text className="font-body-semibold text-caption text-ink-muted">
                      {option.help}
                    </Text>
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
                  <Text
                    accessibilityLiveRegion="polite"
                    className="font-body-bold text-caption text-error"
                  >
                    {errors.schedule}
                  </Text>
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
                      className={`h-11 w-11 items-center justify-center rounded-full border-2 ${isSelected ? 'border-ink bg-surface-300' : 'border-border bg-surface-200 active:opacity-85'}`}
                    >
                      <Text
                        className={`font-body-extrabold text-button ${isSelected ? 'text-ink' : 'text-ink-muted'}`}
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
          <Text className="font-body text-body text-ink-muted">
            {describeSchedule(draft.schedule)}. No se puede cambiar: archiva el hábito y crea uno
            nuevo si hace falta otra frecuencia.
          </Text>
        )}
      </View>

      <View className="gap-2">
        <View className="flex-row items-center gap-3">
          <Text className="font-body-bold text-caption text-ink-muted flex-1">
            Con cantidad (vasos, páginas…)
          </Text>
          {isNew && (
            <Toggle
              accessibilityLabel="Con cantidad"
              value={draft.hasTarget}
              onChange={(hasTarget) => update('hasTarget', hasTarget)}
            />
          )}
        </View>
        {isNew
          ? draft.hasTarget && (
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
            )
          : draft.hasTarget && (
              <Text className="font-body text-body text-ink-muted">
                Meta fija: {draft.targetAmount} {draft.targetUnit} al día.
              </Text>
            )}
      </View>

      <View className="gap-2">
        <View className="flex-row items-center gap-3">
          <Text className="font-body-bold text-caption text-ink-muted flex-1">Recordarme</Text>
          <Toggle
            accessibilityLabel="Recordarme"
            value={draft.hasReminder}
            onChange={(hasReminder) => update('hasReminder', hasReminder)}
          />
        </View>
        {draft.hasReminder && (
          <View className="gap-2">
            <TimeField
              label="Hora"
              value={draft.reminderTime}
              onChange={(value) => update('reminderTime', value)}
            />
            <WeekdayPicker
              days={reminderDaysFor(draft.schedule)}
              selected={draft.reminderDays}
              onToggle={toggleReminderDay}
            />
            <Text className="font-body-semibold text-caption text-ink-muted">
              {reminderHelp(draft.schedule)}
            </Text>
            {visibleError('reminderDays') && (
              <Text
                accessibilityLiveRegion="polite"
                className="font-body-bold text-caption text-error"
              >
                {visibleError('reminderDays')}
              </Text>
            )}
          </View>
        )}
      </View>

      <View className="gap-2">
        <Text className="font-body-bold text-caption text-ink-muted">Categoría</Text>
        <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
          {HABIT_CATEGORIES.map((option) => {
            const isSelected = option.id === draft.category;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                onPress={() => selectCategory(option.id)}
                className={`min-h-11 flex-row items-center gap-2 rounded-full border-2 px-3 ${isSelected ? 'border-ink bg-surface-300' : 'border-border bg-surface-200 active:opacity-85'}`}
              >
                <View className="h-3 w-3 rounded-full" style={{ backgroundColor: option.color }} />
                <Text
                  className={`font-body-extrabold text-button ${isSelected ? 'text-ink' : 'text-ink-muted'}`}
                >
                  {option.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View className="gap-2">
        <Text className="font-body-bold text-caption text-ink-muted">Color</Text>
        {/* Cuatro por fila: los ocho colores caben en dos filas parejas a 360 px. */}
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
                <View
                  className={`h-10 w-10 items-center justify-center rounded-full border-2 ${isSelected ? 'border-ink' : 'border-transparent'}`}
                >
                  <View className="h-7 w-7 rounded-full" style={{ backgroundColor: color }} />
                </View>
              </Pressable>
            );
          })}
        </View>
        <Text className="font-body-semibold text-caption text-ink-muted">
          Lo propone la categoría. Cámbialo si quieres.
        </Text>
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
