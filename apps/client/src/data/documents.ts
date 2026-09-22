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
const baseHabitConverter = domainConverter<Omit<HabitRecord, 'id'>>();
export const habitConverter: FirestoreDataConverter<HabitRecord, DocumentData> = {
  toFirestore: (data) => data as DocumentData,
  fromFirestore: (snapshot, options) => ({
    id: snapshot.id,
    ...baseHabitConverter.fromFirestore(snapshot, options),
  }),
};

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

/** Movimiento del historial de puntos. Solo se crean; se escriben sin converter. */
export function pointTransactionRef(
  db: Firestore,
  uid: string,
  transactionId: string,
): DocumentReference {
  return doc(db, 'users', uid, 'pointTransactions', transactionId);
}
