import { formatLongDate } from '@ascua/shared';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';
import { signOut, useSession, useUid } from '@/features/auth/session';
import { useHabits } from '@/data/hooks';

/** Preferencias y cuenta. Los hábitos se crean, editan y ordenan desde Hoy. */
export default function SettingsScreen() {
  const uid = useUid();
  const { user } = useSession();
  const habits = useHabits(uid);
  const archived = habits.data.filter((habit) => habit.status === 'archived');

  return (
    <Screen edges={['top']}>
      <View className="gap-8">
        <Text className="font-heading-extrabold text-display-md text-ink">Ajustes</Text>

        <View className="gap-3">
          <Text className="font-heading text-heading-md text-ink">Cuenta</Text>
          <Card className="gap-4">
            <View className="gap-0.5">
              <Text className="font-body-semibold text-caption text-ink-muted">
                Sesión iniciada como
              </Text>
              <Text className="font-body-bold text-body text-ink">{user?.email}</Text>
            </View>
            <Button label="Cerrar sesión" variant="secondary" onPress={signOut} />
          </Card>
        </View>

        {archived.length > 0 && (
          <View className="gap-3">
            <View className="gap-1">
              <Text className="font-heading text-heading-md text-ink">Hábitos archivados</Text>
              <Text className="font-body text-body text-ink-muted">
                Ya no aparecen en Hoy; su historial se conserva.
              </Text>
            </View>
            <Card className="py-1">
              {archived.map((habit, index) => (
                <View
                  key={habit.id}
                  className={`min-h-12 justify-center py-2 ${index > 0 ? 'border-border border-t' : ''}`}
                >
                  <Text className="font-body-bold text-body text-ink-muted">{habit.name}</Text>
                  {habit.archivedDateKey && (
                    <Text className="font-body text-caption text-ink-muted">
                      Archivado el {formatLongDate(habit.archivedDateKey).toLowerCase()}
                    </Text>
                  )}
                </View>
              ))}
            </Card>
          </View>
        )}
      </View>
    </Screen>
  );
}
