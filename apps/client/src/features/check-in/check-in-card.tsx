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
import { CHECK_IN_LABELS, checkInLevelLabel, checkInStatusText } from './check-in-text';

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
    <View className="gap-2">
      <View className="gap-0.5">
        <Text accessibilityRole="header" className="font-heading text-heading-md text-ink">
          ¿Cómo estás hoy?
        </Text>
        <Text className="font-body-semibold text-caption text-ink-muted">
          {checkInStatusText(checkIn)}
        </Text>
      </View>
      <Card className="gap-5">
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
  const filledText = useActiveColorScheme() === 'dark' ? colors.inkOnFill : colors.surface200;
  const { name, levels } = CHECK_IN_LABELS[dimension];
  return (
    <View className="gap-2">
      <View className="flex-row items-baseline justify-between gap-2">
        <Text className="font-body-bold text-body text-ink">{name}</Text>
        <Text
          className="font-body-bold text-body"
          style={{ color: value === null ? colors.inkFaint : scaleColor }}
        >
          {checkInLevelLabel(dimension, value)}
        </Text>
      </View>
      {/* Barra de nivel: se llena hasta el valor elegido, como el volumen del celular. */}
      <View accessibilityRole="radiogroup" accessibilityLabel={name} className="flex-row gap-1.5">
        {VALUES.map((option) => {
          const isSelected = option === value;
          const isFilled = value !== null && option <= value;
          return (
            <Pressable
              key={option}
              accessibilityRole="radio"
              accessibilityLabel={`${name}: ${option} de ${CHECK_IN_MAX}, ${levels[option - CHECK_IN_MIN]}`}
              accessibilityState={{ checked: isSelected }}
              onPress={() => onChange(isSelected ? null : option)}
              className="h-11 flex-1 items-center justify-center rounded-md active:opacity-85"
              style={{ backgroundColor: isFilled ? scaleColor : colors.surface300 }}
            >
              <Text
                className="font-body-extrabold text-button"
                style={{ color: isFilled ? filledText : colors.inkMuted }}
              >
                {option}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
