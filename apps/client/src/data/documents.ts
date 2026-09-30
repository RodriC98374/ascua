// Referencias tipadas a los documentos de Firestore y los campos comunes de todo documento.
// Sin imports con alias (`@/`): las operaciones se prueban también desde packages/firestore-rules.
import { categoryOf, isHabitColor, toCheckIn, toDateKey, todayDateKey } from '@ascua/shared';
import type {
  DailyEntries,
  DailyLog,
  DateKey,
  GamificationState,
  Goal,
  HabitEntry,
  HabitRecord,
  MonthKey,
  MonthlySummary,
  PointTransaction,
  RewardRecord,
  RewardRedemption,
  SavingsJar,
  TaskRecord,
  TaskSize,
  UserProfile,
  WeeklyReflection,
} from '@ascua/shared';
import {
  collection,
  doc,
  serverTimestamp,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type Firestore,
  type FirestoreDataConverter,
  type Timestamp,
} from 'firebase/firestore';

/** Versión del esquema de los documentos que escribe esta versión de la app. */
export const SCHEMA_VERSION = 1;

/** Campos que las reglas exigen al crear un documento (timestamps del servidor). */
export function newDocumentFields() {
  return {
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    schemaVersion: SCHEMA_VERSION,
  };
}

/**
 * Traduce un documento a su tipo de dominio de `@ascua/shared`, quitando los metadatos.
 * Las escrituras las arman las operaciones (con `newDocumentFields`), así que `toFirestore`
 * deja pasar los datos tal cual.
 */
function domainConverter<T extends object>(): FirestoreDataConverter<T, DocumentData> {
  return {
    toFirestore: (data) => data as DocumentData,
    fromFirestore: (snapshot, options) => {
      const {
        createdAt: _createdAt,
        updatedAt: _updatedAt,
        schemaVersion: _schemaVersion,
        ...data
      } = snapshot.data(options);
      return data as T;
    },
  };
}

export const userProfileConverter = domainConverter<UserProfile>();
export const gamificationConverter = domainConverter<GamificationState>();

// El ID del documento es el ID del hábito. Los hábitos creados antes de que existieran las
// categorías no traen `category` ni un `color` de la paleta, y los de antes de las fases 16 y 17 no
// traen `target` ni `reminder`: se les completa al leerlos.
const baseHabitConverter = withIdConverter<HabitRecord>();
export const habitConverter: FirestoreDataConverter<HabitRecord, DocumentData> = {
  toFirestore: (data) => data as DocumentData,
  fromFirestore: (snapshot, options) => {
    const habit = baseHabitConverter.fromFirestore(snapshot, options);
    const category = categoryOf(habit.category);
    return {
      ...habit,
      target: habit.target ?? null,
      reminder: habit.reminder ?? null,
      category: category.id,
      color: isHabitColor(habit.color) ? habit.color : category.color,
    };
  },
};

// Cada marca guarda también su updatedAt; el dominio solo necesita `completed` y, con cantidad,
// `count`.
const baseDailyLogConverter = domainConverter<DailyLog>();
export const dailyLogConverter: FirestoreDataConverter<DailyLog, DocumentData> = {
  toFirestore: (data) => data as DocumentData,
  fromFirestore: (snapshot, options) => {
    const log = baseDailyLogConverter.fromFirestore(snapshot, options);
    const entries: Record<string, HabitEntry> = {};
    for (const [habitId, entry] of Object.entries(log.entries)) {
      entries[habitId] =
        typeof entry.count === 'number'
          ? { completed: entry.completed === true, count: entry.count }
          : { completed: entry.completed === true };
    }
    // El check-in solo va si el documento lo trae (los de antes de la fase 15, no).
    return {
      ...log,
      entries: entries as DailyEntries,
      ...(log.checkIn === undefined ? {} : { checkIn: toCheckIn(log.checkIn) }),
    };
  },
};

export function userProfileRef(db: Firestore, uid: string): DocumentReference<UserProfile> {
  return doc(db, 'users', uid).withConverter(userProfileConverter);
}

export function gamificationRef(db: Firestore, uid: string): DocumentReference<GamificationState> {
  return doc(db, 'users', uid, 'meta', 'gamification').withConverter(gamificationConverter);
}

export function habitsCollection(db: Firestore, uid: string): CollectionReference<HabitRecord> {
  return collection(db, 'users', uid, 'habits').withConverter(habitConverter);
}

export function habitRef(
  db: Firestore,
  uid: string,
  habitId: string,
): DocumentReference<HabitRecord> {
  return doc(habitsCollection(db, uid), habitId);
}

export function dailyLogsCollection(db: Firestore, uid: string): CollectionReference<DailyLog> {
  return collection(db, 'users', uid, 'dailyLogs').withConverter(dailyLogConverter);
}

export function dailyLogRef(
  db: Firestore,
  uid: string,
  dateKey: DateKey,
): DocumentReference<DailyLog> {
  return doc(dailyLogsCollection(db, uid), dateKey);
}

