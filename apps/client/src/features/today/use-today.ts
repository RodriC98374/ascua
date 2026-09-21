import { msUntilNextDay, todayDateKey, type DateKey } from '@ascua/shared';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * "Hoy" en Bolivia, que cambia solo a medianoche aunque la app quede abierta. También se revisa
 * al volver a primer plano: con el celular dormido los temporizadores se pausan.
 */
export function useToday(): DateKey {
  const [today, setToday] = useState(todayDateKey);

  useEffect(() => {
    const refresh = () => setToday(todayDateKey());
    // Medio segundo de margen para no despertar un instante antes de la medianoche.
    const timer = setTimeout(refresh, msUntilNextDay() + 500);
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [today]);

  return today;
}
