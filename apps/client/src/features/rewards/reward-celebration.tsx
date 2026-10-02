// El momento de canjear una recompensa: un logro que se festeja a pantalla completa. El trofeo cae
// y rebota, giran rayos detrás, llueve confeti y el saldo rueda a lo que queda. Una sola secuencia;
// todo termina quieto.
import type { RewardRecord } from '@ascua/shared';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, Polygon, RadialGradient, Stop } from 'react-native-svg';

import { Button } from '@/components/ui/button';
import { Confetti } from '@/components/ui/confetti';
import { StarIcon } from '@/components/ui/icons';
import { RollingNumber } from '@/components/ui/rolling-number';
import { Sparks } from '@/components/ui/sparks';
import { useTrophies } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { celebrationFeedback, tapFeedback } from '@/features/celebration/haptics';
import { playSound } from '@/features/sounds/sounds';
import { TrophyEmblem } from '@/features/trophies/trophy-emblem';
import { useThemeColors } from '@/theme/colors';
import { DURATION, EASE_OUT, SPRING_POP } from '@/theme/motion';

/** Cuándo pasa cada cosa, en ms desde que se abre. */
const TIMING = { rays: 60, trophy: 140, burst: 340, title: 520, balance: 800, tada: 980 } as const;
const TROPHY_SIZE = 132;
const RAYS_SIZE = 340;
const RAY_COUNT = 16;
/** Los rayos giran un cuarto de vuelta y se detienen. */
const RAYS_TURN_MS = 7000;

interface RewardCelebrationProps {
  reward: RewardRecord;
  /** Puntos para gastar antes y después del canje: el saldo rueda de uno al otro. */
  balanceBefore: number;
  balanceAfter: number;
  onClose: () => void;
  /** "Ver mi vitrina": cierra y lleva a los premios conseguidos. */
  onOpenTrophies: () => void;
}

