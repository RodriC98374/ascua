import type { DateKey, MonthKey, TaskRecord } from '@ascua/shared';
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
  tasksCollection,
  userProfileRef,
} from '@/data/documents';
import { db } from '@/lib/firebase';

import { useDocument, useQuery, type QueryState } from './use-snapshot';

export function useUserProfile(uid: string) {
  return useDocument(userProfileRef(db, uid), `users/${uid}`);
}

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

/** Todas las tareas pendientes, de cualquier fecha: pocas, porque las cumplidas salen de aquí. */
function useOpenTasks(uid: string) {
  return useQuery(
    query(tasksCollection(db, uid), where('completedDateKey', '==', null)),
    `tasks/${uid}/open`,
  );
}

/** Al marcar, una tarea pasa de una consulta a otra: se unen por ID para que no salga dos veces. */
function mergeTasks(
  open: QueryState<TaskRecord>,
  done: QueryState<TaskRecord>,
): QueryState<TaskRecord> {
  const byId = new Map([...open.data, ...done.data].map((task) => [task.id, task]));
  return {
    data: [...byId.values()],
    isLoading: open.isLoading || done.isLoading,
    hasPendingWrites: open.hasPendingWrites || done.hasPendingWrites,
  };
}

/**
 * Las tareas que muestra Hoy: todas las pendientes (de cualquier fecha) y las cumplidas hoy. Dos
 * consultas chicas en vez de toda la historia.
 */
export function useTodayTasks(uid: string, today: DateKey): QueryState<TaskRecord> {
  const open = useOpenTasks(uid);
  const doneToday = useQuery(
    query(tasksCollection(db, uid), where('completedDateKey', '==', today)),
    `tasks/${uid}/done/${today}`,
  );
  return mergeTasks(open, doneToday);
}

/**
 * Las tareas de una semana: las pendientes y las cumplidas en esos días. Las pendientes se filtran
 * por fecha al repartirlas (`taskDays`): así no hace falta un índice compuesto.
 */
export function useTasksInRange(
  uid: string,
  startDateKey: DateKey,
  endDateKey: DateKey,
): QueryState<TaskRecord> {
  const open = useOpenTasks(uid);
  const done = useQuery(
    query(
      tasksCollection(db, uid),
      where('completedDateKey', '>=', startDateKey),
      where('completedDateKey', '<=', endDateKey),
    ),
    `tasks/${uid}/done/${startDateKey}/${endDateKey}`,
  );
  return mergeTasks(open, done);
}

export function useRedemptions(uid: string) {
  return useQuery(
    query(redemptionsCollection(db, uid), orderBy('createdAt', 'desc'), limit(HISTORY_LIMIT)),
    `rewardRedemptions/${uid}`,
  );
}
