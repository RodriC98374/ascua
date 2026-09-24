import type { RewardRecord } from '@ascua/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { Screen } from '@/components/ui/screen';
import { useGamificationState, useRewards } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { FreezeCard } from '@/features/rewards/freeze-card';
import { RedeemSheet } from '@/features/rewards/redeem-sheet';
import { RewardCard } from '@/features/rewards/reward-card';
import { catalogByTier } from '@/features/rewards/reward-catalog';
import { useThemeColors } from '@/theme/colors';

export default function RewardsScreen() {
  const colors = useThemeColors();
  const uid = useUid();
  const gamification = useGamificationState(uid);
  const rewards = useRewards(uid);
  const [redeeming, setRedeeming] = useState<RewardRecord | null>(null);

  const state = gamification.data;
  if (!state || rewards.isLoading) {
    return (
      <View className="bg-surface-100 flex-1 items-center justify-center">
        <ActivityIndicator color={colors.emberStrong} size="large" />
      </View>
    );
  }

  const groups = catalogByTier(rewards.data);

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
            <Text className="font-heading-extrabold text-display-lg text-ink">
              {state.pointsBalance}
            </Text>
            <Text className="font-body-semibold text-caption text-ink-muted">
              puntos disponibles
            </Text>
          </View>

          <FreezeCard state={state} />

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
                    onRedeem={() => setRedeeming(reward)}
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
          pointsBalance={state.pointsBalance}
          onClose={() => setRedeeming(null)}
        />
      )}
    </View>
  );
}
