import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

import { ScreenHeader } from '@/components/ui/screen-header';
import { Screen } from '@/components/ui/screen';
import { useRewards } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { RewardForm } from '@/features/rewards/reward-form';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { updateReward, type RewardInput } from '@/operations/rewards';

/** Editar una recompensa. Archivar vive en su menú de tres puntos. */
export default function EditRewardScreen() {
  const { rewardId } = useLocalSearchParams<{ rewardId: string }>();
  const uid = useUid();
  const rewards = useRewards(uid);
  const reward = rewards.data.find((candidate) => candidate.id === rewardId);

  function handleSubmit(input: RewardInput) {
    trackWrite(updateReward(db, uid, rewardId, input));
    router.back();
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Editar recompensa" fallbackHref="/recompensas" />
        {!rewards.isLoading && !reward && (
          <Text className="font-body text-body text-ink-muted">Esta recompensa ya no existe.</Text>
        )}
        {reward?.status === 'archived' && (
          <Text className="font-body text-body text-ink-muted">
            Esta recompensa está archivada.
          </Text>
        )}
        {reward?.status === 'active' && (
          <RewardForm rewards={rewards.data} reward={reward} onSubmit={handleSubmit} />
        )}
      </View>
    </Screen>
  );
}
