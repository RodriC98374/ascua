import { router } from 'expo-router';
import { View } from 'react-native';

import { ScreenHeader } from '@/components/ui/screen-header';
import { Screen } from '@/components/ui/screen';
import { useRewards } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { RewardForm } from '@/features/rewards/reward-form';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { createReward, type RewardInput } from '@/operations/rewards';

export default function NewRewardScreen() {
  const uid = useUid();
  const rewards = useRewards(uid);

  function handleSubmit(input: RewardInput) {
    // Al final del catálogo. No se espera la escritura: sin conexión queda en cola.
    const sortOrder = Math.max(-1, ...rewards.data.map((reward) => reward.sortOrder)) + 1;
    trackWrite(createReward(db, uid, input, sortOrder).write);
    router.back();
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Nueva recompensa" fallbackHref="/recompensas" />
        {!rewards.isLoading && <RewardForm rewards={rewards.data} onSubmit={handleSubmit} />}
      </View>
    </Screen>
  );
}
