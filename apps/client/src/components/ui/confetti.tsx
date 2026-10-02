import { useEffect } from 'react';
import { useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useThemeColors } from '@/theme/colors';

/** Lo que tarda en caer toda la lluvia. */
const RAIN_DURATION = 3200;
/** Parte del tiempo en que van saliendo papelitos: el resto es la caída del último. */
const LAUNCH_WINDOW = 0.4;

interface ConfettiProps {
  /** Cada vez que cambia cae una lluvia; 0 = todavía ninguna. */
  burst: number;
  count?: number;
}

/** Fracción 0..1 estable para cada papelito: se ve desordenado sin usar azar (misma lluvia siempre). */
function spread(index: number, salt: number): number {
  const value = Math.sin(index * 12.9898 + salt * 78.233) * 43758.5453;
  return value - Math.floor(value);
}

/**
 * Lluvia de papelitos de colores sobre toda la pantalla, de una sola pasada. Solo para un logro
 * grande (canjear una recompensa). Va dentro de un contenedor que ocupe la pantalla; no recibe
 * toques.
 */
export function Confetti({ burst, count = 64 }: ConfettiProps) {
  const colors = useThemeColors();
  const { width, height } = useWindowDimensions();
  const progress = useSharedValue(1);

  useEffect(() => {
    if (burst === 0) return;
    progress.set(0);
    progress.set(withTiming(1, { duration: RAIN_DURATION, easing: Easing.linear }));
  }, [burst, progress]);

  const tones = [
    colors.ember,
    colors.emberGlow,
    colors.weekMorado,
    colors.weekAzul,
    colors.weekTurquesa,
    colors.weekRosa,
    colors.weekVerde,
  ];
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, overflow: 'hidden' }}
    >
      {Array.from({ length: count }, (_, index) => (
        <Piece
          key={index}
          progress={progress}
          delay={spread(index, 1) * LAUNCH_WINDOW}
          x={spread(index, 2) * width}
          sway={(spread(index, 3) - 0.5) * 90}
          swings={1 + spread(index, 4) * 2}
          turns={(spread(index, 5) - 0.5) * 6}
          flips={2 + spread(index, 6) * 5}
          fall={height + 60}
          size={7 + spread(index, 7) * 6}
          isRound={index % 5 === 0}
          color={tones[index % tones.length] ?? colors.ember}
        />
      ))}
    </View>
  );
}

interface PieceProps {
  progress: SharedValue<number>;
  /** Cuándo sale, como fracción del total. */
  delay: number;
  x: number;
  /** Vaivén a los lados, en px, y cuántas veces lo hace en la caída. */
  sway: number;
  swings: number;
  /** Vueltas sobre sí mismo y volteretas (se ve de canto) en la caída. */
  turns: number;
  flips: number;
  fall: number;
  size: number;
  isRound: boolean;
  color: string;
}

function Piece({
  progress,
  delay,
  x,
  sway,
  swings,
  turns,
  flips,
  fall,
  size,
  isRound,
  color,
}: PieceProps) {
  const style = useAnimatedStyle(() => {
    // Avance propio de este papelito: 0 al salir, 1 al llegar abajo.
    const own = interpolate(progress.value, [delay, delay + 1 - LAUNCH_WINDOW], [0, 1], 'clamp');
    return {
      opacity: own <= 0 || own >= 1 ? 0 : interpolate(own, [0, 0.05, 0.85, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: x + sway * Math.sin(own * Math.PI * swings) },
        // Cae un poco más rápido al final, como algo liviano que toma velocidad.
        { translateY: -30 + fall * (0.55 * own + 0.45 * own * own) },
        { rotate: `${own * turns * 360}deg` },
        { scaleY: Math.cos(own * Math.PI * flips) },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          top: 0,
          left: 0,
          width: size,
          height: isRound ? size : size * 1.7,
          borderRadius: isRound ? size / 2 : 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
