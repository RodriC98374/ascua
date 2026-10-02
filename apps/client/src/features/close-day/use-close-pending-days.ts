import { addDays } from '@ascua/shared';
import { useNetworkState } from 'expo-network';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { useGamificationState } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { useToday } from '@/features/today/use-today';
import { db } from '@/lib/firebase';
import { closePendingDays } from '@/operations/close-pending-days';

import { CLOSING_TIMEOUT_MS, closingRetryDelayMs, withTimeout } from './closing-retry';
import { closingErrorKind, describeClosing, type ClosingSummary } from './closing-summary';

/** Resultado del último intento. "Cerrando" no se guarda: se deduce de que haya días pendientes. */
type ClosingOutcome =
  | { status: 'idle' }
  | { status: 'done'; summary: ClosingSummary }
  | { status: 'error'; kind: 'offline' | 'rejected' | 'unknown' };

export type ClosingState = ClosingOutcome | { status: 'closing' };

/** Un intento que falló por conexión y se volverá a intentar solo tras `delayMs`. */
type RetryOutcome = { status: 'retry'; delayMs: number };

/**
 * Cierra los días pendientes en cuanto los hay: al abrir la app, al pasar la medianoche con la
 * app abierta, al volver a primer plano y al recuperar la red. Sin conexión no lo intenta.
 * Si falla por conexión (típico al volver del fondo, mientras Firestore reconecta), reintenta
 * solo con espera creciente y, agotados los reintentos, avisa con "Reintentar". Si las reglas
 * rechazan el cierre (reloj del dispositivo mal), no reintenta solo: espera a que el usuario
 * toque "Reintentar".
 */
export function useClosePendingDays() {
  const uid = useUid();
  const today = useToday();
  const gamification = useGamificationState(uid);
  const network = useNetworkState();
  const [outcome, setOutcome] = useState<ClosingOutcome>({ status: 'idle' });
  const [foregroundCount, setForegroundCount] = useState(0);
  // Sube cuando vence la espera de un reintento: vuelve a disparar el efecto de cierre.
  const [retryCount, setRetryCount] = useState(0);
  const isRunning = useRef(false);
  const isBlocked = useRef(false);
  const failures = useRef(0);
  const retryTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const lastClosed = gamification.data?.lastClosedDateKey;
  const hasPendingDays = lastClosed !== undefined && addDays(lastClosed, 1) < today;
  // Mientras no se sabe (undefined), se asume que hay red: el cierre fallará y reintentará.
  const isOnline = network.isConnected !== false && network.isInternetReachable !== false;

  /** Intenta cerrar; devuelve el resultado, o null si no correspondía intentarlo. */
  const attempt = useCallback(
    async (isManual: boolean): Promise<ClosingOutcome | RetryOutcome | null> => {
      if (isRunning.current || (isBlocked.current && !isManual)) return null;
      isRunning.current = true;
      isBlocked.current = false;
      try {
        // El vigilante evita que un cierre colgado deje la app esperando para siempre.
        const result = await withTimeout(closePendingDays(db, uid), CLOSING_TIMEOUT_MS);
        failures.current = 0;
        const summary = describeClosing(result.closedDays);
        return summary ? { status: 'done', summary } : { status: 'idle' };
      } catch (error) {
        const kind = closingErrorKind(error);
        if (kind === 'offline') {
          // Sin red de verdad no se llega aquí (no se intenta); es una conexión a medias.
          const delayMs = closingRetryDelayMs(failures.current);
          failures.current += 1;
          return delayMs === null ? { status: 'error', kind } : { status: 'retry', delayMs };
        }
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
        if (!next) return;
        if (next.status === 'retry') {
          // Mientras espera, la barra sigue en "Actualizando tus días…".
          if (retryTimer.current) clearTimeout(retryTimer.current);
          retryTimer.current = setTimeout(() => setRetryCount((count) => count + 1), next.delayMs);
        } else {
          setOutcome(next);
        }
      }),
    [attempt],
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'active') setForegroundCount((count) => count + 1);
    });
    return () => subscription.remove();
  }, []);

  // Un nuevo día, volver al primer plano o recuperar la red empiezan de cero la cuenta de fallos.
  useEffect(() => {
    failures.current = 0;
  }, [today, foregroundCount, isOnline]);

  useEffect(() => {
    return () => {
      if (retryTimer.current) clearTimeout(retryTimer.current);
    };
  }, []);

  useEffect(() => {
    if (hasPendingDays && isOnline) run(false);
  }, [hasPendingDays, isOnline, today, foregroundCount, retryCount, run]);

  const isClosing = hasPendingDays && isOnline && outcome.status === 'idle';
  return {
    state: isClosing ? ({ status: 'closing' } as const) : outcome,
    retry: () => {
      failures.current = 0;
      setOutcome({ status: 'idle' });
      run(true);
    },
    dismiss: () => setOutcome({ status: 'idle' }),
  };
}
