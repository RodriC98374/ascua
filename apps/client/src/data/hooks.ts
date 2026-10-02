import type { DateKey, MonthKey, TaskRecord } from '@ascua/shared';
import { documentId, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { useEffect, useState } from 'react';

import {
  dailyLogRef,
  dailyLogsCollection,
  gamificationRef,
  goalsCollection,
  habitsCollection,
  monthlySummariesCollection,
  monthlySummaryRef,
  pointTransactionsCollection,
  redemptionsCollection,
  rewardsCollection,
  savingsRef,
  tasksCollection,
  userProfileRef,
  weeklyReflectionRef,
  weeklyReflectionsCollection,
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

/**
 * Trofeos (fase 21): todos los canjes, sin el límite del historial. Son pocos (uno por premio
 * conseguido), así que leerlos todos es barato.
 */
export function useTrophies(uid: string) {
  return useQuery(
    query(redemptionsCollection(db, uid), orderBy('createdAt', 'desc')),
    `rewardRedemptions/${uid}/all`,
  );
}

// ---------- Fase 18: metas, reflexión semanal y alcancía ----------

/** Todas las metas (activas, logradas y archivadas), en el orden elegido. */
export function useGoals(uid: string) {
  return useQuery(query(goalsCollection(db, uid), orderBy('sortOrder')), `goals/${uid}`);
}

/** Firestore acepta hasta 30 valores en un `in`. */
const IN_QUERY_LIMIT = 30;

/**
 * Tareas por ID (las de las metas), en consultas de a 30. No usa `useQuery` porque la cantidad de
 * consultas cambia con la lista.
 */
export function useTasksByIds(uid: string, taskIds: readonly string[]): QueryState<TaskRecord> {
  const ids = [...new Set(taskIds)].sort();
  const key = `tasks/${uid}/ids/${ids.join(',')}`;
  const [state, setState] = useState<QueryState<TaskRecord> & { key: string }>({
    key,
    data: [],
    isLoading: true,
    hasPendingWrites: false,
  });

  useEffect(() => {
    if (ids.length === 0) return undefined;
    const chunks: string[][] = [];
    for (let start = 0; start < ids.length; start += IN_QUERY_LIMIT) {
      chunks.push(ids.slice(start, start + IN_QUERY_LIMIT));
    }
    const results = new Map<number, { tasks: TaskRecord[]; hasPendingWrites: boolean }>();
    const unsubscribes = chunks.map((chunk, index) =>
      onSnapshot(
        query(tasksCollection(db, uid), where(documentId(), 'in', chunk)),
        { includeMetadataChanges: true },
        (snapshot) => {
          results.set(index, {
            tasks: snapshot.docs.map((document) => document.data()),
            hasPendingWrites: snapshot.metadata.hasPendingWrites,
          });
          const all = [...results.values()];
          setState({
            key,
            data: all.flatMap((result) => result.tasks),
            isLoading: results.size < chunks.length,
            hasPendingWrites: all.some((result) => result.hasPendingWrites),
          });
        },
        (error) => console.error(`Suscripción a ${key} falló`, error),
      ),
    );
    return () => unsubscribes.forEach((unsubscribe) => unsubscribe());
    // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` identifica la lista.
  }, [key]);

  if (ids.length === 0) return { data: [], isLoading: false, hasPendingWrites: false };
  if (state.key !== key) return { data: [], isLoading: true, hasPendingWrites: false };
  return state;
}

/** Todas las reflexiones, de la semana más reciente a la más antigua. */
export function useWeeklyReflections(uid: string) {
  return useQuery(
    query(weeklyReflectionsCollection(db, uid), orderBy('weekStartDateKey', 'desc')),
    `weeklyReflections/${uid}`,
  );
}

export function useWeeklyReflection(uid: string, weekStartDateKey: DateKey) {
  return useDocument(
    weeklyReflectionRef(db, uid, weekStartDateKey),
    `weeklyReflections/${uid}/${weekStartDateKey}`,
  );
}

/** La alcancía; sin documento, no hay alcancía. */
export function useSavings(uid: string) {
  return useDocument(savingsRef(db, uid), `savings/${uid}`);
}
