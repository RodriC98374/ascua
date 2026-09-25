// closePendingDays: cierra, en orden, cada día desde `lastClosedDateKey + 1` hasta ayer
// (data-model §7). Una transacción por día: como `lastClosedDateKey` avanza dentro de la misma
// transacción, ningún día se cierra dos veces aunque la app esté abierta en el celular y en la PC.
// La lógica de negocio es `evaluateDay` de @ascua/shared; aquí solo se lee y se escribe.
import {
  addClosedDay,
  addDays,
  EMPTY_MONTHLY_COUNTERS,
  evaluateDay,
  todayDateKey,
  toMonthKey,
  type ClosedDayStatus,
  type DateKey,
  type GamificationState,
  type HabitRecord,
  type TaskRecord,
} from '@ascua/shared';
import {
  getDoc,
  getDocFromServer,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type Firestore,
  type Transaction,
} from 'firebase/firestore';

import {
  dailyLogRef,
  gamificationRef,
  habitsCollection,
  monthlySummaryRef,
  newDocumentFields,
  pointTransactionRef,
  tasksCollection,
} from '../data/documents';

export interface ClosedDay {
  dateKey: DateKey;
  status: ClosedDayStatus;
  pointsEarned: number;
  freezeUsed: boolean;
  streakBeforeClose: number;
  streakAfterClose: number;
}

export interface ClosePendingDaysResult {
  /** Los días que cerró esta ejecución, en orden. Vacío si no había nada pendiente. */
  closedDays: ClosedDay[];
  /** Estado después del último cierre; null si no cerró ninguno. */
  state: GamificationState | null;
}

export async function closePendingDays(
  db: Firestore,
  uid: string,
  today: DateKey = todayDateKey(),
): Promise<ClosePendingDaysResult> {
  const result: ClosePendingDaysResult = { closedDays: [], state: null };
  // Si no hay nada que cerrar, no se lee nada más. La foto puede venir del caché: como
  // `lastClosedDateKey` solo avanza, un dato viejo solo hace creer que hay más días pendientes, y
  // la transacción de cada día lo corrige.
  const knownState = (await getDoc(gamificationRef(db, uid))).data();
  if (!knownState) return result;
  const firstPending = addDays(knownState.lastClosedDateKey, 1);
  if (firstPending >= today) return result;

  // Las transacciones del SDK cliente no admiten consultas: hábitos y tareas se leen antes. Los
  // cambios de hoy no alteran días pasados (un hábito nuevo empieza hoy y una tarea solo se marca
  // hoy), así que la foto sirve para todos los días pendientes.
  const [habitsSnapshot, tasksSnapshot] = await Promise.all([
    getDocs(habitsCollection(db, uid)),
    getDocs(
      query(
        tasksCollection(db, uid),
        where('completedDateKey', '>=', firstPending),
        where('completedDateKey', '<', today),
      ),
    ),
  ]);
  const habits = habitsSnapshot.docs.map((snapshot) => snapshot.data());
  const completedTasks = tasksSnapshot.docs.map((snapshot) => snapshot.data());

  for (;;) {
    let attemptedDateKey: DateKey | null = null;
    try {
      const closed = await runTransaction(db, (transaction) =>
        closeNextDay(transaction, db, uid, { habits, completedTasks }, today, (dateKey) => {
          attemptedDateKey = dateKey;
        }),
      );
      if (!closed) return result;
      result.closedDays.push(closed.day);
      result.state = closed.state;
    } catch (error) {
      if (!(await wasClosedElsewhere(db, uid, attemptedDateKey, error))) throw error;
      // Otro dispositivo cerró ese día en paralelo: se sigue con el próximo.
    }
  }
}

/**
 * Si dos dispositivos cierran el mismo día a la vez, las reglas rechazan al segundo (sus
 * movimientos ya existen y `lastClosedDateKey` ya avanzó) en vez de devolver un conflicto que el
 * SDK reintente. Se distingue de un rechazo real mirando si el día ya quedó cerrado en el servidor.
 */