// Los resúmenes de antes de la fase 15 no traen `checkInStats`: se leen como vacíos.
const baseMonthlySummaryConverter = domainConverter<MonthlySummary>();
export const monthlySummaryConverter: FirestoreDataConverter<MonthlySummary, DocumentData> = {
  toFirestore: (data) => data as DocumentData,
  fromFirestore: (snapshot, options) => {
    const month = baseMonthlySummaryConverter.fromFirestore(snapshot, options);
    return { ...month, checkInStats: month.checkInStats ?? {} };
  },
};

export function monthlySummariesCollection(
  db: Firestore,
  uid: string,
): CollectionReference<MonthlySummary> {
  return collection(db, 'users', uid, 'monthlySummaries').withConverter(monthlySummaryConverter);
}

export function monthlySummaryRef(
  db: Firestore,
  uid: string,
  monthKey: MonthKey,
): DocumentReference<MonthlySummary> {
  return doc(monthlySummariesCollection(db, uid), monthKey);
}

/** Documentos cuyo ID es parte del dominio (`id`), como hábitos, recompensas o movimientos. */
function withIdConverter<T extends { id: string }>(): FirestoreDataConverter<T, DocumentData> {
  const base = domainConverter<Omit<T, 'id'>>();
  return {
    toFirestore: (data) => data as DocumentData,
    fromFirestore: (snapshot, options) =>
      ({ id: snapshot.id, ...base.fromFirestore(snapshot, options) }) as T,
  };
}

export const pointTransactionConverter = withIdConverter<PointTransaction>();

export function pointTransactionsCollection(
  db: Firestore,
  uid: string,
): CollectionReference<PointTransaction> {
  return collection(db, 'users', uid, 'pointTransactions').withConverter(pointTransactionConverter);
}

/** Movimiento del historial de puntos. Solo se crean. */
export function pointTransactionRef(
  db: Firestore,
  uid: string,
  transactionId: string,
): DocumentReference<PointTransaction> {
  return doc(pointTransactionsCollection(db, uid), transactionId);
}

export const rewardConverter = withIdConverter<RewardRecord>();

export function rewardsCollection(db: Firestore, uid: string): CollectionReference<RewardRecord> {
  return collection(db, 'users', uid, 'rewards').withConverter(rewardConverter);
}

export function rewardRef(
  db: Firestore,
  uid: string,
  rewardId: string,
): DocumentReference<RewardRecord> {
  return doc(rewardsCollection(db, uid), rewardId);
}

// El ID del documento es el de la tarea. `createdDateKey` sale de `createdAt` en hora de Bolivia;
// mientras la creación no llega al servidor, `createdAt` todavía no existe y se toma hoy.
export const taskConverter: FirestoreDataConverter<TaskRecord, DocumentData> = {
  toFirestore: (data) => data as DocumentData,
  fromFirestore: (snapshot, options) => {
    const data = snapshot.data(options);
    const createdAt = data.createdAt as Timestamp | null;
    return {
      id: snapshot.id,
      title: data.title as string,
      size: data.size as TaskSize,
      dueDateKey: data.dueDateKey as DateKey,
      completedDateKey: (data.completedDateKey as DateKey | null) ?? null,
      createdDateKey: createdAt ? toDateKey(createdAt.toDate()) : todayDateKey(),
    };
  },
};

export function tasksCollection(db: Firestore, uid: string): CollectionReference<TaskRecord> {
  return collection(db, 'users', uid, 'tasks').withConverter(taskConverter);
}

export function taskRef(db: Firestore, uid: string, taskId: string): DocumentReference<TaskRecord> {
  return doc(tasksCollection(db, uid), taskId);
}

export const redemptionConverter = withIdConverter<RewardRedemption>();

export function redemptionsCollection(
  db: Firestore,
  uid: string,
): CollectionReference<RewardRedemption> {
  return collection(db, 'users', uid, 'rewardRedemptions').withConverter(redemptionConverter);
}

export function redemptionRef(
  db: Firestore,
  uid: string,
  requestId: string,
): DocumentReference<RewardRedemption> {
  return doc(redemptionsCollection(db, uid), requestId);
}

// ---------- Fase 18: metas, reflexión semanal y alcancía ----------

export const goalConverter = withIdConverter<Goal>();

export function goalsCollection(db: Firestore, uid: string): CollectionReference<Goal> {
  return collection(db, 'users', uid, 'goals').withConverter(goalConverter);
}

export function goalRef(db: Firestore, uid: string, goalId: string): DocumentReference<Goal> {
  return doc(goalsCollection(db, uid), goalId);
}

export const weeklyReflectionConverter = domainConverter<WeeklyReflection>();

export function weeklyReflectionsCollection(
  db: Firestore,
  uid: string,
): CollectionReference<WeeklyReflection> {
  return collection(db, 'users', uid, 'weeklyReflections').withConverter(weeklyReflectionConverter);
}

/** El ID es el lunes de la semana. */
export function weeklyReflectionRef(
  db: Firestore,
  uid: string,
  weekStartDateKey: DateKey,
): DocumentReference<WeeklyReflection> {
  return doc(weeklyReflectionsCollection(db, uid), weekStartDateKey);
}

export const savingsConverter = domainConverter<SavingsJar>();

/** La alcancía: un documento único, como el estado de gamificación. */
export function savingsRef(db: Firestore, uid: string): DocumentReference<SavingsJar> {
  return doc(db, 'users', uid, 'meta', 'savings').withConverter(savingsConverter);
}
