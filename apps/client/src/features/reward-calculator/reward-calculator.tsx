import {
  addDays,
  dailyPointsPace,
  daysToAfford,
  perfectMonthPoints,
  spendablePoints,
  suggestRewardCost,
} from '@ascua/shared';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { FieldLabel, Hint } from '@/components/ui/form-parts';
import { TextField } from '@/components/ui/text-field';
import { Toggle } from '@/components/ui/toggle';
import {
  useDailyLogsInRange,
  useGamificationState,
  useHabits,
  useSavings,
  useUserProfile,
} from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { useToday } from '@/features/today/use-today';

import { BudgetSheet } from './budget-sheet';
import { moneyTimeText, parseWholeAmount, pointsTimeText, rateText } from './calculator-text';

interface RewardCalculatorProps {
  /** "Usar este costo": pasa la sugerencia al campo de costo del formulario. */
  onUseCost: (cost: number) => void;
}

/**
 * Calculadora de recompensas (fase 21): para una recompensa que cuesta dinero, sugiere el costo en
 * puntos y cuánto falta para pagarla. Una gratis no la usa: su costo lo pone el usuario.
 */
export function RewardCalculator({ onUseCost }: RewardCalculatorProps) {
  const uid = useUid();
  const today = useToday();
  const profile = useUserProfile(uid);
  const habits = useHabits(uid);
  const gamification = useGamificationState(uid);
  const savings = useSavings(uid);
  // Los últimos 30 días cerrados dan el ritmo real de puntos.
  const logs = useDailyLogsInRange(uid, addDays(today, -30), addDays(today, -1));
  const [costsMoney, setCostsMoney] = useState(false);
  const [priceText, setPriceText] = useState('');
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const budget = profile.data?.rewardBudget ?? null;
  const price = parseWholeAmount(priceText);
  const monthPoints = perfectMonthPoints(habits.data, today);
  const suggestion =
    price && budget
      ? suggestRewardCost({ price, monthlyBudget: budget, perfectMonthPoints: monthPoints })
      : null;
  const jar = savings.data?.rewardId ? savings.data : null;
  const available = spendablePoints(gamification.data?.pointsBalance ?? 0, jar);
  const pace = dailyPointsPace(logs.data, today);

  return (
    // Sin tarjeta propia: va dentro de la del formulario ("Cuánto cuesta").
    <View className="gap-4">
      <View className="min-h-11 flex-row items-center gap-3">
        <View className="flex-1 gap-0.5">
          <FieldLabel>Cuesta dinero</FieldLabel>
          <Hint>Calcula un costo en puntos desde su precio.</Hint>
        </View>
        <Toggle accessibilityLabel="Cuesta dinero" value={costsMoney} onChange={setCostsMoney} />
      </View>

      {costsMoney && (
        <>
          <TextField
            label="Precio (Bs)"
            value={priceText}
            onChangeText={(value) => setPriceText(value.replace(/[^\d]/g, ''))}
            keyboardType="number-pad"
            placeholder="Ej.: 120"
          />

          <View className="flex-row items-center gap-2">
            <Text className="font-body text-caption text-ink-muted flex-1">
              {budget === null
                ? 'Para calcular, define cuánto gastas al mes en gustos.'
                : `Tu presupuesto para gustos: ${budget} Bs al mes.`}
            </Text>
            <Button
              label={budget === null ? 'Definir' : 'Cambiar'}
              variant="link"
              onPress={() => setIsEditingBudget(true)}
            />
          </View>

          {budget !== null && monthPoints === 0 && (
            <Text className="font-body text-caption text-ink-muted">
              Crea al menos un hábito: la sugerencia sale de los puntos de un mes perfecto.
            </Text>
          )}

          {suggestion && budget !== null && (
            <View className="border-border gap-3 border-t pt-4">
              {/* El "?" mide 20 px; su área de toque, 44. La fila le da el alto (un `hitSlop` no
                  pasa del borde de la vista que lo contiene) y el margen negativo lo compensa. */}
              <View className="-my-3 min-h-11 flex-row items-center">
                <Text className="font-body-bold text-caption text-ink-muted">Costo sugerido</Text>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="¿Cómo se calcula?"
                  accessibilityState={{ expanded: isHelpOpen }}
                  onPress={() => setIsHelpOpen((open) => !open)}
                  className="h-11 w-11 items-center justify-center active:opacity-85"
                >
                  <View className="border-ink-muted h-5 w-5 items-center justify-center rounded-full border">
                    <Text className="font-body-bold text-label text-ink-muted">?</Text>
                  </View>
                </Pressable>
              </View>
              <Text className="font-heading-extrabold text-display-md text-ink">
                {suggestion.cost} pts
              </Text>
              {isHelpOpen && (
                <View className="bg-surface-300 rounded-md px-3 py-2.5">
                  <Text className="font-body text-caption text-ink">
                    Es solo una sugerencia: el costo final lo decides tú. Un mes con todos tus
                    hábitos cumplidos (sin tareas) da {monthPoints} pts y equivale a tu presupuesto
                    de {budget} Bs: {rateText(suggestion.pointsPerBs)} pts por cada Bs.
                  </Text>
                </View>
              )}
              <View className="gap-1">
                <Text className="font-body text-body text-ink">
                  {moneyTimeText(suggestion.budgetMonths)}
                </Text>
                <Text className="font-body text-body text-ink">
                  {pointsTimeText(
                    daysToAfford({ cost: suggestion.cost, availablePoints: available, pace }),
                    pace,
                  )}
                </Text>
              </View>
              <Button
                label={`Usar ${suggestion.cost} pts`}
                variant="secondary"
                onPress={() => onUseCost(suggestion.cost)}
              />
            </View>
          )}
        </>
      )}

      {isEditingBudget && <BudgetSheet budget={budget} onClose={() => setIsEditingBudget(false)} />}
    </View>
  );
}
