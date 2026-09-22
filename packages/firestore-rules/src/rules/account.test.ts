import { initialGamificationState } from '@ascua/shared';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';

import { ownerDb, useRulesTestEnvironment } from '../support/env';
import { gamificationDoc, paths, seedState, TODAY, TWO_DAYS_AGO } from '../support/fixtures';

useRulesTestEnvironment();

const gamification = () => doc(ownerDb(), paths.gamification());
const initial = () => initialGamificationState(TODAY);

describe('initializeAccount (meta/gamification create)', () => {
  it('creates the initial state', async () => {
    await assertSucceeds(setDoc(gamification(), gamificationDoc(initial())));
  });

  it('rejects starting with points, streak or freezes', async () => {
    await assertFails(
      setDoc(gamification(), gamificationDoc({ ...initial(), pointsBalance: 500 })),
    );
    await assertFails(
      setDoc(
        gamification(),
        gamificationDoc({ ...initial(), currentStreak: 30, longestStreak: 30 }),
      ),
    );
    await assertFails(
      setDoc(gamification(), gamificationDoc({ ...initial(), streakFreezesAvailable: 2 })),
    );
  });

  it('requires yesterday as the last closed day', async () => {
    await assertFails(
      setDoc(gamification(), gamificationDoc({ ...initial(), lastClosedDateKey: TODAY })),
    );
    await assertFails(
      setDoc(gamification(), gamificationDoc({ ...initial(), lastClosedDateKey: TWO_DAYS_AGO })),
    );
  });

  it('rejects documents other than gamification under meta', async () => {
    await assertFails(
      setDoc(doc(ownerDb(), 'users/owner-uid/meta/other'), gamificationDoc(initial())),
    );
  });
});

describe('meta/gamification outside the operations', () => {
  it('rejects editing the balance directly', async () => {
    await seedState(initial());
    await assertFails(
      updateDoc(gamification(), { pointsBalance: 1000, updatedAt: serverTimestamp() }),
    );
  });

  it('rejects adding freezes without paying', async () => {
    await seedState(initial());
    await assertFails(
      updateDoc(gamification(), { streakFreezesAvailable: 2, updatedAt: serverTimestamp() }),
    );
  });

  it('never deletes the state', async () => {
    await seedState(initial());
    await assertFails(deleteDoc(gamification()));
  });
});
