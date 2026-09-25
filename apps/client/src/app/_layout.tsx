import '../global.css';

import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import Head from 'expo-router/head';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { ThemeProvider, useThemePreference } from '@/features/appearance/theme-provider';
import { SessionProvider, useSession } from '@/features/auth/session';
import { SoundsProvider } from '@/features/sounds/sounds-provider';
import { appFonts } from '@/theme/fonts';

// El splash queda visible hasta tener las fuentes, el tema y saber si hay una sesión guardada.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(appFonts);
  return (
    // Raíz de los gestos (deslizar un hábito para marcarlo).
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        {/* Título de la pestaña del navegador; en Android no hace nada. */}
        <Head>
          <title>Ascua</title>
        </Head>
        <SoundsProvider>
          <SessionProvider>
            <RootNavigator areFontsReady={fontsLoaded || fontError !== null} />
          </SessionProvider>
        </SoundsProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

function RootNavigator({ areFontsReady }: { areFontsReady: boolean }) {
  const { user, isLoading } = useSession();
  const { preference } = useThemePreference();
  const isReady = areFontsReady && !isLoading && preference !== null;

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
