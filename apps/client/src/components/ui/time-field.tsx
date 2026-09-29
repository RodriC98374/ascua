import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { ClockIcon } from '@/components/ui/icons';
import { WHEEL_ITEM_HEIGHT, WHEEL_VISIBLE_ITEMS, WheelPicker } from '@/components/ui/wheel-picker';
import { selectionFeedback } from '@/features/celebration/haptics';
import { useThemeColors } from '@/theme/colors';

interface TimeFieldProps {
  label: string;
  /** 'HH:mm'. */
  value: string;
  onChange: (value: string) => void;
  /** Texto de ayuda bajo el nombre. */
  hint?: string;
  isDisabled?: boolean;
}

const HOURS = Array.from({ length: 24 }, (_, hour) => hour);
const MINUTES = Array.from({ length: 12 }, (_, index) => index * 5);

/** Horas rápidas: las que más se eligen para un recordatorio, a un toque. */
const PRESETS = [
  { label: 'Mañana', time: [7, 0] },
  { label: 'Mediodía', time: [12, 0] },
  { label: 'Tarde', time: [18, 0] },
  { label: 'Noche', time: [21, 0] },
] as const satisfies readonly { label: string; time: readonly [number, number] }[];

const pad = (value: number) => String(value).padStart(2, '0');

function splitTime(value: string): [number, number] {
  const [hours, minutes] = value.split(':').map(Number);
  return [hours ?? 0, minutes ?? 0];
}

/**
 * Fila con una hora 'HH:mm' que abre una hoja con dos ruedas (hora y minutos, cada 5) y horas
 * rápidas. Igual en Android y en web, sin selectores nativos.
 */
export function TimeField({ label, value, onChange, hint, isDisabled = false }: TimeFieldProps) {
  const colors = useThemeColors();
  const [draft, setDraft] = useState<[number, number] | null>(null);
  const [hours, minutes] = draft ?? splitTime(value);
  // Una hora guardada que no cae en múltiplo de 5 igual se puede conservar.
  const minuteOptions = MINUTES.includes(minutes)
    ? MINUTES
    : [...MINUTES, minutes].sort((a, b) => a - b);

  function confirm() {
    if (draft) onChange(`${pad(draft[0])}:${pad(draft[1])}`);
    setDraft(null);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value}`}
        accessibilityHint="Cambia la hora"
        accessibilityState={{ disabled: isDisabled }}
        disabled={isDisabled}
        onPress={() => setDraft(splitTime(value))}
        className={`min-h-12 flex-row items-center gap-3 py-2 ${isDisabled ? 'opacity-50' : 'active:opacity-85'}`}
      >
        <View className="flex-1 gap-0.5">
          <Text className="font-body-bold text-body text-ink">{label}</Text>
          {hint && <Text className="font-body text-caption text-ink-muted">{hint}</Text>}
        </View>
        <View className="bg-warning-soft flex-row items-center gap-1.5 rounded-full px-3 py-1.5">
          <ClockIcon size={16} color={colors.emberStrong} />
          <Text className="font-heading text-heading-sm text-ember-strong">{value}</Text>
        </View>
      </Pressable>

      <BottomSheet isOpen={draft !== null} title={label} onClose={() => setDraft(null)}>
        <View className="items-center justify-center">
          {/* Franja de la opción elegida, detrás de las dos ruedas. */}
          <View
            pointerEvents="none"
            className="bg-surface-300 absolute left-0 right-0 rounded-md"
            style={{
              top: ((WHEEL_VISIBLE_ITEMS - 1) / 2) * WHEEL_ITEM_HEIGHT,
              height: WHEEL_ITEM_HEIGHT,
            }}
          />
          <View className="flex-row items-center gap-2">
            <WheelPicker
              label="Hora"
              options={HOURS}
              value={hours}
              format={pad}
              onChange={(hour) => setDraft((current) => [hour, current?.[1] ?? minutes])}
            />
            <Text className="font-heading text-heading-lg text-ink">:</Text>
            <WheelPicker
              label="Minutos"
              options={minuteOptions}
              value={minutes}
              format={pad}
              onChange={(minute) => setDraft((current) => [current?.[0] ?? hours, minute])}
            />
          </View>
        </View>

        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Horas rápidas"
          className="flex-row gap-2"
        >
          {PRESETS.map((preset) => {
            const [presetHours, presetMinutes] = preset.time;
            const isSelected = presetHours === hours && presetMinutes === minutes;
            return (
              <Pressable
                key={preset.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${preset.label}, ${pad(presetHours)}:${pad(presetMinutes)}`}
                onPress={() => {
                  selectionFeedback();
                  setDraft([presetHours, presetMinutes]);
                }}
                className={`min-h-12 flex-1 items-center justify-center rounded-md border-[1.5px] py-1.5 ${isSelected ? 'border-ember-strong bg-warning-soft' : 'border-border bg-surface-200 active:opacity-85'}`}
              >
                <Text
                  className={`font-body-bold text-caption ${isSelected ? 'text-ember-strong' : 'text-ink-muted'}`}
                >
                  {preset.label}
                </Text>
                <Text
                  className={`font-heading text-heading-sm ${isSelected ? 'text-ember-strong' : 'text-ink'}`}
                >
                  {pad(presetHours)}:{pad(presetMinutes)}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button label="Cancelar" variant="secondary" onPress={() => setDraft(null)} />
          </View>
          <View className="flex-1">
            <Button label="Listo" onPress={confirm} />
          </View>
        </View>
      </BottomSheet>
    </>
  );
}
