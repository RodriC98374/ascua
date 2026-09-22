import type { DateKey, MonthKey } from '@ascua/shared';
import { limit, orderBy, query, where } from 'firebase/firestore';

import {
  dailyLogRef,
  dailyLogsCollection,
  gamificationRef,
  habitsCollection,
  monthlySummariesCollection,
  monthlySummaryRef,
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

/** Los registros de una semana o un mes: a lo sumo 31 documentos (data-model.md §9). */
export function useDailyLogsInRange(uid: string, startDateKey: DateKey, endDateKey: DateKey) {
  return useQuery(
    query(
      dailyLogsCollection(db, uid),
      where('dateKey', '>=', startDateKey),
      where('dateKey', '<=', endDateKey),
      orderBy('dateKey'),
    ),
    `dailyLogs/${uid}/${startDateKey}/${endDateKey}`,
  );
}

export function useMonthlySummary(uid: string, monthKey: MonthKey) {
  return useDocument(monthlySummaryRef(db, uid, monthKey), `monthlySummaries/${uid}/${monthKey}`);
}

/** Los resúmenes de los meses de un año ('YYYY'): a lo sumo 12 documentos. */
export function useMonthlySummaries(uid: string, year: string) {
  return useQuery(
    query(
      monthlySummariesCollection(db, uid),
      where('monthKey', '>=', `${year}-01`),
      where('monthKey', '<=', `${year}-12`),
      orderBy('monthKey'),
    ),
    `monthlySummaries/${uid}/${year}`,
  );
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
