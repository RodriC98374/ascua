// Check-in de Hoy (fase 15, D22): tres escalas de 1 a 5, un toque cada una. Tocar el valor elegido
// lo borra. No da puntos, así que no suena: solo vibra, como cambiar una opción.
import {
  CHECK_IN_DIMENSIONS,
  CHECK_IN_MAX,
  CHECK_IN_MIN,
  type CheckIn,
  type CheckInDimension,
} from '@ascua/shared';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { selectionFeedback } from '@/features/celebration/haptics';
import { useActiveColorScheme, useThemeColors } from '@/theme/colors';

import { useCheckInColors } from './check-in-colors';
import { CHECK_IN_LABELS, checkInStatusText } from './check-in-text';

const VALUES = Array.from(
  { length: CHECK_IN_MAX - CHECK_IN_MIN + 1 },
  (_, index) => CHECK_IN_MIN + index,
);

interface CheckInCardProps {
  checkIn: CheckIn;
  onAnswer: (dimension: CheckInDimension, value: number | null) => void;
}

export function CheckInCard({ checkIn, onAnswer }: CheckInCardProps) {
  return (
    <View className="gap-3">
      <View className="gap-0.5">
        <Text className="font-heading text-heading-md text-ink">¿Cómo estás hoy?</Text>
        <Text className="font-body-semibold text-caption text-ink-muted">
          {checkInStatusText(checkIn)}
        </Text>
      </View>
      <Card className="gap-4">
        {CHECK_IN_DIMENSIONS.map((dimension) => (
          <ScaleRow
            key={dimension}
            dimension={dimension}
            value={checkIn[dimension] ?? null}
            onChange={(value) => {
              selectionFeedback();
              onAnswer(dimension, value);
            }}
          />
        ))}
      </Card>
    </View>
  );
}

function ScaleRow({
  dimension,
  value,
  onChange,
}: {
  dimension: CheckInDimension;
  value: number | null;
  onChange: (value: number | null) => void;
}) {
  const colors = useThemeColors();
  const scaleColor = useCheckInColors()[dimension];
  // En claro, los colores de escala son oscuros y llevan texto blanco; en oscuro, al revés.
  const selectedText = useActiveColorScheme() === 'dark' ? colors.inkOnFill : colors.surface100;
  const { name, low, high } = CHECK_IN_LABELS[dimension];
  return (
    <View className="gap-1.5">
      <Text className="font-body-bold text-body text-ink">{name}</Text>
      <View accessibilityRole="radiogroup" accessibilityLabel={name} className="flex-row gap-2">
        {VALUES.map((option) => {
          const isSelected = option === value;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={`${name}: ${option} de ${CHECK_IN_MAX}`}
              accessibilityState={{ checked: isSelected }}
              onPress={() => onChange(isSelected ? null : option)}
              className="h-11 flex-1 items-center justify-center rounded-full border-2 active:opacity-85"
              style={{
                borderColor: isSelected ? scaleColor : colors.border,
                backgroundColor: isSelected ? scaleColor : colors.surface300,
              }}
            >
              <Text
                className="font-body-extrabold text-button"
                style={{ color: isSelected ? selectedText : colors.inkMuted }}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View className="flex-row justify-between">
        <Text className="font-body-semibold text-caption text-ink-faint">{low}</Text>
        <Text className="font-body-semibold text-caption text-ink-faint">{high}</Text>
      </View>
    </View>
  );
}
