import { REDEMPTION_NOTE_MAX_LENGTH, type RewardRecord } from '@ascua/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useUid } from '@/features/auth/session';
import { TrophyEmblem } from '@/features/trophies/trophy-emblem';
import { db } from '@/lib/firebase';
import { redeemReward } from '@/operations/spending';
import { useThemeColors } from '@/theme/colors';

import { spendErrorMessage } from './reward-catalog';
import { RewardCelebration } from './reward-celebration';
import { RewardChip } from './reward-chip';
import { newRequestId } from './request-id';

interface RedeemSheetProps {
  reward: RewardRecord;
  /**
   * Los puntos que puede usar este canje: lo libre o, para la recompensa de la alcancía, el saldo
   * entero (la alcancía se vacía con el canje).
   */
  availablePoints: number;
  onClose: () => void;
}

/**
 * Hoja de canje: el momento consciente de "me lo gané". Se monta al abrirse, así cada apertura
 * es un intento nuevo con su propio ID; los reintentos dentro de la hoja reutilizan ese ID. Al
 * confirmarse, la hoja deja paso a la celebración a pantalla completa.
 */
export function RedeemSheet({ reward, availablePoints, onClose }: RedeemSheetProps) {
  const colors = useThemeColors();
  const uid = useUid();
  const { bottom } = useSafeAreaInsets();
  const [requestId] = useState(newRequestId);
  const [note, setNote] = useState('');
  const [isRedeeming, setIsRedeeming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newBalance, setNewBalance] = useState<number | null>(null);

  async function redeem() {
    setIsRedeeming(true);
    setError(null);
    try {
      await redeemReward(db, uid, { requestId, rewardId: reward.id, note });
      setNewBalance(availablePoints - reward.cost);
    } catch (redeemError) {
      setError(spendErrorMessage(redeemError));
    } finally {
      setIsRedeeming(false);
    }
  }

  const close = () => {
    if (!isRedeeming) onClose();
  };

  if (newBalance !== null) {
    return (
      <Modal
        visible
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={onClose}
      >
        <RewardCelebration
          reward={reward}
          balanceBefore={availablePoints}
          balanceAfter={newBalance}
          onClose={onClose}
          onOpenTrophies={() => {
            onClose();
            router.push('/recompensas/trofeos');
          }}
        />
      </Modal>
    );
  }

  return (
    <Modal
      transparent
      visible
      animationType="slide"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={close}
    >
      <View className="flex-1 items-center justify-end">
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={close}
          style={{ position: 'absolute', inset: 0, backgroundColor: colors.scrim }}
        />
        <View
          accessibilityViewIsModal
          className="bg-surface-200 w-full max-w-[480px] gap-5 rounded-t-xl px-5 pt-7"
          style={{
            paddingBottom: bottom + 24,
            shadowColor: colors.shadowWarm,
            shadowOffset: { width: 0, height: -6 },
            shadowOpacity: 0.25,
            shadowRadius: 20,
            elevation: 12,
          }}
        >
          <View className="items-center gap-3">
            <TrophyEmblem tier={reward.tier} size={56} />
            <View className="items-center gap-1">
              <Text
                accessibilityRole="header"
                className="font-heading text-heading-lg text-ink text-center"
              >
                ¿Canjear “{reward.name}”?
              </Text>
              <View className="self-center">
                <RewardChip tier={reward.tier} />
              </View>
            </View>
          </View>

          <View className="bg-surface-300 flex-row items-center justify-between rounded-md px-4 py-3">
            <Text className="font-body text-body text-ink-muted">
              −{reward.cost} pts · te quedarán para gastar
            </Text>
            <Text className="font-body-extrabold text-body text-ink">
              {availablePoints - reward.cost} pts
            </Text>
          </View>

          <TextField
            label="Nota (opcional)"
            value={note}
            onChangeText={setNote}
            maxLength={REDEMPTION_NOTE_MAX_LENGTH}
            placeholder="Ej.: con amigos, el sábado"
            autoCapitalize="sentences"
          />
          {error && (
            <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
              {error}
            </Text>
          )}
          <View className="flex-row gap-2">
            <View className="flex-1">
              <Button
                label="Cancelar"
                variant="secondary"
                isDisabled={isRedeeming}
                onPress={close}
              />
            </View>
            <View className="flex-1">
              <Button label="Canjear" isLoading={isRedeeming} onPress={redeem} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}
