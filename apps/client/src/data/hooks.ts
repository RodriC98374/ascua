import type { DateKey } from '@ascua/shared';
import { orderBy, query } from 'firebase/firestore';

import { dailyLogRef, gamificationRef, habitsCollection } from '@/data/documents';
import { db } from '@/lib/firebase';

import { useDocument, useQuery } from './use-snapshot';

/** Todos los hábitos (activos y archivados), en el orden elegido por el usuario. */
export function useHabits(uid: string) {
  return useQuery(query(habitsCollection(db, uid), orderBy('sortOrder')), `habits/${uid}`);
}

export function useDailyLog(uid: string, dateKey: DateKey) {
  return useDocument(dailyLogRef(db, uid, dateKey), `dailyLogs/${uid}/${dateKey}`);
}

export function useGamificationState(uid: string) {
  return useDocument(gamificationRef(db, uid), `gamification/${uid}`);
}
