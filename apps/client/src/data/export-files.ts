// Archivos de exportación: lee los documentos una sola vez (sin suscripciones) y arma el
// contenido con la lógica de @ascua/shared. Imports relativos: se prueba desde
// packages/firestore-rules.
import {
  buildBackup,
  buildHabitDaysCsv,
  buildPointTransactionsCsv,
  exportFileName,
  todayDateKey,
  type ExportDocument,
  type ExportKind,
} from '@ascua/shared';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  Timestamp,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';

import { dailyLogsCollection, habitsCollection, pointTransactionConverter } from './documents';

export interface ExportFile {
  name: string;
  mimeType: string;
  content: string;
}

const USER_COLLECTIONS = [
  'habits',
  'dailyLogs',
  'monthlySummaries',
  'pointTransactions',
  'rewards',
  'rewardRedemptions',
  'tasks',
] as const;

/** Documentos tal como están en Firestore, sin converter: el respaldo no pierde ningún campo. */
async function rawCollection(db: Firestore, uid: string, name: string): Promise<ExportDocument[]> {
  const snapshot = await getDocs(collection(db, 'users', uid, name));
  return snapshot.docs.map((document) => ({ id: document.id, data: document.data() }));
}

async function rawDocument(
  db: Firestore,
  path: [string, ...string[]],
): Promise<ExportDocument | null> {
  const snapshot = await getDoc(doc(db, ...path));
  const data: DocumentData | undefined = snapshot.data();
  return data ? { id: snapshot.id, data } : null;
}

async function rawCollections(
  db: Firestore,
  uid: string,
): Promise<Record<(typeof USER_COLLECTIONS)[number], ExportDocument[]>> {
  const entries = await Promise.all(
    USER_COLLECTIONS.map(async (name) => [name, await rawCollection(db, uid, name)] as const),
  );
  return Object.fromEntries(entries) as Record<(typeof USER_COLLECTIONS)[number], ExportDocument[]>;
}

async function backupContent(db: Firestore, uid: string, now: Date): Promise<string> {
  const [profile, gamification, collections] = await Promise.all([
    rawDocument(db, ['users', uid]),
    rawDocument(db, ['users', uid, 'meta', 'gamification']),
    rawCollections(db, uid),
  ]);
  const backup = buildBackup({
    userId: uid,
    exportedAt: now,
    profile,
    gamification,
    ...collections,
  });
  return JSON.stringify(backup, null, 2);
}

async function habitDaysContent(db: Firestore, uid: string, now: Date): Promise<string> {
  const [habits, dailyLogs] = await Promise.all([
    getDocs(habitsCollection(db, uid)),
    getDocs(dailyLogsCollection(db, uid)),
  ]);
  return buildHabitDaysCsv({
    habits: habits.docs.map((document) => document.data()),
    dailyLogs: dailyLogs.docs.map((document) => document.data()),
    today: todayDateKey(now),
  });
}

async function pointTransactionsContent(db: Firestore, uid: string): Promise<string> {
  // Sin converter para conservar `createdAt`, que el dominio no trae.
  const snapshot = await getDocs(collection(db, 'users', uid, 'pointTransactions'));
  return buildPointTransactionsCsv(
    snapshot.docs.map((document) => {
      const createdAt: unknown = document.get('createdAt');
      return {
        ...pointTransactionConverter.fromFirestore(document),
        createdAt: createdAt instanceof Timestamp ? createdAt.toDate() : null,
      };
    }),
  );
}

/** Arma el archivo pedido. `now` define el día del nombre y la hora del respaldo. */
export async function buildExportFile(
  db: Firestore,
  uid: string,
  kind: ExportKind,
  now: Date = new Date(),
): Promise<ExportFile> {
  const name = exportFileName(kind, todayDateKey(now));
  switch (kind) {
    case 'backup':
      return { name, mimeType: 'application/json', content: await backupContent(db, uid, now) };
    case 'habit_days':
      return { name, mimeType: 'text/csv', content: await habitDaysContent(db, uid, now) };
    case 'point_transactions':
      return { name, mimeType: 'text/csv', content: await pointTransactionsContent(db, uid) };
  }
}
