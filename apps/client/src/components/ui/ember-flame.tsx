import { useId } from 'react';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { useThemeColors } from '@/theme/colors';

/** El glifo de `EmberIcon`, en el degradado de marca: la brasa grande de los momentos de logro. */
export function EmberFlame({ size }: { size: number }) {
  const colors = useThemeColors();
  // `useId` trae dos puntos, que no sirven dentro de `url(#…)`.
  const gradientId = `ember-flame-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  return (
    <Svg width={size} height={size} viewBox="6 1.5 12 16">
      <Defs>
        <LinearGradient id={gradientId} x1="0.2" y1="0" x2="0.8" y2="1">
          <Stop offset="0" stopColor={colors.ember} />
          <Stop offset="1" stopColor={colors.emberGlow} />
        </LinearGradient>
      </Defs>
      <Path
        d="M12 2.4c.5 2.3-1 3.6-2.1 5-1.2 1.5-1.9 2.9-1.9 4.9a4 4 0 008 0c0-1-.3-1.9-.8-2.6.2.8 0 1.7-.9 2-.9.3-1.5-.5-1.2-1.3.7-1.7 1.9-2.2 1.9-4.3 0-1.6-1.2-3-3-3.7z"
        fill={`url(#${gradientId})`}
      />
    </Svg>
  );
}
