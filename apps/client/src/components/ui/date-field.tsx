import {
  addMonths,
  daysInMonth,
  formatMonthAbbrev,
  formatShortDate,
  type DateKey,
} from '@ascua/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { choiceContainer, choiceLabel } from '@/components/ui/choice-styles';
import { CalendarIcon } from '@/components/ui/icons';
import { WHEEL_ITEM_HEIGHT, WHEEL_VISIBLE_ITEMS, WheelPicker } from '@/components/ui/wheel-picker';
import { selectionFeedback } from '@/features/celebration/haptics';
import { useThemeColors } from '@/theme/colors';

interface DateFieldProps {
  label: string;
  /** null = sin fecha. */
  value: DateKey | null;
  onChange: (value: DateKey | null) => void;
  /** El primer día que se puede elegir (hoy, por lo general). */
  minDateKey: DateKey;
  hint?: string;
}

/** Cuántos años hacia adelante ofrece la rueda. */
const YEARS_AHEAD = 5;
const MONTHS = Array.from({ length: 12 }, (_, index) => index + 1);

const pad = (value: number) => String(value).padStart(2, '0');

type Parts = [year: number, month: number, day: number];

function split(dateKey: DateKey): Parts {
  return [Number(dateKey.slice(0, 4)), Number(dateKey.slice(5, 7)), Number(dateKey.slice(8, 10))];
}

/** Arma la fecha y ajusta el día si el mes es más corto (31 → 30). */
function join([year, month, day]: Parts): DateKey {
  return `${year}-${pad(month)}-${pad(Math.min(day, daysInMonth(year, month)))}`;
}

/** '9 oct 2026'. */
export function formatDateWithYear(dateKey: DateKey): string {
  return `${formatShortDate(dateKey)} ${dateKey.slice(0, 4)}`;
}

/**
 * Fila con una fecha opcional que abre una hoja con tres ruedas (día, mes y año) y fechas
 * rápidas. El mismo patrón que el campo de hora.
 */
export function DateField({ label, value, onChange, minDateKey, hint }: DateFieldProps) {
  const colors = useThemeColors();
  const [draft, setDraft] = useState<Parts | null>(null);
  const firstYear = Number(minDateKey.slice(0, 4));
  const years = Array.from({ length: YEARS_AHEAD + 1 }, (_, index) => firstYear + index);
  const current = draft ?? split(value ?? addMonths(minDateKey, 1));
  const [year, month, day] = current;
  const days = Array.from({ length: daysInMonth(year, month) }, (_, index) => index + 1);
  const picked = join(current);
  const isTooEarly = picked < minDateKey;

  const presets = [
    { label: 'En 1 mes', dateKey: addMonths(minDateKey, 1) },
    { label: 'En 3 meses', dateKey: addMonths(minDateKey, 3) },
    { label: 'En 6 meses', dateKey: addMonths(minDateKey, 6) },
    { label: 'Fin de año', dateKey: `${firstYear}-12-31` },
  ];

  function update(index: 0 | 1 | 2, next: number) {
    setDraft((previous) => {
      const parts: Parts = [...(previous ?? current)];
      parts[index] = next;
      return split(join(parts));
    });
  }

  function confirm() {
    if (isTooEarly) return;
    onChange(picked);
    setDraft(null);
  }

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${label}: ${value ? formatDateWithYear(value) : 'sin fecha'}`}
        accessibilityHint="Cambia la fecha"
        onPress={() => setDraft(split(value ?? addMonths(minDateKey, 1)))}
        className="min-h-12 flex-row items-center gap-3 py-2 active:opacity-85"
      >
        <View className="flex-1 gap-0.5">
          <Text className="font-body-bold text-body text-ink">{label}</Text>
          {hint && <Text className="font-body text-caption text-ink-muted">{hint}</Text>}
        </View>
        <View
          className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${value ? 'bg-warning-soft' : 'bg-surface-300'}`}
        >
          <CalendarIcon size={16} color={value ? colors.emberStrong : colors.inkMuted} />
          <Text
            className={`font-heading text-heading-sm ${value ? 'text-ember-strong' : 'text-ink-muted'}`}
          >
            {value ? formatDateWithYear(value) : 'Sin fecha'}
          </Text>
        </View>
      </Pressable>

      <BottomSheet isOpen={draft !== null} title={label} onClose={() => setDraft(null)}>
        <View className="items-center justify-center">
          <View
            pointerEvents="none"
            className="bg-surface-300 absolute left-0 right-0 rounded-md"
            style={{
              top: ((WHEEL_VISIBLE_ITEMS - 1) / 2) * WHEEL_ITEM_HEIGHT,
              height: WHEEL_ITEM_HEIGHT,
            }}
          />
          <View className="flex-row items-center gap-1">
            <WheelPicker
              label="Día"
              options={days}
              value={day}
              format={String}
              width={64}
              onChange={(next) => update(2, next)}
            />
            <WheelPicker
              label="Mes"
              options={MONTHS}
              value={month}
              format={(next) => formatMonthAbbrev(`2000-${pad(next)}`)}
              width={80}
              onChange={(next) => update(1, next)}
            />
            <WheelPicker
              label="Año"
              options={years}
              value={year}
              format={String}
              width={88}
              onChange={(next) => update(0, next)}
            />
          </View>
        </View>

        <View
          accessibilityRole="radiogroup"
          accessibilityLabel="Fechas rápidas"
          className="flex-row flex-wrap gap-2"
        >
          {presets.map((preset) => {
            const isSelected = preset.dateKey === picked;
            return (
              <Pressable
                key={preset.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: isSelected }}
                accessibilityLabel={`${preset.label}, ${formatDateWithYear(preset.dateKey)}`}
                onPress={() => {
                  selectionFeedback();
                  setDraft(split(preset.dateKey));
                }}
                className={`min-h-11 justify-center rounded-full border-[1.5px] px-3 ${choiceContainer(isSelected)}`}
              >
                <Text className={`font-body-bold text-body ${choiceLabel(isSelected)}`}>
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {isTooEarly && (
          <Text accessibilityLiveRegion="polite" className="font-body-bold text-caption text-error">
            Elige {formatDateWithYear(minDateKey)} o un día que viene.
          </Text>
        )}

        <View className="flex-row gap-2">
          <View className="flex-1">
            <Button
              label="Sin fecha"
              variant="secondary"
              onPress={() => {
                onChange(null);
                setDraft(null);
              }}
            />
          </View>
          <View className="flex-1">
            <Button label="Listo" isDisabled={isTooEarly} onPress={confirm} />
          </View>
        </View>
      </BottomSheet>
    </>
  );
}
