import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * La hora actual, que se actualiza al empezar cada minuto y al volver la app a primer plano (con el
 * celular dormido los temporizadores se pausan). Para cuentas regresivas en minutos.
 */
export function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const tick = () => setNow(new Date());
    let interval: ReturnType<typeof setInterval> | undefined;
    // Alineado al cambio de minuto, para que la cuenta no quede hasta un minuto atrasada.
    const timeout = setTimeout(
      () => {
        tick();
        interval = setInterval(tick, 60_000);
      },
      60_000 - (Date.now() % 60_000) + 50,
    );
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') tick();
    });
    return () => {
      clearTimeout(timeout);
      if (interval) clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return now;
}
