// Lee la preferencia de sonidos guardada en el dispositivo al abrir la app y la aplica al
// reproductor, que es un módulo (los sonidos se tocan desde cualquier parte, como las vibraciones).
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, use, useEffect, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { parseSoundsEnabled, serializeSoundsEnabled, SOUNDS_STORAGE_KEY } from './sound-preference';
import { playSound, setSoundsEnabled } from './sounds';

interface SoundsState {
  /** null hasta leer lo guardado. */
  isEnabled: boolean | null;
  setIsEnabled: (isEnabled: boolean) => void;
}

const SoundsContext = createContext<SoundsState | null>(null);

export function SoundsProvider({ children }: { children: ReactNode }) {
  const [isEnabled, setIsEnabledState] = useState<boolean | null>(null);

  useEffect(() => {
    let isActive = true;
    AsyncStorage.getItem(SOUNDS_STORAGE_KEY)
      .catch(() => null)
      .then((stored) => {
        if (!isActive) return;
        const enabled = parseSoundsEnabled(stored, Platform.OS);
        setSoundsEnabled(enabled);
        setIsEnabledState(enabled);
      });
    return () => {
      isActive = false;
    };
  }, []);

  function setIsEnabled(next: boolean) {
    setIsEnabledState(next);
    setSoundsEnabled(next);
    // Al encenderlos, una muestra: confirma que suenan y a qué volumen.
    if (next) playSound('chime');
    // Si no se puede guardar, vale hasta cerrar la app.
    AsyncStorage.setItem(SOUNDS_STORAGE_KEY, serializeSoundsEnabled(next)).catch(() => {});
  }

  return <SoundsContext value={{ isEnabled, setIsEnabled }}>{children}</SoundsContext>;
}

export function useSounds(): SoundsState {
  const state = use(SoundsContext);
  if (!state) throw new Error('useSounds se usa dentro de SoundsProvider.');
  return state;
}
