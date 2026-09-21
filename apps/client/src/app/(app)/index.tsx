import { APP_TIME_ZONE, todayDateKey } from '@ascua/shared';
import { Text, View } from 'react-native';

import { ChartsSpike } from '@/components/charts-spike';
import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { signOut, useSession } from '@/features/auth/session';

// Pantalla provisional hasta la fase 05 (pantalla "Hoy").
export default function HomeScreen() {
  const { user } = useSession();
  return (
    <Screen>
      <View className="gap-6">
        <View className="gap-1">
          <Text className="font-heading text-heading-lg text-ink">Hoy</Text>
          <Text className="font-body text-body text-ink-muted">
            {todayDateKey()} en {APP_TIME_ZONE}
          </Text>
          <Text className="font-body text-caption text-ink-muted">Sesión: {user?.email}</Text>
        </View>
        <ChartsSpike />
        <Button label="Cerrar sesión" variant="link" onPress={signOut} />
      </View>
    </Screen>
  );
}
