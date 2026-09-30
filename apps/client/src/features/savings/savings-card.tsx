import { isSavingsComplete, type RewardRecord, type SavingsJar } from '@ascua/shared';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { JarIcon } from '@/components/ui/icons';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useUid } from '@/features/auth/session';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { cancelSavings } from '@/operations/savings';
import { useThemeColors } from '@/theme/colors';

interface SavingsCardProps {
  jar: SavingsJar;
  reward: RewardRecord | undefined;
  onDeposit: () => void;
  onRedeem: () => void;
}

/** La alcancía en curso: cuánto lleva, apartar más, canjear al llenarse o cancelarla. */
export function SavingsCard({ jar, reward, onDeposit, onRedeem }: SavingsCardProps) {
  const colors = useThemeColors();
  const uid = useUid();
  const [isConfirmingCancel, setIsConfirmingCancel] = useState(false);
  const cost = reward?.cost ?? jar.points;
  const isComplete = reward !== undefined && isSavingsComplete(jar, reward.cost);
  const isRewardActive = reward?.status === 'active';

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="bg-success-soft h-11 w-11 items-center justify-center rounded-full">
          <JarIcon size={22} color={colors.success} />
        </View>
        <View className="flex-1">
          <Text className="font-body-bold text-caption text-ink-muted">Tu alcancía</Text>
          <Text className="font-heading text-heading-sm text-ink">
            {reward?.name ?? 'Recompensa borrada'}
          </Text>
        </View>
      </View>
      <View className="gap-1.5">
        <ProgressBar value={(jar.points / cost) * 100} tone="success" />
        <View className="flex-row justify-between gap-2">
          <Text className="font-body-bold text-caption text-ink">
            {jar.points} de {cost} pts apartados
          </Text>
          {!isComplete && isRewardActive && (
            <Text className="font-body-semibold text-caption text-ink-muted">
              Faltan {cost - jar.points}
            </Text>
          )}
        </View>
      </View>
      {!isRewardActive && (
        <Text className="font-body-semibold text-caption text-warning">
          Esta recompensa se archivó. Cancela la alcancía para liberar tus puntos.
        </Text>
      )}
      <View className="flex-row gap-2">
        {isRewardActive && (
          <View className="flex-1">
            {isComplete ? (
              <Button label="Canjear" onPress={onRedeem} />
            ) : (
              <Button label="Apartar puntos" onPress={onDeposit} />
            )}
          </View>
        )}
        <View className={isRewardActive ? '' : 'flex-1'}>
          <Button
            label="Cancelar alcancía"
            variant={isRewardActive ? 'link' : 'secondary'}
            onPress={() => setIsConfirmingCancel(true)}
          />
        </View>
      </View>
      <ConfirmDialog
        isVisible={isConfirmingCancel}
        title="¿Cancelar la alcancía?"
        message={`Tus ${jar.points} pts apartados vuelven a estar disponibles para gastar. No pierdes nada.`}
        confirmLabel="Cancelar alcancía"
        confirmVariant="primary"
        onConfirm={() => {
          setIsConfirmingCancel(false);
          trackWrite(cancelSavings(db, uid));
        }}
        onCancel={() => setIsConfirmingCancel(false)}
      />
    </Card>
  );
}
