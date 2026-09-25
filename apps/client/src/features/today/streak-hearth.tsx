// El brasero: un anillo con un segmento por hábito principal de hoy. Cada principal cumplido
// enciende su segmento con el degradado de marca; con todos encendidos, la racha de hoy está
// asegurada (la meta de racha es cumplir todos los principales).
import { useEffect, useId, useRef, useState } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { EmberIcon } from '@/components/ui/icons';
import { LivingFlame } from '@/components/ui/living-flame';
import { useThemeColors } from '@/theme/colors';
import { DURATION, EASE_OUT, SPRING_POP } from '@/theme/motion';

const SIZE = 112;
const STROKE = 10;
const RADIUS = (SIZE - STROKE) / 2;
const CENTER = SIZE / 2;
/** Separación entre segmentos, en grados (los extremos redondeados se comen parte). */
const GAP_DEGREES = 26;
const FLARE_DURATION = 520;
/** Con racha viva, la llama de marca (a color) es un poco más grande que la brasa apagada. */
const FLAME_SIZE = 42;

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

/** El trazo del segmento `index` de `total`, o null si es un anillo entero. */
function segmentPath(index: number, total: number): string | null {
  if (total <= 1) return null;
  const segment = 360 / total;
  return arcPath(index * segment + GAP_DEGREES / 2, (index + 1) * segment - GAP_DEGREES / 2);
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
  const gradientId = `hearth-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  // La llama se aviva al abrir Hoy (1) y cada vez que se enciende un segmento; desmarcar no la
  // mueve. Se compara con el render anterior durante el render (estado derivado, sin efecto).
  const [ignition, setIgnition] = useState({ done, count: 1 });
  if (ignition.done !== done) {
    setIgnition({ done, count: done > ignition.done ? ignition.count + 1 : ignition.count });
  }
  // Destello del segmento recién encendido (o del anillo entero al completar la meta).
  const flare = useSharedValue(1);
  const ember = useSharedValue(1);
  const previousDone = useRef(done);

  useEffect(() => {
    const before = previousDone.current;
    previousDone.current = done;
    if (done <= before) return;
    const isGoalMet = done >= total;
    flare.set(0);
    flare.set(withTiming(1, { duration: FLARE_DURATION, easing: EASE_OUT }));
    ember.set(
      withSequence(
        withTiming(isGoalMet ? 1.35 : 1.18, { duration: DURATION.fast, easing: EASE_OUT }),
        withSpring(1, SPRING_POP),
      ),
    );
  }, [done, total, flare, ember]);

  const stroke = (isLit: boolean) => ({
    fill: 'none',
    stroke: isLit ? `url(#${gradientId})` : colors.border,
    strokeWidth: STROKE,
    strokeLinecap: 'round' as const,
  });

  const emberStyle = useAnimatedStyle(() => ({ transform: [{ scale: ember.value }] }));

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={`${done} de ${total} hábitos principales cumplidos`}
      accessibilityValue={{ min: 0, max: total, now: done }}
      style={{ width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={SIZE} height={SIZE} style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.ember} />
            <Stop offset="1" stopColor={colors.emberGlow} />
          </LinearGradient>
        </Defs>
        {total <= 1 ? (
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} {...stroke(total === 1 && done === 1)} />
        ) : (
          Array.from({ length: total }, (_, index) => (
            <Path key={index} d={segmentPath(index, total) ?? ''} {...stroke(index < done)} />
          ))
        )}
      </Svg>
      <Flare total={total} done={done} color={colors.ember} progress={flare} />
      <Animated.View style={emberStyle}>
        {isStreakAlive ? (
          <LivingFlame size={FLAME_SIZE} burst={ignition.count} />
        ) : (
          <EmberIcon size={40} color={colors.inkFaint} />
        )}
      </Animated.View>
    </View>
  );
}

/**
 * Halo que se expande y se apaga sobre lo que acaba de encenderse: el último segmento, o el anillo
 * entero cuando se cumplen todos los principales.
 */
function Flare({
  total,
  done,
  color,
  progress,
}: {
  total: number;
  done: number;
  color: string;
  progress: SharedValue<number>;
}) {
  const style = useAnimatedStyle(() => ({
    opacity: progress.value >= 1 ? 0 : interpolate(progress.value, [0, 0.15, 1], [0, 0.9, 0]),
    transform: [{ scale: interpolate(progress.value, [0, 1], [1, 1.16]) }],
  }));
  const isWholeRing = done >= total || total <= 1;
  const path = isWholeRing ? null : segmentPath(Math.max(0, done - 1), total);
  const flareStroke = {
    fill: 'none',
    stroke: color,
    strokeWidth: STROKE + 6,
    strokeLinecap: 'round' as const,
    strokeOpacity: 0.55,
  };
  return (
    <Animated.View
      pointerEvents="none"
      style={[{ position: 'absolute', top: 0, left: 0, width: SIZE, height: SIZE }, style]}
    >
      <Svg width={SIZE} height={SIZE}>
        {path === null ? (
          <Circle cx={CENTER} cy={CENTER} r={RADIUS} {...flareStroke} />
        ) : (
          <Path d={path} {...flareStroke} />
        )}
      </Svg>
    </Animated.View>
  );
}
