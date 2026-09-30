import {
  canRedeemReward,
  spendablePoints,
  type GamificationState,
  type RewardRecord,
  type SavingsJar,
} from '@ascua/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArchiveIcon, EditIcon, JarIcon } from '@/components/ui/icons';
import { PopoverMenu } from '@/components/ui/popover-menu';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useUid } from '@/features/auth/session';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { archiveReward } from '@/operations/rewards';

import { redeemButtonLabel } from './reward-catalog';
import { RewardChip } from './reward-chip';

interface RewardCardProps {
  reward: RewardRecord;
  state: GamificationState;
  /** La alcancía (fase 18): sus puntos no cuentan para las demás recompensas. */
  savings: SavingsJar | null;
  onRedeem: () => void;
  /** Empezar una alcancía para esta recompensa; solo si no hay otra en curso. */
  onStartSavings?: () => void;
}

/**
 * Una recompensa del catálogo: nombre, nivel, costo y el botón de canje. Si todavía no alcanza,
 * en lugar de un botón apagado muestra cuánto se avanzó hacia ella: una meta cercana motiva más.
 */
export function RewardCard({ reward, state, savings, onRedeem, onStartSavings }: RewardCardProps) {
  const uid = useUid();
  const check = canRedeemReward(state, reward, savings);
  const isSaving = savings?.rewardId === reward.id;
  // Para la de la alcancía cuenta el saldo entero; para las demás, lo que queda libre.
  const available = isSaving ? state.pointsBalance : spendablePoints(state.pointsBalance, savings);
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);

  function archive() {
    setIsConfirmingArchive(false);
    trackWrite(archiveReward(db, uid, reward.id));
  }

  return (
    <Card>
      <View className="flex-row items-start gap-2">
        <View className="flex-1 gap-1.5">
          <Text className="font-heading text-heading-sm text-ink">{reward.name}</Text>
          {reward.description && (
            <Text className="font-body text-caption text-ink-muted">{reward.description}</Text>
          )}
          <View className="flex-row items-center gap-2">
            <RewardChip tier={reward.tier} />
            <Text className="font-body-bold text-caption text-ink-muted">{reward.cost} pts</Text>
          </View>
        </View>
        <PopoverMenu
          label={`Opciones de ${reward.name}`}
          items={[
            {
              label: 'Editar',
              Icon: EditIcon,
              onPress: () =>
                router.push({
                  pathname: '/recompensas/[rewardId]',
                  params: { rewardId: reward.id },
                }),
            },
            ...(onStartSavings && !isSaving
              ? [{ label: 'Ahorrar para esta', Icon: JarIcon, onPress: onStartSavings }]
              : []),
            {
              label: 'Archivar',
              Icon: ArchiveIcon,
              isDestructive: true,
              onPress: () => setIsConfirmingArchive(true),
            },
          ]}
        />
      </View>
      {!check.ok && check.reason === 'insufficient_points' ? (
        <View
          accessible
          accessibilityLabel={`${available} de ${reward.cost} puntos. ${redeemButtonLabel(check)}`}
          className="mt-4 gap-2"
        >
          <ProgressBar value={(available / reward.cost) * 100} />
          <View className="flex-row justify-between gap-2">
            <Text className="font-body-semibold text-caption text-ink-muted">
              {isSaving ? `${savings.points} apartados · ` : ''}
              {available} de {reward.cost} pts
            </Text>
            <Text className="font-body-bold text-caption text-ember-strong">
              {redeemButtonLabel(check)}
            </Text>
          </View>
        </View>
      ) : (
        <View className="mt-3">
          <Button
            label={redeemButtonLabel(check)}
            variant={check.ok ? 'primary' : 'secondary'}
            isDisabled={!check.ok}
            onPress={onRedeem}
          />
        </View>
      )}
      <ConfirmDialog
        isVisible={isConfirmingArchive}
        title={`¿Archivar “${reward.name}”?`}
        message="Deja de aparecer en el catálogo. Los canjes que ya hiciste se conservan en tu historial."
        confirmLabel="Archivar"
        onConfirm={archive}
        onCancel={() => setIsConfirmingArchive(false)}
      />
    </Card>
  );
}
