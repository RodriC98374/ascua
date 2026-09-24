import { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useThemeColors } from '@/theme/colors';
import { EASE_OUT } from '@/theme/motion';

const BURST_DURATION = 700;

interface SparksProps {
  /** Cada vez que cambia salta una ráfaga; 0 = todavía ninguna. */
  burst: number;
  /** Distancia media que recorren las chispas desde el centro. */
  radius?: number;
  count?: number;
  /** Lado de las chispas chicas; una de cada tres es 1,5 veces más grande. */
  size?: number;
}

/**
 * Chispas de brasa que salen del centro del contenedor (que debe ser relativo) y se apagan. Solo
 * para logros: marcar la racha, el día perfecto, un canje. No reciben toques.
 */
export function Sparks({ burst, radius = 72, count = 10, size = 6 }: SparksProps) {
  const colors = useThemeColors();
  const progress = useSharedValue(1);

  useEffect(() => {
    if (burst === 0) return;
    progress.set(0);
    progress.set(withTiming(1, { duration: BURST_DURATION, easing: EASE_OUT }));
  }, [burst, progress]);

  const tones = [colors.ember, colors.emberGlow, colors.emberStrong];
  return (
    <View
      pointerEvents="none"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {Array.from({ length: count }, (_, index) => (
        <Spark
          key={index}
          progress={progress}
          // Ángulos parejos con un leve desorden, y distancias distintas: se ve orgánico sin azar.
          angle={(index / count) * 2 * Math.PI + (index % 2 === 0 ? -0.12 : 0.18)}
          distance={radius * (0.72 + ((index * 37) % 10) / 28)}
          size={index % 3 === 0 ? size * 1.5 : size}
          color={tones[index % tones.length] ?? colors.ember}
        />
      ))}
    </View>
  );
}

function Spark({
  progress,
  angle,
  distance,
  size,
  color,
}: {
  progress: SharedValue<number>;
  angle: number;
  distance: number;
  size: number;
  color: string;
}) {
  const dx = Math.cos(angle) * distance;
  const dy = Math.sin(angle) * distance;
  const style = useAnimatedStyle(() => {
    const p = progress.value;
    return {
      opacity: p >= 1 ? 0 : interpolate(p, [0, 0.08, 0.6, 1], [0, 1, 1, 0]),
      transform: [
        { translateX: dx * p },
        { translateY: dy * p },
        { rotate: '45deg' },
        { scale: interpolate(p, [0, 1], [1, 0.35]) },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}
