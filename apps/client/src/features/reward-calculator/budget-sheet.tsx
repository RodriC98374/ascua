import { REWARD_BUDGET_MAX, REWARD_BUDGET_MIN } from '@ascua/shared';
import { useState } from 'react';
import { View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { TextField } from '@/components/ui/text-field';
import { useUid } from '@/features/auth/session';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { updateRewardBudget } from '@/operations/profile';

import { parseWholeAmount } from './calculator-text';

interface BudgetSheetProps {
  /** El guardado en la cuenta, o null si no hay. */
  budget: number | null;
  onClose: () => void;
}

/**
 * Presupuesto mensual para gustos (fase 21): se guarda en la cuenta, igual en el celular y en la
 * PC. Se monta al abrirse, así cada apertura empieza con el valor guardado.
 */
export function BudgetSheet({ budget, onClose }: BudgetSheetProps) {
  const uid = useUid();
  const [text, setText] = useState(budget === null ? '' : String(budget));
  const [hasTried, setHasTried] = useState(false);
  const amount = parseWholeAmount(text);
  const error =
    amount === null || amount < REWARD_BUDGET_MIN || amount > REWARD_BUDGET_MAX
      ? `Escribe un monto entero de ${REWARD_BUDGET_MIN} a ${REWARD_BUDGET_MAX} Bs.`
      : null;

  function save(value: number | null) {
    // Sin conexión se guarda igual: llega al volver la red. Un rechazo se avisa en la barra global.
    trackWrite(updateRewardBudget(db, uid, value));
    onClose();
  }

  return (
    <BottomSheet
      isOpen
      title="Presupuesto para gustos"
      subtitle="Lo que gastas al mes en darte gustos, en Bs. La calculadora de recompensas lo usa para sugerir costos."
      onClose={onClose}
    >
      <View className="gap-4">
        <TextField
          label="Bs al mes"
          value={text}
          onChangeText={(value) => setText(value.replace(/[^\d]/g, ''))}
          keyboardType="number-pad"
          placeholder="Ej.: 250"
          error={hasTried ? error : null}
        />
        <Button
          label="Guardar"
          onPress={() => {
            setHasTried(true);
            if (!error && amount !== null) save(amount);
          }}
        />
        {budget !== null && (
          <Button label="Quitar presupuesto" variant="secondary" onPress={() => save(null)} />
        )}
      </View>
    </BottomSheet>
  );
}
