// El reinicio real de la app contra el emulador y las reglas reales (fase 22, D30).
import { collection, doc, getDoc, getDocs } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  RESET_COLLECTIONS,
  resetAccount,
} from '../../../../apps/client/src/operations/reset-account';
import { OWNER, OWNER_EMAIL, otherDb, ownerDb, useRulesTestEnvironment } from '../support/env';
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
  YESTERDAY,
} from '../support/fixtures';

useRulesTestEnvironment();

const user = { uid: OWNER, email: OWNER_EMAIL };

async function documentsIn(name: string) {
  return (await getDocs(collection(ownerDb(), 'users', OWNER, name))).docs.map((d) => d.id);
}

/** Un día de uso: de todo un poco, con la forma que escribe la app. */
async function seedAccount() {
  await seedDocs({
    [paths.user()]: profileDoc({ displayName: 'Rodrigo', rewardBudget: 300 }),
    [paths.habit('reading')]: habitDoc(),
    [paths.reward('anime')]: rewardDoc(ANIME),
    [paths.task('bill')]: taskDoc(),
    [paths.goal('exam')]: goalDoc(),
    [paths.reflection('2026-01-05')]: reflectionDoc('2026-01-05'),
    [paths.dailyLog(TWO_DAYS_AGO)]: {
      ...openLogDoc(TWO_DAYS_AGO),
      status: 'completed',
      summary: {},
    },
    [paths.monthlySummary('2026-01')]: { monthKey: '2026-01', ...created() },
    [paths.transaction('completion_1')]: transactionDoc({
      id: 'completion_1',
      type: 'habit_completion',
      amount: 10,
      balanceAfter: 10,
      dateKey: TWO_DAYS_AGO,
      sourceType: 'habit',
      sourceId: 'reading',
      description: 'Hábito cumplido: Leer',
    }),
    [paths.redemption('req1')]: { rewardId: 'anime', ...created() },
    [paths.gamification()]: gamificationDoc(
      pendingState({ pointsBalance: 340, lifetimePointsEarned: 400, currentStreak: 12 }),
    ),
    [paths.savings()]: savingsDoc(),
  });
}

describe('resetAccount', () => {
  it('deletes every collection and leaves a brand new account', async () => {
    await seedAccount();
    const db = ownerDb();

    await resetAccount(db, user);

    for (const name of RESET_COLLECTIONS) {
      expect(await documentsIn(name)).toEqual([]);
    }
    // Solo quedan el perfil y el estado, como al abrir la cuenta por primera vez.
    expect((await getDoc(doc(db, paths.savings()))).exists()).toBe(false);
    expect((await getDoc(doc(db, paths.reset()))).exists()).toBe(false);
    expect((await getDoc(doc(db, paths.user()))).data()).toMatchObject({
      email: OWNER_EMAIL,
      displayName: 'owner',
    });
    expect((await getDoc(doc(db, paths.user()))).data()).not.toHaveProperty('rewardBudget');
    expect((await getDoc(doc(db, paths.gamification()))).data()).toMatchObject({
      pointsBalance: 0,
      currentStreak: 0,
      longestStreak: 0,
    });
  });

  it('starts the new account with yesterday as the last closed day', async () => {
    await seedAccount();
    await resetAccount(ownerDb(), user);
    const state = (await getDoc(doc(ownerDb(), paths.gamification()))).data();
    expect(state?.lastClosedDateKey).toBe(YESTERDAY);
  });

  it('works on an account that is already empty', async () => {
    await resetAccount(ownerDb(), user);
    expect((await getDoc(doc(ownerDb(), paths.gamification()))).exists()).toBe(true);
  });

  it('deletes more documents than fit in one batch', async () => {
    const db = ownerDb();
    // 450 movimientos: más que los 200 de un lote del reinicio y que los 500 de Firestore juntos
    // con el resto, así que pasa por varios lotes.
    await seedDocs({ [paths.gamification()]: gamificationDoc(pendingState()) });
    await seedDocs(
      Object.fromEntries(
        Array.from({ length: 450 }, (_, index) => [
          paths.transaction(`completion_${index}`),
          transactionDoc({
            id: `completion_${index}`,
            type: 'habit_completion',
            amount: 10,
            balanceAfter: 10,
            dateKey: TWO_DAYS_AGO,
            sourceType: 'habit',
            sourceId: 'reading',
            description: 'Hábito cumplido: Leer',
          }),
        ]),
      ),
    );

    await resetAccount(db, user);

    expect(await documentsIn('pointTransactions')).toEqual([]);
  });

  it('leaves the reset marker deleted', async () => {
    await seedAccount();
    await resetAccount(ownerDb(), user);
    expect((await getDoc(doc(ownerDb(), paths.reset()))).exists()).toBe(false);
  });

  it('does not touch another account', async () => {
    await seedAccount();
    await seedDocs({ [paths.habit('other-habit', 'other-uid')]: habitDoc() });

    await resetAccount(ownerDb(), user);

    const left = await getDoc(doc(otherDb(), paths.habit('other-habit', 'other-uid')));
    expect(left.exists()).toBe(true);
  });
});
