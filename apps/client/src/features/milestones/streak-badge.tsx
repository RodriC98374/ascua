import type { StreakMilestone } from '@ascua/shared';
import { useId } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Polygon, Stop } from 'react-native-svg';

import { useThemeColors } from '@/theme/colors';

const CENTER = 50;

/** Polígono estrellado centrado: `tips` puntas entre el radio exterior y el interior. */
function starPoints(tips: number, outer: number, inner: number): string {
  return Array.from({ length: tips * 2 }, (_, index) => {
    const radius = index % 2 === 0 ? outer : inner;
    const angle = (Math.PI * index) / tips - Math.PI / 2;
    return `${CENTER + radius * Math.cos(angle)},${CENTER + radius * Math.sin(angle)}`;
  }).join(' ');
}

/** Cada hito tiene su forma, más elaborada cuanto más largo: círculo, hexágono y soles. */
const SHAPE_POINTS: Record<Exclude<StreakMilestone, 7>, string> = {
  30: starPoints(3, 45, 45),
  100: starPoints(8, 48, 40),
  365: starPoints(12, 48, 42),
};

interface StreakBadgeProps {
  days: StreakMilestone;
  size: number;
  isEarned: boolean;
}

/** Insignia de un hito de racha: la forma en el degradado de la brasa y el número al centro. */
export function StreakBadge({ days, size, isEarned }: StreakBadgeProps) {
  const colors = useThemeColors();
  const gradientId = `badge-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
  const fill = isEarned ? `url(#${gradientId})` : colors.surface300;
  const outline = {
    stroke: isEarned ? fill : colors.border,
    strokeWidth: 4,
    strokeLinejoin: 'round' as const,
  };

  return (
    <View
      accessible
      accessibilityLabel={`Insignia de ${days} días${isEarned ? '' : ', todavía sin ganar'}`}
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}
    >
      <Svg width={size} height={size} viewBox="0 0 100 100" style={{ position: 'absolute' }}>
        <Defs>
          <LinearGradient id={gradientId} x1="0.15" y1="0" x2="0.85" y2="1">
            <Stop offset="0" stopColor={colors.ember} />
            <Stop offset="1" stopColor={colors.emberGlow} />
          </LinearGradient>
        </Defs>
        {days === 7 ? (
          <Circle cx={CENTER} cy={CENTER} r={44} fill={fill} {...outline} />
        ) : (
          <Polygon points={SHAPE_POINTS[days]} fill={fill} {...outline} />
        )}
        <Circle cx={CENTER} cy={CENTER} r={29} fill={colors.surface200} />
      </Svg>
      <Text
        style={{
          fontFamily: 'Baloo2_800ExtraBold',
          fontSize: Math.round(size * 0.25),
          lineHeight: Math.round(size * 0.3),
          color: isEarned ? colors.emberStrong : colors.inkFaint,
        }}
      >
        {days}
      </Text>
    </View>
  );
}
