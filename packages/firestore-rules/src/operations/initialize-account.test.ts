// La operación real de la app contra el emulador y las reglas reales.
import { initialGamificationState, initialUserProfile } from '@ascua/shared';
import { assertFails } from '@firebase/rules-unit-testing';
import { getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { gamificationRef, userProfileRef } from '../../../../apps/client/src/data/documents';
import { initializeAccount } from '../../../../apps/client/src/operations/initialize-account';
import {
  OWNER,
  OWNER_EMAIL,
  ownerDb,
  STRANGER,
  strangerDb,
  useRulesTestEnvironment,
} from '../support/env';
import { gamificationDoc, paths, seedDocs, TODAY } from '../support/fixtures';

useRulesTestEnvironment();

const owner = { uid: OWNER, email: OWNER_EMAIL };

describe('initializeAccount', () => {
  it('creates the profile and the initial state on the first sign-in', async () => {
    const db = ownerDb();
    await expect(initializeAccount(db, owner, TODAY)).resolves.toBe('created');

    const profile = await getDoc(userProfileRef(db, OWNER));
    const state = await getDoc(gamificationRef(db, OWNER));
    expect(profile.data()).toEqual(initialUserProfile(OWNER_EMAIL));
    expect(state.data()).toEqual(initialGamificationState(TODAY));
  });

  it('does nothing when the account already exists', async () => {
    const db = ownerDb();
    await initializeAccount(db, owner, TODAY);
    const before = await getDoc(userProfileRef(db, OWNER).withConverter(null));

    await expect(initializeAccount(db, owner, TODAY)).resolves.toBe('already_initialized');
    const after = await getDoc(userProfileRef(db, OWNER).withConverter(null));
    expect(after.data()).toEqual(before.data());
  });

  it('creates everything once when two devices sign in at the same time', async () => {
    const results = await Promise.all([
      initializeAccount(ownerDb(), owner, TODAY),
      initializeAccount(ownerDb(), owner, TODAY),
    ]);
    expect(results).toContain('created');

    const state = await getDoc(gamificationRef(ownerDb(), OWNER));
    expect(state.data()).toEqual(initialGamificationState(TODAY));
  });

  it('completes an account that only has its profile', async () => {
    await seedDocs({ [paths.user()]: { ...initialUserProfile(OWNER_EMAIL), schemaVersion: 1 } });
    await expect(initializeAccount(ownerDb(), owner, TODAY)).resolves.toBe('created');

    const state = await getDoc(gamificationRef(ownerDb(), OWNER));
    expect(state.data()).toEqual(initialGamificationState(TODAY));
  });

  it('never overwrites an existing state', async () => {
    const played = {
      ...initialGamificationState(TODAY),
      pointsBalance: 320,
      currentStreak: 5,
      longestStreak: 5,
    };
    await seedDocs({ [paths.gamification()]: gamificationDoc(played) });
    await initializeAccount(ownerDb(), owner, TODAY);

    const state = await getDoc(gamificationRef(ownerDb(), OWNER));
    expect(state.data()).toEqual(played);
  });

  it('is rejected for a user outside the allowlist', async () => {
    await assertFails(
      initializeAccount(strangerDb(), { uid: STRANGER, email: 'stranger@example.com' }, TODAY),
    );
  });
});
