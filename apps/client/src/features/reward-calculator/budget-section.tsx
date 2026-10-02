import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useUserProfile } from '@/data/hooks';
import { useUid } from '@/features/auth/session';

import { BudgetSheet } from './budget-sheet';

/** Ajustes → Premios: el presupuesto mensual para gustos de la calculadora (fase 21). */
export function BudgetSection() {
  const uid = useUid();
  const profile = useUserProfile(uid);
  const [isEditing, setIsEditing] = useState(false);
  const budget = profile.data?.rewardBudget ?? null;

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Premios</Text>
        <Text className="font-body text-body text-ink-muted">
          Con tu presupuesto para gustos, la calculadora sugiere cuántos puntos pedir por una
          recompensa que cuesta dinero.
        </Text>
      </View>
      <Card className="py-1">
        <View className="min-h-12 flex-row items-center gap-3 py-2">
          <View className="flex-1 gap-0.5">
            <Text className="font-body-bold text-body text-ink">Presupuesto para gustos</Text>
            <Text className="font-body text-caption text-ink-muted">
              {budget === null ? 'Sin definir' : `${budget} Bs al mes`}
            </Text>
          </View>
          <Button
            label={budget === null ? 'Definir' : 'Cambiar'}
            variant="link"
            onPress={() => setIsEditing(true)}
          />
        </View>
      </Card>
      {isEditing && <BudgetSheet budget={budget} onClose={() => setIsEditing(false)} />}
    </View>
  );
}
