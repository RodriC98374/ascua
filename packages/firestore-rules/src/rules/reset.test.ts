// Reinicio de la cuenta (fase 22, D30): el historial nunca se borra, salvo con el marcador
// `meta/reset` que la app escribe justo antes de borrar.
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, serverTimestamp, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { describe, it } from 'vitest';

import { otherDb, ownerDb, strangerDb, useRulesTestEnvironment } from '../support/env';
import {
  ANIME,
  created,
  gamificationDoc,
  goalDoc,
  habitDoc,
  openLogDoc,
  paths,
  pendingState,
  profileDoc,
  reflectionDoc,
  rewardDoc,
  savingsDoc,
  seedDocs,
  taskDoc,
  transactionDoc,
  TWO_DAYS_AGO,
} from '../support/fixtures';

useRulesTestEnvironment();

const MINUTE = 60 * 1000;

/** Un movimiento de puntos de un hábito cumplido. */
const movement = () =>
  transactionDoc({
    id: 'completion_1',
    type: 'habit_completion',
    amount: 10,
    balanceAfter: 10,
    dateKey: TWO_DAYS_AGO,
    sourceType: 'habit',
    sourceId: 'reading',
    description: 'Hábito cumplido: Leer',
  });

/** Un documento de cada clase que borra el reinicio, con su ruta. */
function accountDocs() {
  return {
    [paths.user()]: profileDoc(),
    [paths.habit('reading')]: habitDoc(),
    [paths.reward('anime')]: rewardDoc(ANIME),
    [paths.task('bill')]: taskDoc(),
    // Una tarea cumplida en un día pasado está bloqueada: el reinicio también la borra.
    [paths.task('locked')]: taskDoc({
      dueDateKey: TWO_DAYS_AGO,
      completedDateKey: TWO_DAYS_AGO,
      completedAt: Timestamp.fromMillis(Date.now() - 2 * 24 * 60 * MINUTE),
    }),
    [paths.goal('exam')]: goalDoc(),
    [paths.reflection('2026-01-05')]: reflectionDoc('2026-01-05'),
    [paths.dailyLog(TWO_DAYS_AGO)]: {
      ...openLogDoc(TWO_DAYS_AGO),
      status: 'completed',
      summary: {},
    },
    [paths.monthlySummary('2026-01')]: { monthKey: '2026-01', ...created() },
    [paths.transaction('completion_1')]: movement(),
    [paths.redemption('req1')]: { rewardId: 'anime', ...created() },
    [paths.gamification()]: gamificationDoc(pendingState()),
    [paths.savings()]: savingsDoc(),
  };
}

/** El marcador con la hora de hace `minutesAgo` minutos, saltándose las reglas. */
async function seedMarker(minutesAgo: number) {
  await seedDocs({
    [paths.reset()]: { requestedAt: Timestamp.fromMillis(Date.now() - minutesAgo * MINUTE) },
  });
}

// Una tarea pendiente o de hoy se puede borrar siempre (D19); solo las cumplidas en un día pasado no.
const DELETABLE_ANYTIME = [paths.task('bill')];
const protectedPaths = () =>
  Object.keys(accountDocs()).filter((path) => !DELETABLE_ANYTIME.includes(path));

describe('deleting the account data', () => {
  it('is rejected without the reset marker', async () => {
    await seedDocs(accountDocs());
    for (const path of protectedPaths()) {
      await assertFails(deleteDoc(doc(ownerDb(), path)));
    }
  });

  it('is allowed for every kind of document while the marker is fresh', async () => {
    const docs = accountDocs();
    await seedDocs(docs);
    await assertSucceeds(setDoc(doc(ownerDb(), paths.reset()), { requestedAt: serverTimestamp() }));
    for (const path of Object.keys(docs)) {
      await assertSucceeds(deleteDoc(doc(ownerDb(), path)));
    }
  });

  it('is rejected once the marker is older than 15 minutes', async () => {
    await seedDocs(accountDocs());
    await seedMarker(16);
    for (const path of protectedPaths()) {
      await assertFails(deleteDoc(doc(ownerDb(), path)));
    }
  });

  it('is allowed just inside the 15 minutes', async () => {
    await seedDocs(accountDocs());
    await seedMarker(14);
    await assertSucceeds(deleteDoc(doc(ownerDb(), paths.dailyLog(TWO_DAYS_AGO))));
  });

  it('does not let another account delete it, marker or not', async () => {
    await seedDocs(accountDocs());
    await seedMarker(1);
    await assertFails(deleteDoc(doc(otherDb(), paths.habit('reading'))));
    await assertFails(deleteDoc(doc(strangerDb(), paths.habit('reading'))));
  });

  it('works for a whole batch of deletes at once', async () => {
    const docs = Object.fromEntries(
      Array.from({ length: 250 }, (_, index) => [
        paths.transaction(`completion_${index}`),
        movement(),
      ]),
    );
    await seedDocs(docs);
    await seedMarker(1);
    const db = ownerDb();
    const batch = writeBatch(db);
    for (const path of Object.keys(docs)) batch.delete(doc(db, path));
    await assertSucceeds(batch.commit());
  });
});

describe('meta/reset', () => {
  const marker = () => doc(ownerDb(), paths.reset());

  it('is created with the server time', async () => {
    await assertSucceeds(setDoc(marker(), { requestedAt: serverTimestamp() }));
  });

  it('can be renewed and deleted', async () => {
    await seedMarker(10);
    await assertSucceeds(setDoc(marker(), { requestedAt: serverTimestamp() }));
    await assertSucceeds(deleteDoc(marker()));
  });

  it('rejects a time chosen by the device', async () => {
    await assertFails(setDoc(marker(), { requestedAt: Timestamp.now() }));
    await assertFails(
      setDoc(marker(), { requestedAt: Timestamp.fromMillis(Date.now() + 60 * MINUTE) }),
    );
  });

  it('rejects other fields', async () => {
    await assertFails(setDoc(marker(), { requestedAt: serverTimestamp(), note: 'x' }));
    await assertFails(setDoc(marker(), { when: serverTimestamp() }));
  });

  it('is not writable by another account', async () => {
    await assertFails(setDoc(doc(otherDb(), paths.reset()), { requestedAt: serverTimestamp() }));
    await assertFails(setDoc(doc(strangerDb(), paths.reset()), { requestedAt: serverTimestamp() }));
  });
});
