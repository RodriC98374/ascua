// La llama de marca, viva: el glifo de `EmberIcon` en el degradado de marca y un núcleo más claro,
// que se estiran y se mecen desde la base a ritmos distintos. Las ondas son sumas de senos con frecuencias enteras
// dentro de un ciclo largo, así que el bucle no tiene salto y no se nota que se repite. Solo
// `transform` y `opacity`; con "reducir movimiento" queda quieta.
import { useEffect, useId } from 'react';
import { View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useThemeColors } from '@/theme/colors';
import { EASE_OUT } from '@/theme/motion';

const VIEW_BOX = '6 1.5 12 16';
const OUTER_PATH =
  'M12 2.4c.5 2.3-1 3.6-2.1 5-1.2 1.5-1.9 2.9-1.9 4.9a4 4 0 008 0c0-1-.3-1.9-.8-2.6.2.8 0 1.7-.9 2-.9.3-1.5-.5-1.2-1.3.7-1.7 1.9-2.2 1.9-4.3 0-1.6-1.2-3-3-3.7z';
/** Lengua interior, apoyada en la base redonda de la silueta. */
const CORE_PATH =
  'M11.6 8.9c.3 1.3-.5 2-1.1 2.8-.5.6-.8 1.2-.8 1.9a2.1 2.1 0 004.2 0c0-1.2-.8-2-1.4-2.9-.4-.5-.8-1-.9-1.8z';
/** La base de la llama, cerca del borde inferior del lienzo: desde ahí se estira y se mece. */
const BASE_ORIGIN = '50% 92%';

/** Ciclo del reloj: las frecuencias son vueltas enteras dentro de él. */
const CYCLE_MS = 6000;
/** Una ráfaga: se aviva enseguida, sostiene y se calma. */
const BURST = { rise: 180, hold: 900, settle: 1300 } as const;
const BURST_MS = BURST.rise + BURST.hold + BURST.settle;

interface LivingFlameProps {
  size: number;
  /** Se mueve mientras está en pantalla. Solo para la celebración, el momento grande del día. */
  isContinuous?: boolean;
  /**
   * Fuera del modo continuo, cada cambio la aviva un par de segundos y la deja quieta. El valor
   * inicial también, si no es 0 (al abrir la pantalla).
   */
  burst?: number;
}

export function LivingFlame({ size, isContinuous = false, burst = 0 }: LivingFlameProps) {
  const colors = useThemeColors();
  const gradientId = `living-flame-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const isReducedMotion = useReducedMotion();
  const clock = useSharedValue(0);
  // Cuánto se mueve: 0 = quieta, 1 = llama viva.
  const energy = useSharedValue(0);

  useEffect(() => {
    if (!isContinuous || isReducedMotion) return;
    clock.set(0);
    clock.set(
      withRepeat(withTiming(CYCLE_MS, { duration: CYCLE_MS, easing: Easing.linear }), -1, false),
    );
    energy.set(withTiming(1, { duration: BURST.rise, easing: EASE_OUT }));
    return () => {
      cancelAnimation(clock);
      cancelAnimation(energy);
    };
  }, [isContinuous, isReducedMotion, clock, energy]);

  useEffect(() => {
    if (isContinuous || isReducedMotion || burst === 0) return;
    clock.set(0);
    clock.set(withTiming(BURST_MS, { duration: BURST_MS, easing: Easing.linear }));
    energy.set(
      withSequence(
        withTiming(1, { duration: BURST.rise, easing: EASE_OUT }),
        withDelay(BURST.hold, withTiming(0, { duration: BURST.settle, easing: EASE_OUT })),
      ),
    );
  }, [burst, isContinuous, isReducedMotion, clock, energy]);

  const outerStyle = useAnimatedStyle(() => {
    const wave = (turns: number, phase: number) =>
      Math.sin((2 * Math.PI * turns * clock.value) / CYCLE_MS + phase);
    const stretch = energy.value * (0.035 * wave(7, 0) + 0.02 * wave(17, 1.3));
    const sway = energy.value * (2.4 * wave(5, 0.4) + 1.2 * wave(13, 2.1));
    return {
      transform: [{ scaleY: 1 + stretch }, { scaleX: 1 - stretch * 0.5 }, { skewX: `${sway}deg` }],
    };
  });

  const coreStyle = useAnimatedStyle(() => {
    const wave = (turns: number, phase: number) =>
      Math.sin((2 * Math.PI * turns * clock.value) / CYCLE_MS + phase);
    const stretch = energy.value * (0.09 * wave(11, 0.7) + 0.05 * wave(19, 0));
    return {
      opacity: 0.95 - energy.value * 0.08 * (1 + wave(23, 0.9)),
      transform: [
        { translateX: energy.value * size * 0.012 * wave(9, 1.1) },
        { scaleY: 1 + stretch },
        { scaleX: 1 - stretch * 0.4 },
      ],
    };
  });

  const layer = { position: 'absolute' as const, width: size, height: size };
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={[layer, { transformOrigin: BASE_ORIGIN }, outerStyle]}>
        <Svg width={size} height={size} viewBox={VIEW_BOX}>
          <Defs>
            <LinearGradient id={gradientId} x1="0.2" y1="0" x2="0.8" y2="1">
              <Stop offset="0" stopColor={colors.ember} />
              <Stop offset="1" stopColor={colors.emberGlow} />
            </LinearGradient>
          </Defs>
          <Path d={OUTER_PATH} fill={`url(#${gradientId})`} />
        </Svg>
        {/* Dentro de la silueta: hereda su vaivén y suma el propio, sin salirse de ella. */}
        <Animated.View style={[layer, { transformOrigin: BASE_ORIGIN }, coreStyle]}>
          <Svg width={size} height={size} viewBox={VIEW_BOX}>
            <Path d={CORE_PATH} fill={colors.emberGlow} />
          </Svg>
        </Animated.View>
      </Animated.View>
    </View>
  );
}
