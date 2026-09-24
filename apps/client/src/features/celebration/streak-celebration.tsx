// El momento grande del día: al cumplir todos los principales, la brasa se enciende a pantalla
// completa, el número de la racha sube y hoy se enciende en la semana. Una sola secuencia
// orquestada; el resto de la app es calma.
import { PERFECT_DAY_BONUS, periodContaining, type DateKey } from '@ascua/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Modal, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { EmberFlame } from '@/components/ui/ember-flame';
import { CheckIcon, SnowflakeIcon, StarIcon } from '@/components/ui/icons';
import { RollingNumber } from '@/components/ui/rolling-number';
import { Sparks } from '@/components/ui/sparks';
import { useDailyLogsInRange } from '@/data/hooks';
import { useThemeColors } from '@/theme/colors';
import { DURATION, EASE_OUT, SPRING_POP } from '@/theme/motion';

import { celebrationFeedback } from './haptics';
import { buildStreakWeek, type StreakWeekDay } from './streak-week';
import type { StreakCelebration } from './use-today-moments';

/** Cuándo pasa cada cosa, en ms desde que se abre. */
const TIMING = { flame: 60, burst: 200, number: 460, text: 620, today: 980 } as const;
const FLAME_SIZE = 128;
const DAY_SIZE = 36;

interface StreakCelebrationModalProps {
  uid: string;
  today: DateKey;
  celebration: StreakCelebration | null;
  onClose: () => void;
}

export function StreakCelebrationModal({
  uid,
  today,
  celebration,
  onClose,
}: StreakCelebrationModalProps) {
  return (
    <Modal
      transparent
      visible={celebration !== null}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      {celebration && (
        <CelebrationContent uid={uid} today={today} celebration={celebration} onClose={onClose} />
      )}
    </Modal>
  );
}

