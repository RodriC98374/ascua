import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';

import {
  anonymousDb,
  OTHER,
  otherDb,
  ownerDb,
  STRANGER,
  strangerDb,
  useRulesTestEnvironment,
} from '../support/env';
import { habitDoc, paths, profileDoc, seedDocs } from '../support/fixtures';

useRulesTestEnvironment();

describe('access', () => {
  beforeEach(async () => {
    await seedDocs({ [paths.user()]: profileDoc(), [paths.habit('read')]: habitDoc() });
  });

  it('lets the owner read their own data', async () => {
    await assertSucceeds(getDoc(doc(ownerDb(), paths.user())));
    await assertSucceeds(getDoc(doc(ownerDb(), paths.habit('read'))));
  });

  it('denies everything to unauthenticated users', async () => {
    await assertFails(getDoc(doc(anonymousDb(), paths.user())));
    await assertFails(getDoc(doc(anonymousDb(), paths.habit('read'))));
    await assertFails(setDoc(doc(anonymousDb(), paths.habit('new')), habitDoc()));
  });

  it("denies another allowed user access to the owner's data", async () => {
    await assertFails(getDoc(doc(otherDb(), paths.user())));
    await assertFails(getDoc(doc(otherDb(), paths.habit('read'))));
    await assertFails(setDoc(doc(otherDb(), paths.habit('new')), habitDoc()));
  });

  it('denies a user outside the allowlist even on their own path', async () => {
    await assertFails(getDoc(doc(strangerDb(), paths.user(STRANGER))));
    await assertFails(
      setDoc(
        doc(strangerDb(), paths.user(STRANGER)),
        profileDoc({ email: 'stranger@example.com' }),
      ),
    );
    await assertFails(setDoc(doc(strangerDb(), paths.habit('new', STRANGER)), habitDoc()));
  });

  it('lets another allowed user use their own space', async () => {
    await assertSucceeds(
      setDoc(doc(otherDb(), paths.user(OTHER)), profileDoc({ email: 'other@example.com' })),
    );
  });

  it('denies documents outside users/{uid}', async () => {
    await assertFails(setDoc(doc(ownerDb(), 'config/app'), { open: true }));
    await assertFails(getDoc(doc(ownerDb(), 'config/app')));
  });
});
