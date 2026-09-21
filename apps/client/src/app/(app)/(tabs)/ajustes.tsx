import type { HabitRecord } from '@ascua/shared';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowIcon } from '@/components/ui/icons';
import { Screen } from '@/components/ui/screen';
import { signOut, useSession, useUid } from '@/features/auth/session';
import { useHabits } from '@/features/data/hooks';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { reorderHabits } from '@/operations/habits';
import { colors } from '@/theme/colors';

export default function SettingsScreen() {
  const uid = useUid();
  const { user } = useSession();
  const habits = useHabits(uid);
  const active = habits.data.filter((habit) => habit.status === 'active');
  const archived = habits.data.filter((habit) => habit.status === 'archived');

  function move(index: number, offset: -1 | 1) {
    const ids = active.map((habit) => habit.id);
    const target = index + offset;
    [ids[index], ids[target]] = [ids[target]!, ids[index]!];
    trackWrite(reorderHabits(db, uid, ids));
  }

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <Text className="font-heading text-heading-lg text-ink">Ajustes</Text>

        <View className="gap-3">
          <Text className="font-heading text-heading-md text-ink">Tus hábitos</Text>
          {active.length > 0 && (
            <Card>
              {active.map((habit, index) => (
                <HabitRow
                  key={habit.id}
                  habit={habit}
                  canMoveUp={index > 0}
                  canMoveDown={index < active.length - 1}
                  onMove={(offset) => move(index, offset)}
                />
              ))}
            </Card>
          )}
          <Button label="Agregar hábito" onPress={() => router.push('/habits/new')} />
        </View>

        {archived.length > 0 && (
          <View className="gap-2">
            <Text className="font-heading text-heading-sm text-ink-muted">Archivados</Text>
            {archived.map((habit) => (
              <Text key={habit.id} className="font-body text-body text-ink-muted">
                {habit.name} · hasta el {habit.archivedDateKey}
              </Text>
            ))}
          </View>
        )}

        <View className="gap-2">
          <Text className="font-heading text-heading-md text-ink">Cuenta</Text>
          <Text className="font-body text-body text-ink-muted">{user?.email}</Text>
          <Button label="Cerrar sesión" variant="secondary" onPress={signOut} />
        </View>
      </View>
    </Screen>
  );
}

interface HabitRowProps {
  habit: HabitRecord;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMove: (offset: -1 | 1) => void;
}

function HabitRow({ habit, canMoveUp, canMoveDown, onMove }: HabitRowProps) {
  const isPrimary = habit.tier === 'primary';
  return (
    <View className="min-h-12 flex-row items-center gap-1">
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Abre la edición del hábito"
        onPress={() =>
          router.push({ pathname: '/habits/[habitId]', params: { habitId: habit.id } })
        }
        className="min-h-11 flex-1 justify-center active:opacity-85"
      >
        <Text
          className={
            isPrimary
              ? 'font-heading text-heading-sm text-ink'
              : 'font-body text-body text-ink-muted'
          }
        >
          {habit.name}
        </Text>
        <Text className="font-body-extrabold text-label text-ink-muted uppercase">
          {isPrimary ? 'Principal' : 'Secundario'}
        </Text>
      </Pressable>
      <MoveButton direction="up" isEnabled={canMoveUp} onPress={() => onMove(-1)} />
      <MoveButton direction="down" isEnabled={canMoveDown} onPress={() => onMove(1)} />
    </View>
  );
}

function MoveButton({
  direction,
  isEnabled,
  onPress,
}: {
  direction: 'up' | 'down';
  isEnabled: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={direction === 'up' ? 'Subir' : 'Bajar'}
      disabled={!isEnabled}
      onPress={onPress}
      className={`h-11 w-11 items-center justify-center rounded-md ${isEnabled ? 'active:opacity-85' : 'opacity-40'}`}
    >
      <ArrowIcon direction={direction} size={18} color={colors.inkMuted} />
    </Pressable>
  );
}
