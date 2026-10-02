import { formatLongDate, type RewardRedemption } from '@ascua/shared';
import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparks } from '@/components/ui/sparks';
import { useUid } from '@/features/auth/session';
import { celebrationFeedback } from '@/features/celebration/haptics';
import { RewardChip } from '@/features/rewards/reward-chip';
import { playSound } from '@/features/sounds/sounds';
import { db } from '@/lib/firebase';
import { markTrophyUsed } from '@/operations/trophies';
import { useThemeColors } from '@/theme/colors';
import { SPRING_POP } from '@/theme/motion';

import { TrophyEmblem } from './trophy-emblem';

interface TrophyCardProps {
  /** El canje, leído en vivo: al marcarlo, `usedDateKey` llega solo. */
  trophy: RewardRedemption;
  onClose: () => void;
}

/**
 * Tarjeta de un premio conseguido: qué fue, cuándo y cuánto costó. Si falta usarlo, "Utilizado" lo
 * marca (una sola vez) y lo celebra: el medallón rebota y saltan chispas.
 */
export function TrophyCard({ trophy, onClose }: TrophyCardProps) {
  const colors = useThemeColors();
  const uid = useUid();
  const [celebration, setCelebration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const isUsed = trophy.usedDateKey !== null;
  const { name, tier, cost } = trophy.rewardSnapshot;

  // Al abrirse, el medallón aparece con un rebote; al marcarlo "Utilizado", rebota otra vez.
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.set(0);
    pop.set(withSpring(1, SPRING_POP));
  }, [celebration, pop]);
  const popStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pop.value, [0, 1], [0.6, 1]) }],
  }));

  function markUsed() {
    setError(null);
    // La marca se ve al instante (también sin conexión): se celebra sin esperar al servidor.
    setCelebration((count) => count + 1);
    celebrationFeedback();
    playSound('chime');
    markTrophyUsed(db, uid, trophy.id).catch(() =>
      setError('No pudimos marcarlo como utilizado. Vuelve a intentarlo.'),
    );
  }

  return (
    <Modal
      transparent
      visible
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-center px-4">
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={onClose}
          style={{ position: 'absolute', inset: 0, backgroundColor: colors.scrim }}
        />
        <View accessibilityViewIsModal className="w-full max-w-sm">
          <Card className="items-center gap-4 pt-7">
            <View>
              <Animated.View style={popStyle}>
                <TrophyEmblem tier={tier} size={88} isUsed={isUsed} />
              </Animated.View>
              <Sparks burst={celebration} radius={88} count={18} size={8} />
            </View>

            <View className="items-center gap-2">
              <Text
                accessibilityRole="header"
                className="font-heading text-heading-lg text-ink text-center"
              >
                {celebration > 0 ? '¡A disfrutarlo!' : name}
              </Text>
              {celebration > 0 ? (
                <Text className="font-body text-body text-ink-muted text-center">
                  “{name}” queda en tu vitrina como utilizado.
                </Text>
              ) : (
                <View className="self-center">
                  <RewardChip tier={tier} />
                </View>
              )}
            </View>

            <View className="bg-surface-300 w-full gap-1 rounded-md px-4 py-3">
              <Text className="font-body text-body text-ink">
                Lo conseguiste el {formatLongDate(trophy.dateKey).toLowerCase()}
              </Text>
              <Text className="font-body text-caption text-ink-muted">
                Te costó {cost} pts{trophy.note ? ` · ${trophy.note}` : ''}
              </Text>
            </View>

            {isUsed && trophy.usedDateKey && (
              <View className="bg-success-soft self-stretch rounded-md px-4 py-2.5">
                <Text className="font-body-bold text-caption text-success text-center">
                  Utilizado el {formatLongDate(trophy.usedDateKey).toLowerCase()}
                </Text>
              </View>
            )}

            {error && (
              <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
                {error}
              </Text>
            )}

            <View className="w-full gap-2">
              {!isUsed && (
                <>
                  <Button label="Utilizado" onPress={markUsed} />
                  <Text className="font-body text-caption text-ink-muted text-center">
                    Márcalo cuando lo disfrutes. No se puede deshacer.
                  </Text>
                </>
              )}
              <Button
                label={isUsed ? 'Listo' : 'Cerrar'}
                variant={isUsed ? 'primary' : 'secondary'}
                onPress={onClose}
              />
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  );
}