export function RewardCelebration({
  reward,
  balanceBefore,
  balanceAfter,
  onClose,
  onOpenTrophies,
}: RewardCelebrationProps) {
  const colors = useThemeColors();
  const uid = useUid();
  const { top, bottom } = useSafeAreaInsets();
  const trophies = useTrophies(uid);
  const [burst, setBurst] = useState(0);
  const [shownBalance, setShownBalance] = useState(balanceBefore);
  const rays = useSharedValue(0);
  const turn = useSharedValue(0);
  const trophy = useSharedValue(0);
  const ring = useSharedValue(0);
  const tada = useSharedValue(0);
  const title = useSharedValue(0);
  const details = useSharedValue(0);

  useEffect(() => {
    rays.set(withDelay(TIMING.rays, withTiming(1, { duration: 500, easing: EASE_OUT })));
    turn.set(withDelay(TIMING.rays, withTiming(1, { duration: RAYS_TURN_MS, easing: EASE_OUT })));
    trophy.set(withDelay(TIMING.trophy, withSpring(1, SPRING_POP)));
    ring.set(withDelay(TIMING.burst, withTiming(1, { duration: 760, easing: EASE_OUT })));
    title.set(withDelay(TIMING.title, withSpring(1, SPRING_POP)));
    details.set(
      withDelay(TIMING.balance, withTiming(1, { duration: DURATION.slow, easing: EASE_OUT })),
    );
    // "Tada": el trofeo se sacude de lado a lado y queda quieto.
    tada.set(
      withDelay(
        TIMING.tada,
        withSequence(
          withTiming(-1, { duration: 90 }),
          withTiming(1, { duration: 130 }),
          withTiming(-0.6, { duration: 120 }),
          withTiming(0.4, { duration: 110 }),
          withTiming(0, { duration: 100 }),
        ),
      ),
    );
    const burstTimer = setTimeout(() => {
      celebrationFeedback();
      playSound('reward');
      setBurst(1);
    }, TIMING.burst);
    const balanceTimer = setTimeout(() => setShownBalance(balanceAfter), TIMING.balance + 150);
    const tadaTimer = setTimeout(tapFeedback, TIMING.tada);
    return () => {
      clearTimeout(burstTimer);
      clearTimeout(balanceTimer);
      clearTimeout(tadaTimer);
    };
  }, [balanceAfter, rays, turn, trophy, ring, title, details, tada]);

  const raysStyle = useAnimatedStyle(() => ({
    opacity: rays.value,
    transform: [
      { scale: interpolate(rays.value, [0, 1], [0.5, 1]) },
      { rotate: `${turn.value * 90}deg` },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(trophy.value, [0, 1], [0, 0.18], 'clamp'),
    transform: [{ scale: interpolate(trophy.value, [0, 1], [0.5, 1]) }],
  }));
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value <= 0 || ring.value >= 1 ? 0 : interpolate(ring.value, [0, 1], [0.7, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.7, 1.7]) }],
  }));
  // El trofeo cae desde arriba, rebota al llegar y después se sacude.
  const trophyStyle = useAnimatedStyle(() => ({
    opacity: interpolate(trophy.value, [0, 0.25], [0, 1], 'clamp'),
    transform: [
      { translateY: interpolate(trophy.value, [0, 1], [-150, 0]) },
      { scale: interpolate(trophy.value, [0, 1], [0.45, 1]) },
      { rotate: `${tada.value * 9}deg` },
    ],
  }));
  const titleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(title.value, [0, 0.4], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(title.value, [0, 1], [0.7, 1]) }],
  }));
  const detailsStyle = useAnimatedStyle(() => ({
    opacity: details.value,
    transform: [{ translateY: (1 - details.value) * 14 }],
  }));

  const total = trophies.data.length;
  const circle = { position: 'absolute' as const, width: 176, height: 176, borderRadius: 88 };
  return (
    <View
      accessibilityViewIsModal
      className="bg-surface-100 flex-1 items-center px-6"
      style={{ paddingTop: top + 24, paddingBottom: bottom + 24 }}
    >
      <View className="w-full max-w-sm flex-1 items-center justify-center gap-3">
        <View style={{ width: 280, height: 220, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[{ position: 'absolute' }, raysStyle]}>
            <Rays color={colors.emberGlow} />
          </Animated.View>
          <Animated.View style={[circle, { backgroundColor: colors.ember }, glowStyle]} />
          <Animated.View
            style={[circle, { borderWidth: 3, borderColor: colors.ember }, ringStyle]}
          />
          <Sparks burst={burst} radius={140} count={24} size={10} />
          <Animated.View style={trophyStyle}>
            {/* Aro blanco con sombra cálida: el trofeo se despega de los rayos. */}
            <View
              className="bg-surface-200 rounded-full p-1.5"
              style={{
                shadowColor: colors.shadowWarm,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: 0.3,
                shadowRadius: 18,
                elevation: 8,
              }}
            >
              <TrophyEmblem tier={reward.tier} size={TROPHY_SIZE} />
            </View>
          </Animated.View>
        </View>

        <Animated.View style={titleStyle}>
          <View
            accessible
            accessibilityRole="header"
            accessibilityLabel={`¡Te lo ganaste! Canjeaste ${reward.name}`}
            className="items-center gap-1"
          >
            <Text className="font-heading-extrabold text-display-md text-ember-strong text-center">
              ¡Te lo ganaste!
            </Text>
            <Text className="font-heading text-heading-md text-ink text-center">{reward.name}</Text>
          </View>
        </Animated.View>

        <Animated.View style={[{ width: '100%' }, detailsStyle]}>
          <View className="mt-3 w-full items-center gap-4">
            <View className="bg-surface-200 w-full flex-row items-center justify-between rounded-md px-4 py-3">
              <Text className="font-body text-body text-ink-muted">
                −{reward.cost} pts · te quedan
              </Text>
              <View className="flex-row items-baseline gap-1">
                <RollingNumber
                  value={shownBalance}
                  lineHeight={28}
                  className="font-heading-extrabold text-heading-lg text-ink leading-[28px]"
                />
                <Text className="font-body-bold text-body text-ink">pts</Text>
              </View>
            </View>
            {total > 0 && (
              <View className="bg-warning-soft flex-row items-center gap-1.5 rounded-full px-3 py-1.5">
                <StarIcon size={14} color={colors.emberStrong} />
                <Text className="font-body-bold text-caption text-ember-strong">
                  {total === 1
                    ? 'Tu primer premio conseguido'
                    : `Ya son ${total} premios conseguidos`}
                </Text>
              </View>
            )}
            <Text className="font-body text-body text-ink-muted text-center">
              Queda guardado en tu vitrina. Cuando lo disfrutes, ábrelo ahí y márcalo como
              utilizado.
            </Text>
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[{ width: '100%', maxWidth: 384 }, detailsStyle]}>
        <View className="gap-2">
          <Button label="Ver mi vitrina" onPress={onOpenTrophies} />
          <Button label="Seguir" variant="secondary" onPress={onClose} />
        </View>
      </Animated.View>

      {/* Encima de todo: los papelitos caen por delante, sin tapar los toques. */}
      <Confetti burst={burst} />
    </View>
  );
}

/** Rayos que salen del centro y se desvanecen hacia afuera, como un sol detrás del trofeo. */
function Rays({ color }: { color: string }) {
  const center = RAYS_SIZE / 2;
  const halfWidth = (Math.PI / RAY_COUNT) * 0.36;
  const point = (angle: number, radius: number) =>
    `${center + Math.cos(angle) * radius},${center + Math.sin(angle) * radius}`;
  return (
    <Svg width={RAYS_SIZE} height={RAYS_SIZE}>
      <Defs>
        <RadialGradient id="rays" cx={center} cy={center} r={center} gradientUnits="userSpaceOnUse">
          <Stop offset="0.35" stopColor={color} stopOpacity={0.75} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      {Array.from({ length: RAY_COUNT }, (_, index) => {
        const angle = (index / RAY_COUNT) * 2 * Math.PI;
        // Uno largo y uno corto: se lee como destello, no como rueda.
        const radius = center * (index % 2 === 0 ? 1 : 0.8);
        return (
          <Polygon
            key={index}
            points={`${center},${center} ${point(angle - halfWidth, radius)} ${point(angle + halfWidth, radius)}`}
            fill="url(#rays)"
          />
        );
      })}
    </Svg>
  );
}
