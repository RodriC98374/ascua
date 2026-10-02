import type { RewardTier } from '@ascua/shared';
import { LinearGradient } from 'expo-linear-gradient';
import Gift from 'lucide-react-native/icons/gift';
import Medal from 'lucide-react-native/icons/medal';
import Trophy from 'lucide-react-native/icons/trophy';
import { View } from 'react-native';

import { CheckIcon } from '@/components/ui/icons';
import { useThemeColors, type ThemeColors } from '@/theme/colors';

const ICONS = { small: Gift, medium: Medal, large: Trophy };

/** Fondo y trazo de cada nivel: los mismos tonos que su etiqueta; la grande, con la brasa. */
function tierTones(tier: RewardTier, colors: ThemeColors) {
  if (tier === 'small') return { fill: colors.weekVerdeSoft, ink: colors.weekVerde };
  if (tier === 'medium') return { fill: colors.weekAzulSoft, ink: colors.weekAzul };
  return { fill: null, ink: colors.inkOnFill };
}

interface TrophyEmblemProps {
  tier: RewardTier;
  size: number;
  /** Usado: lleva una marca de visto en la esquina. */
  isUsed?: boolean;
}

/** Medallón de un premio conseguido: regalo, medalla o trofeo según el nivel de la recompensa. */
export function TrophyEmblem({ tier, size, isUsed = false }: TrophyEmblemProps) {
  const colors = useThemeColors();
  const tones = tierTones(tier, colors);
  const Icon = ICONS[tier];
  const circle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    alignItems: 'center',
    justifyContent: 'center',
  } as const;
  const icon = <Icon size={size * 0.48} color={tones.ink} strokeWidth={2} />;
  const badge = Math.round(size * 0.36);

  return (
    <View>
      {tones.fill ? (
        <View style={[circle, { backgroundColor: tones.fill }]}>{icon}</View>
      ) : (
        <LinearGradient
          colors={colors.emberGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={circle}
        >
          {icon}
        </LinearGradient>
      )}
      {isUsed && (
        <View
          className="bg-success-fill border-surface-200 items-center justify-center rounded-full border-2"
          style={{ position: 'absolute', right: -2, bottom: -2, width: badge, height: badge }}
        >
          <CheckIcon size={badge * 0.55} color={colors.onSuccess} />
        </View>
      )}
    </View>
  );
}
