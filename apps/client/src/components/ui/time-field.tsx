import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { colors } from '@/theme/colors';

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

const pad = (value: number) => String(value).padStart(2, '0');

function splitTime(value: string): [number, number] {
  const [hours, minutes] = value.split(':').map(Number);
  return [hours ?? 0, minutes ?? 0];
}

/**
 * Fila con una hora 'HH:mm' que abre un selector de hora y minutos (cada 5). Igual en Android y
 * en web, sin selectores nativos.
 */
export function TimeField({ label, value, onChange, hint, isDisabled = false }: TimeFieldProps) {
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
        className={`min-h-12 flex-row items-center gap-3 py-2 ${isDisabled ? 'opacity-50' : ''}`}
      >
        <View className="flex-1 gap-0.5">
          <Text className="font-body-bold text-body text-ink">{label}</Text>
          {hint && <Text className="font-body text-caption text-ink-muted">{hint}</Text>}
        </View>
        <View className="bg-surface-300 min-w-16 items-center rounded-sm px-3 py-2">
          <Text className="font-heading text-heading-sm text-ember-strong">{value}</Text>
        </View>
      </Pressable>

      <Modal
        transparent
        visible={draft !== null}
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={() => setDraft(null)}
      >
        <View className="flex-1 items-center justify-center px-4">
          <Pressable
            accessibilityLabel="Cancelar"
            onPress={() => setDraft(null)}
            style={{ position: 'absolute', inset: 0, backgroundColor: colors.scrim }}
          />
          <View accessibilityViewIsModal className="w-full max-w-sm">
            <Card className="gap-4">
              <View className="flex-row items-baseline justify-between">
                <Text accessibilityRole="header" className="font-heading text-heading-md text-ink">
                  {label}
                </Text>
                <Text className="font-heading-extrabold text-heading-lg text-ember-strong">
                  {pad(hours)}:{pad(minutes)}
                </Text>
              </View>
              <OptionGrid
                title="Hora"
                options={HOURS}
                selected={hours}
                onSelect={(hour) => setDraft([hour, minutes])}
              />
              <OptionGrid
                title="Minutos"
                options={minuteOptions}
                selected={minutes}
                onSelect={(minute) => setDraft([hours, minute])}
              />
              <View className="flex-row gap-2">
                <View className="flex-1">
                  <Button label="Cancelar" variant="secondary" onPress={() => setDraft(null)} />
                </View>
                <View className="flex-1">
                  <Button label="Guardar" onPress={confirm} />
                </View>
              </View>
            </Card>
          </View>
        </View>
      </Modal>
    </>
  );
}

interface OptionGridProps {
  title: string;
  options: readonly number[];
  selected: number;
  onSelect: (value: number) => void;
}

function OptionGrid({ title, options, selected, onSelect }: OptionGridProps) {
  return (
    <View className="gap-2">
      <Text className="font-body-bold text-caption text-ink-muted">{title}</Text>
      <View
        accessibilityRole="radiogroup"
        accessibilityLabel={title}
        className="flex-row flex-wrap gap-1"
      >
        {options.map((option) => {
          const isSelected = option === selected;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityState={{ checked: isSelected }}
              onPress={() => onSelect(option)}
              className={`min-h-11 items-center justify-center rounded-sm ${isSelected ? 'bg-ember' : 'bg-surface-300'}`}
              // Seis por fila, con el espacio entre ellas.
              style={{ width: '15%' }}
            >
              <Text
                className={`font-body-bold text-body ${isSelected ? 'text-ink-on-fill' : 'text-ink'}`}
              >
                {pad(option)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