function CelebrationContent({
  uid,
  today,
  celebration,
  onClose,
}: {
  uid: string;
  today: DateKey;
  celebration: StreakCelebration;
  onClose: () => void;
}) {
  const colors = useThemeColors();
  const { top, bottom } = useSafeAreaInsets();
  const [shownStreak, setShownStreak] = useState(celebration.from);
  const [sparksBurst, setSparksBurst] = useState(0);
  const flame = useSharedValue(0);
  const ring = useSharedValue(0);
  const text = useSharedValue(0);

  useEffect(() => {
    flame.set(withDelay(TIMING.flame, withSpring(1, SPRING_POP)));
    ring.set(withDelay(TIMING.burst, withTiming(1, { duration: 720, easing: EASE_OUT })));
    text.set(withDelay(TIMING.text, withTiming(1, { duration: DURATION.slow, easing: EASE_OUT })));
    const burstTimer = setTimeout(() => {
      celebrationFeedback();
      setSparksBurst(1);
    }, TIMING.burst);
    const numberTimer = setTimeout(() => setShownStreak(celebration.to), TIMING.number);
    return () => {
      clearTimeout(burstTimer);
      clearTimeout(numberTimer);
    };
  }, [celebration.to, flame, ring, text]);

  const flameStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flame.value, [0, 0.3], [0, 1], 'clamp'),
    transform: [
      { scale: interpolate(flame.value, [0, 1], [0.3, 1]) },
      { rotate: `${interpolate(flame.value, [0, 1], [-14, 0])}deg` },
    ],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity: interpolate(flame.value, [0, 1], [0, 0.16], 'clamp'),
    transform: [{ scale: interpolate(flame.value, [0, 1], [0.5, 1]) }],
  }));
  // Onda que sale de la brasa al encenderse, una sola vez.
  const ringStyle = useAnimatedStyle(() => ({
    opacity: ring.value <= 0 || ring.value >= 1 ? 0 : interpolate(ring.value, [0, 1], [0.7, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [0.7, 1.55]) }],
  }));
  const textStyle = useAnimatedStyle(() => ({
    opacity: text.value,
    transform: [{ translateY: (1 - text.value) * 14 }],
  }));

  const dayWord = celebration.to === 1 ? 'día de racha' : 'días de racha';
  const circle = { position: 'absolute' as const, width: 168, height: 168, borderRadius: 84 };
  return (
    <View
      accessibilityViewIsModal
      className="bg-surface-100 flex-1 items-center px-6"
      style={{ paddingTop: top + 24, paddingBottom: bottom + 24 }}
    >
      <View className="w-full max-w-sm flex-1 items-center justify-center gap-2">
        <View style={{ width: 260, height: 200, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View style={[circle, { backgroundColor: colors.ember }, glowStyle]} />
          <Animated.View
            style={[circle, { borderWidth: 3, borderColor: colors.ember }, ringStyle]}
          />
          <Sparks burst={sparksBurst} radius={120} count={16} size={10} />
          <Animated.View style={flameStyle}>
            <EmberFlame size={FLAME_SIZE} />
          </Animated.View>
        </View>

        <View
          accessible
          accessibilityRole="header"
          accessibilityLabel={`Racha asegurada: ${celebration.to} ${dayWord}`}
          className="items-center"
        >
          <RollingNumber
            value={shownStreak}
            lineHeight={76}
            className="font-heading-extrabold text-ember-strong text-[72px] leading-[76px]"
          />
          <Text className="font-heading text-heading-md text-ink">{dayWord}</Text>
        </View>

        <Animated.View style={[{ width: '100%' }, textStyle]}>
          <View className="mt-5 w-full items-center gap-5">
            <StreakWeekRow uid={uid} today={today} />
            <View className="items-center gap-1">
              <Text className="font-heading text-heading-lg text-ink text-center">
                ¡Racha de hoy asegurada!
              </Text>
              <Text className="font-body text-body text-ink-muted text-center">
                Cumpliste tus principales. Vuelve mañana para mantenerla encendida.
              </Text>
            </View>
            {(celebration.isPerfectDay || celebration.streakBonus > 0) && (
              <View className="flex-row flex-wrap justify-center gap-2">
                {celebration.isPerfectDay && (
                  <Chip label={`Día perfecto · +${PERFECT_DAY_BONUS} pts`} />
                )}
                {celebration.streakBonus > 0 && (
                  <Chip label={`Bono de racha · +${celebration.streakBonus} pts`} />
                )}
              </View>
            )}
          </View>
        </Animated.View>
      </View>

      <Animated.View style={[{ width: '100%', maxWidth: 384 }, textStyle]}>
        <Button label="Seguir" onPress={onClose} />
      </Animated.View>
    </View>
  );
}

/** Lunes a domingo; hoy se enciende al final de la secuencia. Lee a lo sumo 7 días. */
function StreakWeekRow({ uid, today }: { uid: string; today: DateKey }) {
  const { startDateKey } = periodContaining('week', today);
  const logs = useDailyLogsInRange(uid, startDateKey, today);
  const days = buildStreakWeek(today, logs.data);
  return (
    <View className="flex-row justify-center gap-2">
      {days.map((day) => (
        <View key={day.dateKey} className="items-center gap-1.5">
          <Text
            className={`font-body-bold text-caption ${day.state === 'today' ? 'text-ember-strong' : 'text-ink-muted'}`}
          >
            {day.label}
          </Text>
          <WeekDayCircle day={day} />
        </View>
      ))}
    </View>
  );
}

const DAY_LABELS: Record<StreakWeekDay['state'], string> = {
  lit: 'racha sumada',
  frozen: 'protegido',
  missed: 'sin racha',
  empty: 'sin datos',
  today: 'hoy, racha asegurada',
  future: 'todavía no llega',
};

function WeekDayCircle({ day }: { day: StreakWeekDay }) {
  const colors = useThemeColors();
  const ignite = useSharedValue(0);

  useEffect(() => {
    if (day.state === 'today') ignite.set(withDelay(TIMING.today, withSpring(1, SPRING_POP)));
  }, [day.state, ignite]);

  const igniteStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ignite.value, [0, 0.3], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(ignite.value, [0, 1], [0.2, 1]) }],
  }));

  const shape = { width: DAY_SIZE, height: DAY_SIZE, borderRadius: DAY_SIZE / 2 };
  const center = { alignItems: 'center' as const, justifyContent: 'center' as const };
  const litCircle = (
    <LinearGradient
      colors={colors.emberGradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ ...shape, ...center }}
    >
      <CheckIcon size={16} color={colors.inkOnFill} />
    </LinearGradient>
  );

  let content;
  switch (day.state) {
    case 'lit':
      content = litCircle;
      break;
    case 'today':
      content = (
        <View style={{ ...shape, borderWidth: 2, borderColor: colors.emberStrong }}>
          <Animated.View style={[{ position: 'absolute', top: -2, left: -2 }, igniteStyle]}>
            {litCircle}
          </Animated.View>
        </View>
      );
      break;
    case 'frozen':
      content = (
        <View className="bg-protegido-soft" style={{ ...shape, ...center }}>
          <SnowflakeIcon size={16} color={colors.protegido} />
        </View>
      );
      break;
    case 'future':
      content = <View className="border-border border-[1.5px]" style={shape} />;
      break;
    default:
      content = <View className="bg-surface-300" style={shape} />;
  }
  return (
    <View accessible accessibilityLabel={`${day.label}: ${DAY_LABELS[day.state]}`}>
      {content}
    </View>
  );
}

function Chip({ label }: { label: string }) {
  const colors = useThemeColors();
  return (
    <View className="bg-warning-soft flex-row items-center gap-1.5 rounded-full px-3 py-1.5">
      <StarIcon size={14} color={colors.emberStrong} />
      <Text className="font-body-bold text-caption text-ember-strong">{label}</Text>
    </View>
  );
}
