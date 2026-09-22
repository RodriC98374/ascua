// Datos de ejemplo en los emuladores locales (Auth y Firestore), para ver la app con historia:
// unos 80 días cerrados con la lógica real de `@ascua/shared` (rachas, protectores, bonos),
// compras de protectores y canjes. Solo habla con los emuladores de esta PC, nunca con el
// proyecto real, y borra lo que hubiera en ellos.
//
// Uso: `npm run emulators` en una terminal y, en otra, `npm run seed:demo`.
import { readFileSync } from 'node:fs';

import {
  addClosedDay,
  addDays,
  addMonthlySpending,
  canPurchaseFreeze,
  canRedeemReward,
  dateKeyRange,
  EMPTY_MONTHLY_COUNTERS,
  evaluateDay,
  initialGamificationState,
  initialUserProfile,
  planFreezePurchase,
  planRewardRedemption,
  todayDateKey,
  toMonthKey,
  type DailyEntries,
  type DateKey,
  type GamificationState,
  type HabitRecord,
  type HabitTier,
  type MonthKey,
  type HabitCategory,
  type HabitColor,
  type MonthlyCounters,
  type PointTransaction,
  type RewardRecord,
  type RewardTier,
} from '@ascua/shared';
import { initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { doc, Timestamp, writeBatch, type DocumentData, type Firestore } from 'firebase/firestore';

import { SCHEMA_VERSION } from '../../../apps/client/src/data/documents';
import { DEFAULT_HABIT_ICON } from '../../../apps/client/src/operations/habits';
import { DEFAULT_REWARD_ICON } from '../../../apps/client/src/operations/rewards';

const HOST = '127.0.0.1';
const FIRESTORE_PORT = 8080;
const AUTH_PORT = 9099;
const DEMO_EMAIL = 'demo@ascua.test';
const DEMO_PASSWORD = 'demo1234';
const DAYS_OF_HISTORY = 80;
const BATCH_SIZE = 400;

const ROOT = new URL('../../../', import.meta.url);

/** El proyecto por defecto de `.firebaserc`: el mismo que usan la app y los emuladores. */
function projectId(): string {
  const firebaserc = JSON.parse(readFileSync(new URL('.firebaserc', ROOT), 'utf8')) as {
    projects: { default: string };
  };
  return firebaserc.projects.default;
}

/** El usuario de ejemplo debe tener el uid permitido en `firestore.rules`, o la app no leería nada. */
function allowedUid(): string {
  const rules = readFileSync(new URL('firestore.rules', ROOT), 'utf8');
  const match = /function allowedUids\(\) \{\s*return \[\s*'([^']+)'/.exec(rules);
  if (!match?.[1]) throw new Error('No encontré el uid permitido en firestore.rules.');
  return match[1];
}

// ---------- Datos ----------

/** Números pseudoaleatorios con semilla fija (mulberry32): cada siembra da los mismos datos. */
function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function habit(
  id: string,
  name: string,
  tier: HabitTier,
  sortOrder: number,
  startDateKey: DateKey,
  category: HabitCategory,
  color: HabitColor,
  archivedDateKey: DateKey | null = null,
): HabitRecord {
  return {
    id,
    name,
    description: null,
    icon: DEFAULT_HABIT_ICON,
    color,
    category,
    tier,
    schedule: { type: 'daily' },
    status: archivedDateKey ? 'archived' : 'active',
    sortOrder,
    startDateKey,
    archivedDateKey,
  };
}

function reward(
  id: string,
  name: string,
  tier: RewardTier,
  cost: number,
  sortOrder: number,
): RewardRecord {
  return {
    id,
    name,
    description: null,
    icon: DEFAULT_REWARD_ICON,
    tier,
    cost,
    status: 'active',
    sortOrder,
  };
}

/** Un instante en hora de Bolivia (UTC-4). */
function at(dateKey: DateKey, time: string): Timestamp {
  return Timestamp.fromDate(new Date(`${dateKey}T${time}-04:00`));
}

function meta(createdAt: Timestamp) {
  return { createdAt, updatedAt: createdAt, schemaVersion: SCHEMA_VERSION };
}

function transactionDoc({ id: _id, ...fields }: PointTransaction, createdAt: Timestamp) {
  return { ...fields, ...meta(createdAt) };
}

interface DemoData {
  uid: string;
  documents: Map<string, DocumentData>;
  state: GamificationState;
}

function buildDemoData(uid: string): DemoData {
  const today = todayDateKey();
  const start = addDays(today, -DAYS_OF_HISTORY);
  const random = seededRandom(20260922);
  const user = `users/${uid}`;
  const documents = new Map<string, DocumentData>();

  const habits = [
    habit('leer', 'Leer 20 minutos', 'primary', 0, start, 'academic', '#A3C4D9'),
    habit('ejercicio', 'Ejercicio', 'primary', 1, start, 'physical', '#EFA98A'),
    habit('meditar', 'Meditar 10 minutos', 'primary', 2, addDays(start, 20), 'mental', '#C4B2DE'),
    habit('agua', 'Tomar 2 L de agua', 'secondary', 3, start, 'health', '#9FCBAC'),
    habit('dormir', 'Dormir antes de las 23:00', 'secondary', 4, addDays(start, 10), 'health', '#96C7C0'),
    habit('ingles', 'Inglés 15 minutos', 'secondary', 5, start, 'academic', '#E3CB8E', addDays(start, 50)),
  ];
  const chance: Record<string, number> = {
    leer: 0.97,
    ejercicio: 0.94,
    meditar: 0.93,
    agua: 0.85,
    dormir: 0.55,
    ingles: 0.6,
  };
  const rewards = [
    reward('series', 'Tarde de series', 'small', 60, 0),
    reward('delivery', 'Pedir comida que me gusta', 'medium', 180, 1),
    reward('cine', 'Cine con palomitas', 'large', 600, 2),
  ];

  documents.set(user, { ...initialUserProfile(DEMO_EMAIL), ...meta(at(start, '08:00:00')) });
  for (const { id, ...fields } of habits) {
    documents.set(`${user}/habits/${id}`, {
      ...fields,
      ...meta(at(fields.startDateKey, '08:00:00')),
    });
  }
  for (const { id, ...fields } of rewards) {
    documents.set(`${user}/rewards/${id}`, { ...fields, ...meta(at(start, '08:00:00')) });
  }

  const monthly = new Map<MonthKey, MonthlyCounters>();
  const addToMonth = (monthKey: MonthKey, update: (counters: MonthlyCounters) => MonthlyCounters) =>
    monthly.set(monthKey, update(monthly.get(monthKey) ?? EMPTY_MONTHLY_COUNTERS));
  let state = initialGamificationState(start);
  let spends = 0;

  for (const dateKey of dateKeyRange(start, addDays(today, -1))) {
    // Cada tanto un día flojo, para que haya días protegidos y perdidos. Las dos últimas
    // semanas cumple siempre los principales, para llegar a hoy con una racha encendida.
    const isRecent = dateKey >= addDays(today, -14);
    const isRoughDay = !isRecent && random() < 0.08;
    const entries: Record<string, { completed: boolean }> = {};
    for (const { id, tier } of habits) {
      const isDone = (isRecent && tier === 'primary') || random() < (chance[id] ?? 0.5);
      if (!isRoughDay && isDone) entries[id] = { completed: true };
    }
    const evaluation = evaluateDay({ dateKey, habits, entries: entries as DailyEntries, state });
    const closedAt = at(addDays(dateKey, 1), '07:30:00');
    const markedAt = at(dateKey, '20:00:00');

    documents.set(`${user}/dailyLogs/${dateKey}`, {
      dateKey,
      entries: Object.fromEntries(
        Object.entries(entries).map(([id, entry]) => [id, { ...entry, updatedAt: markedAt }]),
      ),
      status: evaluation.status,
      summary: { ...evaluation.summary, closedAt },
      ...meta(markedAt),
    });
    evaluation.transactions.forEach((transaction, index) => {
      const createdAt = Timestamp.fromMillis(closedAt.toMillis() + index);
      documents.set(
        `${user}/pointTransactions/${transaction.id}`,
        transactionDoc(transaction, createdAt),
      );
    });
    addToMonth(toMonthKey(dateKey), (counters) => addClosedDay(counters, evaluation));
    state = evaluation.nextState;

    // A la mañana siguiente, a veces compra un protector o canjea una recompensa.
    const spendDay = addDays(dateKey, 1);
    const spendAt = at(spendDay, '09:00:00');
    if (state.streakFreezesAvailable === 0 && canPurchaseFreeze(state).ok && random() < 0.15) {
      const requestId = `demo-freeze-${spends++}`;
      const plan = planFreezePurchase(state, requestId, spendDay);
      documents.set(
        `${user}/pointTransactions/${plan.transaction.id}`,
        transactionDoc(plan.transaction, spendAt),
      );
      addToMonth(toMonthKey(spendDay), (counters) =>
        addMonthlySpending(counters, plan.transaction.amount),
      );
      state = plan.nextState;
    } else {
      const choice = rewards[Math.floor(random() * rewards.length)];
      if (choice && canRedeemReward(state, choice).ok && random() < 0.12) {
        const requestId = `demo-redeem-${spends++}`;
        const plan = planRewardRedemption(state, choice, requestId, spendDay);
        documents.set(
          `${user}/pointTransactions/${plan.transaction.id}`,
          transactionDoc(plan.transaction, spendAt),
        );
        documents.set(`${user}/rewardRedemptions/${requestId}`, {
          rewardId: choice.id,
          rewardSnapshot: { name: choice.name, tier: choice.tier, cost: choice.cost },
          pointTransactionId: plan.transaction.id,
          dateKey: spendDay,
          redeemedAt: spendAt,
          note: random() < 0.5 ? '¡Me lo gané!' : null,
          ...meta(spendAt),
        });
        addToMonth(toMonthKey(spendDay), (counters) =>
          addMonthlySpending(counters, plan.transaction.amount),
        );
        state = plan.nextState;
      }
    }
  }

  for (const [monthKey, counters] of monthly) {
    documents.set(`${user}/monthlySummaries/${monthKey}`, {
      monthKey,
      ...counters,
      ...meta(at(`${monthKey}-01`, '07:30:00')),
    });
  }
  // Hoy, abierto y a medias.
  const nowAt = at(today, '08:00:00');
  documents.set(`${user}/dailyLogs/${today}`, {
    dateKey: today,
    entries: {
      leer: { completed: true, updatedAt: nowAt },
      agua: { completed: true, updatedAt: nowAt },
    },
    status: 'open',
    summary: null,
    ...meta(nowAt),
  });
  documents.set(`${user}/meta/gamification`, { ...state, ...meta(nowAt) });

  return { uid, documents, state };
}

// ---------- Emuladores ----------

async function emulatorRequest(port: number, path: string, init: RequestInit = {}) {
  const url = `http://${HOST}:${port}${path}`;
  const response = await fetch(url, {
    ...init,
    headers: { Authorization: 'Bearer owner', 'Content-Type': 'application/json' },
  });
  if (!response.ok) {
    throw new Error(`${init.method ?? 'GET'} ${url}: ${response.status} ${await response.text()}`);
  }
}

async function resetEmulators(project: string) {
  await emulatorRequest(
    FIRESTORE_PORT,
    `/emulator/v1/projects/${project}/databases/(default)/documents`,
    { method: 'DELETE' },
  );
  await emulatorRequest(AUTH_PORT, `/emulator/v1/projects/${project}/accounts`, {
    method: 'DELETE',
  });
}

async function createDemoUser(project: string, uid: string) {
  await emulatorRequest(AUTH_PORT, `/identitytoolkit.googleapis.com/v1/projects/${project}/accounts`, {
    method: 'POST',
    body: JSON.stringify({ localId: uid, email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });
}

async function writeDocuments(project: string, documents: Map<string, DocumentData>) {
  const env = await initializeTestEnvironment({
    projectId: project,
    firestore: { host: HOST, port: FIRESTORE_PORT },
  });
  try {
    await env.withSecurityRulesDisabled(async (context) => {
      // El contexto devuelve la API compat; las funciones modulares la aceptan.
      const db = context.firestore() as unknown as Firestore;
      const entries = [...documents];
      for (let index = 0; index < entries.length; index += BATCH_SIZE) {
        const batch = writeBatch(db);
        for (const [path, data] of entries.slice(index, index + BATCH_SIZE)) {
          batch.set(doc(db, path), data);
        }
        await batch.commit();
      }
    });
  } finally {
    await env.cleanup();
  }
}

async function main() {
  const project = projectId();
  const uid = allowedUid();
  try {
    await resetEmulators(project);
  } catch (error) {
    console.error('No pude hablar con los emuladores. ¿Están corriendo (`npm run emulators`)?');
    throw error;
  }
  await createDemoUser(project, uid);
  const { documents, state } = buildDemoData(uid);
  await writeDocuments(project, documents);

  console.log(`Listo: ${documents.size} documentos en los emuladores de ${project}.`);
  console.log(
    `Saldo: ${state.pointsBalance} pts. Racha: ${state.currentStreak}. Protectores: ${state.streakFreezesAvailable}.`,
  );
  console.log(`Entra con ${DEMO_EMAIL} / ${DEMO_PASSWORD} (la app debe usar los emuladores).`);
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
