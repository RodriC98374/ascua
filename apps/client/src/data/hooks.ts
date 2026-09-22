import type { DateKey } from '@ascua/shared';
import { limit, orderBy, query } from 'firebase/firestore';

import {
  dailyLogRef,
  gamificationRef,
  habitsCollection,
  pointTransactionsCollection,
  redemptionsCollection,
  rewardsCollection,
} from '@/data/documents';
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

/** Todas las recompensas (activas y archivadas), en el orden en que se crearon. */
export function useRewards(uid: string) {
  return useQuery(query(rewardsCollection(db, uid), orderBy('sortOrder')), `rewards/${uid}`);
}

/** Cuántos movimientos recientes muestra el historial. */
const HISTORY_LIMIT = 100;

/** Movimientos de puntos, del más reciente al más antiguo. */
export function usePointTransactions(uid: string) {
  return useQuery(
    query(pointTransactionsCollection(db, uid), orderBy('createdAt', 'desc'), limit(HISTORY_LIMIT)),
    `pointTransactions/${uid}`,
  );
}

export function useRedemptions(uid: string) {
  return useQuery(
    query(redemptionsCollection(db, uid), orderBy('createdAt', 'desc'), limit(HISTORY_LIMIT)),
    `rewardRedemptions/${uid}`,
  );
}
