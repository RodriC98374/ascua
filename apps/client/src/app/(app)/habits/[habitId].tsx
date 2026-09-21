import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { HabitForm } from '@/components/habit-form';
import { ScreenHeader } from '@/components/screen-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { useUid } from '@/features/auth/session';
import { useHabits } from '@/features/data/hooks';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { archiveHabit, updateHabit, type HabitInput } from '@/operations/habits';

export default function EditHabitScreen() {
  const { habitId } = useLocalSearchParams<{ habitId: string }>();
  const uid = useUid();
  const habits = useHabits(uid);
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);
  const habit = habits.data.find((candidate) => candidate.id === habitId);

  function handleSubmit(input: HabitInput) {
    trackWrite(updateHabit(db, uid, habitId, input));
    router.back();
  }

  function handleArchive() {
    trackWrite(archiveHabit(db, uid, habitId));
    router.back();
  }

  return (
    <Screen>
      <View className="gap-6">
        <ScreenHeader title="Editar hábito" fallbackHref="/ajustes" />
        {!habits.isLoading && !habit && (
          <Text className="font-body text-body text-ink-muted">Este hábito ya no existe.</Text>
        )}
        {habit?.status === 'archived' && (
          <Text className="font-body text-body text-ink-muted">
            Este hábito está archivado desde el {habit.archivedDateKey}.
          </Text>
        )}
        {habit?.status === 'active' && (
          <>
            <HabitForm habits={habits.data} habit={habit} onSubmit={handleSubmit} />
            <Card>
              {isConfirmingArchive ? (
                <View className="gap-3">
                  <Text className="font-heading text-heading-sm text-ink">
                    ¿Archivar “{habit.name}”?
                  </Text>
                  <Text className="font-body text-body text-ink-muted">
                    Hoy todavía cuenta; desde mañana deja de aparecer. No se puede reactivar: si
                    quieres retomarlo, crea uno nuevo. Tu historial se conserva.
                  </Text>
                  <View className="flex-row gap-2">
                    <View className="flex-1">
                      <Button
                        label="Cancelar"
                        variant="secondary"
                        onPress={() => setIsConfirmingArchive(false)}
                      />
                    </View>
                    <View className="flex-1">
                      <Button label="Archivar" variant="secondary" onPress={handleArchive} />
                    </View>
                  </View>
                </View>
              ) : (
                <Button
                  label="Archivar hábito"
                  variant="link"
                  onPress={() => setIsConfirmingArchive(true)}
                />
              )}
            </Card>
          </>
        )}
      </View>
    </Screen>
  );
}
