import { Stack } from 'expo-router';
import type { User } from 'firebase/auth';
import { ActivityIndicator, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { signOut, useSession } from '@/features/auth/session';
import { useAccountInitialization } from '@/features/auth/use-account-initialization';

export default function AppLayout() {
  const { user } = useSession();
  // El layout raíz solo monta este grupo con sesión; el chequeo es para el tipo.
  if (!user) return null;
  return <AccountGate key={user.uid} user={user} />;
}

/** No muestra la app hasta que el perfil y el estado de puntos existen. */
function AccountGate({ user }: { user: User }) {
  const { status, retry } = useAccountInitialization(user);

  if (status === 'initializing') {
    return (
      <View className="bg-surface-100 flex-1 items-center justify-center">
        <ActivityIndicator color="#C2410C" size="large" />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <Screen centered>
        <View className="gap-8">
          <View className="gap-2">
            <Text className="font-heading text-heading-lg text-ink">
              No pudimos preparar tu cuenta
            </Text>
            <Text className="font-body text-body text-ink-muted">
              Revisa tu conexión a internet y vuelve a intentarlo.
            </Text>
          </View>
          <View className="gap-2">
            <Button label="Reintentar" onPress={retry} />
            <Button label="Cerrar sesión" variant="link" onPress={signOut} />
          </View>
        </View>
      </Screen>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