async function wasClosedElsewhere(
  db: Firestore,
  uid: string,
  attemptedDateKey: DateKey | null,
  error: unknown,
): Promise<boolean> {
  // Por `code` y no con instanceof: el error puede venir de otra copia del SDK (compat, tests).
  const code = (error as { code?: unknown } | null)?.code;
  if (!attemptedDateKey || code !== 'permission-denied') return false;
  const state = (await getDocFromServer(gamificationRef(db, uid))).data();
  return state !== undefined && state.lastClosedDateKey >= attemptedDateKey;
}

/** Cierra el día siguiente a `lastClosedDateKey` si ya pasó; null si no queda nada por cerrar. */
async function closeNextDay(
  transaction: Transaction,
  db: Firestore,
  uid: string,
  {
    habits,
    completedTasks,
  }: { habits: readonly HabitRecord[]; completedTasks: readonly TaskRecord[] },
  today: DateKey,
  onAttempt: (dateKey: DateKey) => void,
): Promise<{ day: ClosedDay; state: GamificationState } | null> {
  const stateSnapshot = await transaction.get(gamificationRef(db, uid));
  const state = stateSnapshot.data();
  if (!state) return null; // Cuenta sin inicializar: initializeAccount va primero.

  // Se recalcula en cada intento: si otro dispositivo ya cerró este día, sigue con el próximo.
  const dateKey = addDays(state.lastClosedDateKey, 1);
  if (dateKey >= today) return null;
  onAttempt(dateKey);

  const logRef = dailyLogRef(db, uid, dateKey);
  const monthKey = toMonthKey(dateKey);
  const monthRef = monthlySummaryRef(db, uid, monthKey);
  const log = (await transaction.get(logRef)).data();
  const month = (await transaction.get(monthRef)).data();

  // evaluateDay toma solo las tareas cumplidas en `dateKey`.
  const evaluation = evaluateDay({
    dateKey,
    habits,
    entries: log?.entries ?? {},
    completedTasks,
    state,
  });
  const summary = { ...evaluation.summary, closedAt: serverTimestamp() };

  // Se escribe sin converter: los metadatos (timestamps del servidor) no son parte del dominio.
  if (log) {
    transaction.update(logRef.withConverter(null), {
      status: evaluation.status,
      summary,
      updatedAt: serverTimestamp(),
    });
  } else {
    // Día sin marcas: el cierre crea su documento para que las gráficas no tengan huecos.
    transaction.set(logRef.withConverter(null), {
      dateKey,
      entries: {},
      status: evaluation.status,
      summary,
      ...newDocumentFields(),
    });
  }

  for (const { id, ...fields } of evaluation.transactions) {
    transaction.set(pointTransactionRef(db, uid, id).withConverter(null), {
      ...fields,
      ...newDocumentFields(),
    });
  }

  transaction.update(gamificationRef(db, uid).withConverter(null), {
    ...evaluation.nextState,
    updatedAt: serverTimestamp(),
  });

  if (month) {
    const { monthKey: _monthKey, ...counters } = month;
    transaction.update(monthRef.withConverter(null), {
      ...addClosedDay(counters, evaluation),
      updatedAt: serverTimestamp(),
    });
  } else {
    transaction.set(monthRef.withConverter(null), {
      monthKey,
      ...addClosedDay(EMPTY_MONTHLY_COUNTERS, evaluation),
      ...newDocumentFields(),
    });
  }

  return {
    day: {
      dateKey,
      status: evaluation.status,
      pointsEarned: evaluation.summary.pointsEarned,
      freezeUsed: evaluation.freezeUsed,
      streakBeforeClose: state.currentStreak,
      streakAfterClose: evaluation.summary.streakAfterClose,
    },
    state: evaluation.nextState,
  };
}
