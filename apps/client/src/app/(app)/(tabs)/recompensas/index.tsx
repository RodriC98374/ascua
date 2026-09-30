import { spendablePoints, type RewardRecord } from '@ascua/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { Screen } from '@/components/ui/screen';
import { useGamificationState, useRewards, useSavings } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { FreezeCard } from '@/features/rewards/freeze-card';
import { RedeemSheet } from '@/features/rewards/redeem-sheet';
import { RewardCard } from '@/features/rewards/reward-card';
import { catalogByTier } from '@/features/rewards/reward-catalog';
import { DepositSheet } from '@/features/savings/deposit-sheet';
import { SavingsCard } from '@/features/savings/savings-card';
import { useThemeColors } from '@/theme/colors';

export default function RewardsScreen() {
  const colors = useThemeColors();
  const uid = useUid();
  const gamification = useGamificationState(uid);
  const rewards = useRewards(uid);
  const savings = useSavings(uid);
  const [redeeming, setRedeeming] = useState<RewardRecord | null>(null);
  const [depositingFor, setDepositingFor] = useState<RewardRecord | null>(null);

  const state = gamification.data;
  if (!state || rewards.isLoading || savings.isLoading) {
    return (
      <View className="bg-surface-100 flex-1 items-center justify-center">
        <ActivityIndicator color={colors.emberStrong} size="large" />
      </View>
    );
  }

  const groups = catalogByTier(rewards.data);
  // Alcancía en curso (fase 18): sus puntos siguen en el saldo, pero no se gastan en otra cosa.
  const jar = savings.data?.rewardId ? savings.data : null;
  const jarReward = rewards.data.find((reward) => reward.id === jar?.rewardId);
  const available = spendablePoints(state.pointsBalance, jar);
  const availableFor = (reward: RewardRecord) =>
    reward.id === jar?.rewardId ? state.pointsBalance : available;

  return (
    <View className="flex-1">
      <Screen edges={['top']}>
        <View className="gap-6">
          <View className="flex-row items-center justify-between gap-2">
            <Text className="font-heading-extrabold text-display-md text-ink">Recompensas</Text>
            <Button
              label="Historial"
              variant="link"
              onPress={() => router.push('/recompensas/historial')}
            />
          </View>

          <View className="items-center">
            <Text className="font-body-bold text-caption text-ink-muted">Tu saldo</Text>
            <Text className="font-heading-extrabold text-display-lg text-ink">{available}</Text>
            <Text className="font-body-semibold text-caption text-ink-muted">
              puntos para gastar
              {jar ? ` · ${jar.points} más en tu alcancía` : ''}
            </Text>
          </View>

          {jar && (
            <SavingsCard
              jar={jar}
              reward={jarReward}
              onDeposit={() => jarReward && setDepositingFor(jarReward)}
              onRedeem={() => jarReward && setRedeeming(jarReward)}
            />
          )}

          <FreezeCard state={state} savings={jar} />

          {!jar && groups.length > 0 && (
            <Text className="font-body-semibold text-caption text-ink-muted">
              ¿Algo grande en mente? Abre el menú de una recompensa y elige &quot;Ahorrar para
              esta&quot;: los puntos que apartes quedan guardados para ella.
            </Text>
          )}

          {groups.length === 0 ? (
            <Card className="gap-4">
              <View className="gap-1">
                <Text className="font-heading text-heading-md text-ink">
                  Crea tu primera recompensa
                </Text>
                <Text className="font-body text-body text-ink-muted">
                  Ponle precio en puntos a algo que disfrutes: una tarde de series, un antojo, una
                  salida.
                </Text>
              </View>
              <Button label="Crear recompensa" onPress={() => router.push('/recompensas/new')} />
            </Card>
          ) : (
            groups.map((group) => (
              <View key={group.tier} className="gap-3">
                <View className="flex-row items-baseline gap-2">
                  <Text className="font-heading text-heading-md text-ink">{group.title}</Text>
                  <Text className="font-body-semibold text-caption text-ink-muted">
                    {group.range}
                  </Text>
                </View>
                {group.rewards.map((reward) => (
                  <RewardCard
                    key={reward.id}
                    reward={reward}
                    state={state}
                    savings={jar}
                    onRedeem={() => setRedeeming(reward)}
                    onStartSavings={jar ? undefined : () => setDepositingFor(reward)}
                  />
                ))}
              </View>
            ))
          )}
          {/* Espacio para que el botón flotante no tape la última recompensa. */}
          <View className="h-16" />
        </View>
      </Screen>
      <Fab label="Crear recompensa" onPress={() => router.push('/recompensas/new')} />
      {redeeming && (
        <RedeemSheet
          reward={redeeming}
          availablePoints={availableFor(redeeming)}
          onClose={() => setRedeeming(null)}
        />
      )}
      {depositingFor && (
        <DepositSheet
          reward={depositingFor}
          state={state}
          jar={jar?.rewardId === depositingFor.id ? jar : null}
          onClose={() => setDepositingFor(null)}
        />
      )}
    </View>
  );
}
