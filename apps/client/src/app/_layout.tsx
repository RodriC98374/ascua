import '../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';

import { SessionProvider, useSession } from '@/features/auth/session';
import { appFonts } from '@/theme/fonts';

// El splash queda visible hasta tener las fuentes y saber si hay una sesión guardada.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  return (
    <SessionProvider>
      <RootNavigator areFontsReady={fontsLoaded || fontError !== null} />
    </SessionProvider>
  );
}

function RootNavigator({ areFontsReady }: { areFontsReady: boolean }) {
  const { user, isLoading } = useSession();
  const isReady = areFontsReady && !isLoading;

  useEffect(() => {
    if (isReady) SplashScreen.hideAsync();
  }, [isReady]);

  // En web no hay splash: un fondo liso evita que el login parpadee antes de restaurar la sesión.
  if (!isReady) return <View className="bg-surface-100 flex-1" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={user !== null}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      {/* No hay registro: la cuenta se creó a mano en Firebase Console. */}
      <Stack.Protected guard={user === null}>
        <Stack.Screen name="sign-in" />
        <Stack.Screen name="forgot-password" />
      </Stack.Protected>
    </Stack>
  );
}
