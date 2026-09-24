// Tema de la app: lee la preferencia guardada en el dispositivo, la aplica con NativeWind y le da a
// la navegación y a la barra de estado los colores del tema que se ve.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider as NavigationThemeProvider } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';

import { useActiveColorScheme, useThemeColors } from '@/theme/colors';

import { applyColorScheme } from './apply-color-scheme';
import { parseThemePreference, THEME_STORAGE_KEY, type ThemePreference } from './theme-preference';

interface ThemeState {
  /** null hasta leer lo guardado: el splash espera para no mostrar un tema y cambiar a otro. */
  preference: ThemePreference | null;
  setPreference: (preference: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeState | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference | null>(null);

  useEffect(() => {
    let isActive = true;
    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .catch(() => null)
      .then((stored) => {
        if (isActive) setPreferenceState(parseThemePreference(stored));
      });
    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (preference !== null) return applyColorScheme(preference);
  }, [preference]);

  function setPreference(next: ThemePreference) {
    setPreferenceState(next);
    // Si no se puede guardar, el tema cambia igual y vuelve a Automático al reabrir.
    AsyncStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
  }

  return (
    <ThemeContext value={{ preference, setPreference }}>
      <NavigationTheme>{children}</NavigationTheme>
    </ThemeContext>
  );
}

/** Fondo de las pantallas durante las transiciones y color de la barra de estado. */
function NavigationTheme({ children }: { children: ReactNode }) {
  const colors = useThemeColors();
  const isDark = useActiveColorScheme() === 'dark';
  const base = isDark ? DarkTheme : DefaultTheme;
  return (
    <NavigationThemeProvider
      value={{
        ...base,
        colors: {
          ...base.colors,
          primary: colors.emberStrong,
          background: colors.surface100,
          card: colors.surface200,
          text: colors.ink,
          border: colors.border,
          notification: colors.error,
        },
      }}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      {children}
    </NavigationThemeProvider>
  );
}

export function useThemePreference(): ThemeState {
  const state = use(ThemeContext);
  if (!state) throw new Error('useThemePreference se usa dentro de ThemeProvider.');
  return state;
}
