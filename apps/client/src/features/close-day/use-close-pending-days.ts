import { addDays } from '@ascua/shared';
import { useNetworkState } from 'expo-network';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useGamificationState } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { useToday } from '@/features/today/use-today';
import { db } from '@/lib/firebase';
import { closePendingDays } from '@/operations/close-pending-days';

import { closingErrorKind, describeClosing, type ClosingSummary } from './closing-summary';

/** Resultado del último intento. "Cerrando" no se guarda: se deduce de que haya días pendientes. */
type ClosingOutcome =
  | { status: 'idle' }
  | { status: 'done'; summary: ClosingSummary }
  | { status: 'error'; kind: 'rejected' | 'unknown' };

export type ClosingState = ClosingOutcome | { status: 'closing' };

/**
 * Cierra los días pendientes en cuanto los hay: al abrir la app, al pasar la medianoche con la
 * app abierta, al volver a primer plano y al recuperar la red. Sin conexión no lo intenta.
 * Si las reglas rechazan el cierre (reloj del dispositivo mal), no reintenta solo: espera a que
 * el usuario toque "Reintentar".
 */
export function useClosePendingDays() {
  const uid = useUid();
  const today = useToday();
  const gamification = useGamificationState(uid);
  const network = useNetworkState();
  const [outcome, setOutcome] = useState<ClosingOutcome>({ status: 'idle' });
  const [foregroundCount, setForegroundCount] = useState(0);
  const isRunning = useRef(false);
  const isBlocked = useRef(false);

  const lastClosed = gamification.data?.lastClosedDateKey;
  const hasPendingDays = lastClosed !== undefined && addDays(lastClosed, 1) < today;
  // Mientras no se sabe (undefined), se asume que hay red: el cierre fallará y reintentará.
  const isOnline = network.isConnected !== false && network.isInternetReachable !== false;

  /** Intenta cerrar; devuelve el resultado, o null si no correspondía intentarlo. */
  const attempt = useCallback(
    async (isManual: boolean): Promise<ClosingOutcome | null> => {
      if (isRunning.current || (isBlocked.current && !isManual)) return null;
      isRunning.current = true;
      isBlocked.current = false;
      try {
        const result = await closePendingDays(db, uid);
        const summary = describeClosing(result.closedDays);
        return summary ? { status: 'done', summary } : { status: 'idle' };
      } catch (error) {
        const kind = closingErrorKind(error);
        // Sin conexión no es un error para el usuario: se reintenta al volver la red.
        if (kind === 'offline') return { status: 'idle' };
        isBlocked.current = kind === 'rejected';
        return { status: 'error', kind };
      } finally {
        isRunning.current = false;
      }
    },
    [uid],
  );

  const run = useCallback(
    (isManual: boolean) =>
      void attempt(isManual).then((next) => {
        if (next) setOutcome(next);
      }),
    [attempt],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') setForegroundCount((count) => count + 1);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    if (hasPendingDays && isOnline) run(false);
  }, [hasPendingDays, isOnline, today, foregroundCount, run]);

  const isClosing = hasPendingDays && isOnline && outcome.status === 'idle';
  return {
    state: isClosing ? ({ status: 'closing' } as const) : outcome,
    retry: () => {
      setOutcome({ status: 'idle' });
      run(true);
    },
    dismiss: () => setOutcome({ status: 'idle' }),
  };
}
