// Detecta los logros del día que merecen celebrarse, solo cuando ocurren con la pantalla abierta
// (no al abrir la app con la meta ya cumplida).
import type { DateKey } from '@ascua/shared';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

/** Último día celebrado: la celebración sale una vez por día aunque se desmarque y se vuelva a marcar. */
const CELEBRATED_KEY = 'ascua.streakCelebratedOn';

export interface TodayMomentsInput {
  today: DateKey;
  isGoalMet: boolean;
  isPerfectDay: boolean;
  streakDays: number;
  /** Bono por racha que se gana hoy (7 o 30 días), 0 si no toca. */
  streakBonus: number;
}

export interface StreakCelebration {
  from: number;
  to: number;
  isPerfectDay: boolean;
  streakBonus: number;
}

export function useTodayMoments(input: TodayMomentsInput) {
  // undefined mientras se lee lo guardado: hasta entonces no se celebra (evita repetir).
  const [celebratedOn, setCelebratedOn] = useState<string | null | undefined>(undefined);
  const [previous, setPrevious] = useState(input);
  const [celebration, setCelebration] = useState<StreakCelebration | null>(null);
  const [perfectDayBurst, setPerfectDayBurst] = useState(0);

  useEffect(() => {
    AsyncStorage.getItem(CELEBRATED_KEY)
      .catch(() => null)
      .then((stored) => setCelebratedOn(stored ?? null));
  }, []);

  useEffect(() => {
    if (celebratedOn) AsyncStorage.setItem(CELEBRATED_KEY, celebratedOn).catch(() => {});
  }, [celebratedOn]);

  // Se compara con el render anterior durante el render (estado derivado, sin efecto).
  const hasChanged =
    previous.today !== input.today ||
    previous.isGoalMet !== input.isGoalMet ||
    previous.isPerfectDay !== input.isPerfectDay ||
    previous.streakDays !== input.streakDays;
  if (hasChanged) {
    setPrevious(input);
    const isSameDay = previous.today === input.today;
    if (isSameDay && input.isGoalMet && !previous.isGoalMet) {
      if (celebratedOn !== undefined && celebratedOn !== input.today) {
        setCelebratedOn(input.today);
        setCelebration({
          from: previous.streakDays,
          to: input.streakDays,
          isPerfectDay: input.isPerfectDay,
          streakBonus: input.streakBonus,
        });
      }
    } else if (isSameDay && input.isPerfectDay && !previous.isPerfectDay) {
      setPerfectDayBurst((count) => count + 1);
    }
  }

  return {
    celebration,
    dismissCelebration: () => setCelebration(null),
    /** Aumenta cada vez que el día pasa a perfecto después de asegurar la racha. */
    perfectDayBurst,
  };
}
