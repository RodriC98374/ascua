// El brasero: un anillo con un segmento por hábito principal de hoy. Cada principal cumplido
// enciende su segmento con el degradado de marca; con todos encendidos, la racha de hoy está
// asegurada (la meta de racha es cumplir todos los principales).
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { View } from 'react-native';

import { EmberIcon } from '@/components/ui/icons';
import { useThemeColors } from '@/theme/colors';

const SIZE = 112;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
/** Separación entre segmentos, en grados (los extremos redondeados se comen parte). */
const GAP_DEGREES = 26;

function pointAt(degrees: number) {
  const radians = ((degrees - 90) * Math.PI) / 180;
  return { x: CENTER + RADIUS * Math.cos(radians), y: CENTER + RADIUS * Math.sin(radians) };
}

function arcPath(startDegrees: number, endDegrees: number) {
  const start = pointAt(startDegrees);
  const end = pointAt(endDegrees);
  const isLargeArc = endDegrees - startDegrees > 180 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${RADIUS} ${RADIUS} 0 ${isLargeArc} 1 ${end.x} ${end.y}`;
}

interface StreakHearthProps {
  /** Principales de hoy cumplidos y en total. */
  done: number;
  total: number;
  /** Con racha viva, la brasa del centro está encendida. */
  isStreakAlive: boolean;
}

export function StreakHearth({ done, total, isStreakAlive }: StreakHearthProps) {
  const colors = useThemeColors();
  const segment = total > 0 ? 360 / total : 360;
  const stroke = (isLit: boolean) => ({
    fill: 'none',
    stroke: isLit ? 'url(#hearth-ember)' : colors.border,
    strokeWidth: STROKE,
    strokeLinecap: 'round' as const,
  });

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${done} de ${total} hábitos principales cumplidos`}
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id="hearth-ember" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.ember} />
            <Stop offset="1" stopColor={colors.emberGlow} />
          </LinearGradient>
        </Defs>
        {total <= 1 ? (
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} {...stroke(total === 1 && done === 1)} />
        ) : (
          Array.from({ length: total }, (_, index) => (
            <Path
              key={index}
              d={arcPath(
                index * segment + GAP_DEGREES / 2,
                (index + 1) * segment - GAP_DEGREES / 2,
              )}
              {...stroke(index < done)}
            />
          ))
        )}
      </Svg>
      <EmberIcon size={40} color={isStreakAlive ? colors.emberStrong : colors.inkFaint} />
    </View>
  );
}
