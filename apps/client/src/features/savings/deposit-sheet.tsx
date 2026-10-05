import {
  maxSavingsDeposit,
  type GamificationState,
  type RewardRecord,
  type SavingsJar,
} from '@ascua/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { choiceContainer, choiceLabel } from '@/components/ui/choice-styles';
import { ProgressBar } from '@/components/ui/progress-bar';
import { useUid } from '@/features/auth/session';
import { selectionFeedback, tapFeedback } from '@/features/celebration/haptics';
import { db } from '@/lib/firebase';
import { depositSavings } from '@/operations/savings';

import { depositOptions, savingsErrorMessage } from './savings-text';

interface DepositSheetProps {
  reward: RewardRecord;
  state: GamificationState;
  /** La alcancía actual de esta recompensa; null si se empieza ahora. */
  jar: SavingsJar | null;
  onClose: () => void;
}

/** Hoja para apartar puntos: montos rápidos y el efecto en la alcancía antes de confirmar. */
export function DepositSheet({ reward, state, jar, onClose }: DepositSheetProps) {
  const uid = useUid();
  const saved = jar?.points ?? 0;
  const max = maxSavingsDeposit({ balance: state.pointsBalance, jar, cost: reward.cost });
  const options = depositOptions(max);
  const [amount, setAmount] = useState(options.at(-1) ?? 0);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const after = saved + amount;

  async function deposit() {
    setIsSaving(true);
    setError(null);
    try {
      await depositSavings(db, uid, { rewardId: reward.id, amount });
      tapFeedback();
      onClose();
    } catch (depositError) {
      setError(savingsErrorMessage(depositError));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <BottomSheet
      isOpen
      title={jar ? 'Apartar más puntos' : 'Empezar una alcancía'}
      subtitle={`Para “${reward.name}”: lo que apartes ya no se gasta en otra cosa.`}
      onClose={() => {
        if (!isSaving) onClose();
      }}
    >
      {max === 0 ? (
        <Text className="font-body text-body text-ink-muted">
          {saved >= reward.cost
            ? 'Ya tienes todo lo que cuesta. ¡Canjéala!'
            : 'No te quedan puntos libres. Vuelve mañana, cuando cierre el día.'}
        </Text>
      ) : (
        <>
          <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
            {options.map((option, index) => {
              const isSelected = option === amount;
              const isMax = index === options.length - 1;
              return (
                <Pressable
                  key={option}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  onPress={() => {
                    selectionFeedback();
                    setAmount(option);
                  }}
                  className={`min-h-11 items-center justify-center rounded-full border-2 px-4 ${choiceContainer(isSelected)}`}
                >
                  <Text className={`font-body-extrabold text-button ${choiceLabel(isSelected)}`}>
                    {isMax ? `Todo · ${option}` : `+${option}`}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <View className="bg-surface-100 gap-2 rounded-md px-4 py-3">
            <ProgressBar value={(after / reward.cost) * 100} tone="success" />
            <Text className="font-body-bold text-body text-ink">
              {after} de {reward.cost} pts en la alcancía
            </Text>
            <Text className="font-body-semibold text-caption text-ink-muted">
              Te quedan {state.pointsBalance - after} pts para gastar en otras cosas.
            </Text>
          </View>
        </>
      )}
      {error && (
        <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
          {error}
        </Text>
      )}
      <View className="flex-row gap-2">
        <View className="flex-1">
          <Button label="Cancelar" variant="secondary" isDisabled={isSaving} onPress={onClose} />
        </View>
        <View className="flex-1">
          <Button
            label={max === 0 ? 'Entendido' : `Apartar ${amount} pts`}
            isLoading={isSaving}
            onPress={max === 0 ? onClose : deposit}
          />
        </View>
      </View>
    </BottomSheet>
  );
}
