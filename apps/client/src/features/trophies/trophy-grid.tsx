import { formatShortDate, type RewardRedemption } from '@ascua/shared';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
} from 'react-native-reanimated';

import { PressableScale } from '@/components/ui/pressable-scale';
import { useThemeColors } from '@/theme/colors';
import { SPRING_POP } from '@/theme/motion';

import { TrophyEmblem } from './trophy-emblem';

const COLUMNS = 3;
const GAP = 12;
/** Retraso entre un bloque y el siguiente al entrar; desde el 12.º entran todos juntos. */
const STAGGER_MS = 45;
const STAGGER_MAX = 12;

interface TrophyGridProps {
  trophies: readonly RewardRedemption[];
  onOpen: (trophy: RewardRedemption) => void;
}

/** Vitrina de premios conseguidos: tres por fila; los que faltan usar, con borde de brasa. */
export function TrophyGrid({ trophies, onOpen }: TrophyGridProps) {
  const [width, setWidth] = useState(0);
  const tileWidth = width > 0 ? (width - GAP * (COLUMNS - 1)) / COLUMNS : 0;

  return (
    <View
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
      className="flex-row flex-wrap"
      style={{ gap: GAP }}
    >
      {tileWidth > 0 &&
        trophies.map((trophy, index) => (
          <TrophyTile
            key={trophy.id}
            trophy={trophy}
            width={tileWidth}
            delay={Math.min(index, STAGGER_MAX) * STAGGER_MS}
            onPress={() => onOpen(trophy)}
          />
        ))}
    </View>
  );
}

interface TrophyTileProps {
  trophy: RewardRedemption;
  width: number;
  delay: number;
  onPress: () => void;
}

function TrophyTile({ trophy, width, delay, onPress }: TrophyTileProps) {
  const colors = useThemeColors();
  const isUsed = trophy.usedDateKey !== null;
  // Entrada: cada bloque aparece y se asienta con un pequeño rebote, uno tras otro.
  const entrance = useSharedValue(0);
  useEffect(() => {
    entrance.set(withDelay(delay, withSpring(1, SPRING_POP)));
  }, [delay, entrance]);
  const entranceStyle = useAnimatedStyle(() => ({
    opacity: interpolate(entrance.value, [0, 0.6], [0, 1], 'clamp'),
    transform: [{ scale: interpolate(entrance.value, [0, 1], [0.7, 1]) }],
  }));

  const name = trophy.rewardSnapshot.name;
  return (
    <Animated.View style={[{ width }, entranceStyle]}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={`${name}, ${isUsed ? 'usado' : 'por usar'}`}
        onPress={onPress}
        className={`bg-surface-200 items-center gap-2 rounded-lg px-2 pb-3 pt-4 ${isUsed ? 'border-border border' : 'border-ember border-2'}`}
        style={{
          shadowColor: isUsed ? colors.shadowNeutral : colors.shadowWarm,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: isUsed ? 0.06 : 0.18,
          shadowRadius: 8,
          elevation: isUsed ? 1 : 3,
        }}
      >
        <TrophyEmblem tier={trophy.rewardSnapshot.tier} size={52} isUsed={isUsed} />
        <Text
          numberOfLines={2}
          className="font-body-bold text-caption text-ink min-h-[32px] text-center"
        >
          {name}
        </Text>
        <Text
          className={`font-body-bold text-label uppercase ${isUsed ? 'text-ink-muted' : 'text-ember-strong'}`}
        >
          {isUsed ? formatShortDate(trophy.dateKey) : 'Por usar'}
        </Text>
      </PressableScale>
    </Animated.View>
  );
}
