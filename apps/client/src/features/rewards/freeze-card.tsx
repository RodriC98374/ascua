import {
  canPurchaseFreeze,
  MAX_STREAK_FREEZES,
  STREAK_FREEZE_COST,
  type GamificationState,
} from '@ascua/shared';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useUid } from '@/features/auth/session';
import { db } from '@/lib/firebase';
import { purchaseStreakFreeze } from '@/operations/spending';

import { ProtectorIndicator } from './protector-indicator';
import { freezeButtonLabel, spendErrorMessage } from './reward-catalog';
import { newRequestId } from './request-id';

/** Protectores disponibles y su compra, con confirmación. */
export function FreezeCard({ state }: { state: GamificationState }) {
  const uid = useUid();
  const check = canPurchaseFreeze(state);
  // Un ID por intento: se crea al abrir la confirmación y se reutiliza si se reintenta.
  const [requestId, setRequestId] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open() {
    setError(null);
    setRequestId(newRequestId());
  }

  async function buy() {
    if (!requestId) return;
    setIsBuying(true);
    setError(null);
    try {
      await purchaseStreakFreeze(db, uid, requestId);
      setRequestId(null);
    } catch (purchaseError) {
      setError(spendErrorMessage(purchaseError));
    } finally {
      setIsBuying(false);
    }
  }

  return (
    <Card className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-sm text-ink">Protectores de racha</Text>
        <Text className="font-body text-caption text-ink-muted">
          Si un día no cumples tus principales, uno se usa solo y tu racha se mantiene.
        </Text>
      </View>
      <View className="flex-row flex-wrap items-center justify-between gap-3">
        <ProtectorIndicator active={state.streakFreezesAvailable} />
        <Button
          label={freezeButtonLabel(check)}
          variant="secondary"
          isDisabled={!check.ok}
          onPress={open}
        />
      </View>
      <ConfirmDialog
        isVisible={requestId !== null}
        title="¿Comprar un protector?"
        message={`Cuesta ${STREAK_FREEZE_COST} pts: tu saldo pasa de ${state.pointsBalance} a ${state.pointsBalance - STREAK_FREEZE_COST} pts. Tendrás ${state.streakFreezesAvailable + 1} de ${MAX_STREAK_FREEZES}.`}
        confirmLabel="Comprar"
        confirmVariant="primary"
        isConfirming={isBuying}
        error={error}
        onConfirm={buy}
        onCancel={() => setRequestId(null)}
      />
    </Card>
  );
}
