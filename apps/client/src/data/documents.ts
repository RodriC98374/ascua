// Referencias tipadas a los documentos de Firestore y los campos comunes de todo documento.
// Sin imports con alias (`@/`): las operaciones se prueban también desde packages/firestore-rules.
import type {
  DailyEntries,
  DailyLog,
  DateKey,
  GamificationState,
  HabitRecord,
  MonthKey,
  MonthlySummary,
  PointTransaction,
  RewardRecord,
  RewardRedemption,
  UserProfile,
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

// El ID del documento es el ID del hábito.
export const habitConverter = withIdConverter<HabitRecord>();

// Cada marca guarda también su updatedAt; el dominio solo necesita `completed`.
const baseDailyLogConverter = domainConverter<DailyLog>();
export const dailyLogConverter: FirestoreDataConverter<DailyLog, DocumentData> = {
  toFirestore: (data) => data as DocumentData,
  fromFirestore: (snapshot, options) => {
    const log = baseDailyLogConverter.fromFirestore(snapshot, options);
    const entries: Record<string, { completed: boolean }> = {};
    for (const [habitId, entry] of Object.entries(log.entries)) {
      entries[habitId] = { completed: entry.completed === true };
    }
    return { ...log, entries: entries as DailyEntries };
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

export function dailyLogRef(
  db: Firestore,
  uid: string,
  dateKey: DateKey,
): DocumentReference<DailyLog> {
  return doc(db, 'users', uid, 'dailyLogs', dateKey).withConverter(dailyLogConverter);
}

export const monthlySummaryConverter = domainConverter<MonthlySummary>();

export function monthlySummaryRef(
  db: Firestore,
  uid: string,
  monthKey: MonthKey,
): DocumentReference<MonthlySummary> {
  return doc(db, 'users', uid, 'monthlySummaries', monthKey).withConverter(monthlySummaryConverter);
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
