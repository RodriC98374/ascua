import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteField, doc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';

import { otherDb, ownerDb, useRulesTestEnvironment } from '../support/env';
import { created, paths, seedDocs, TODAY } from '../support/fixtures';

useRulesTestEnvironment();

const UNUSED = paths.redemption('req-1');
const USED = paths.redemption('req-2');

function redemption(id: string) {
  return {
    rewardId: 'anime',
    rewardSnapshot: { name: 'Tarde de anime', tier: 'small', cost: 60 },
    pointTransactionId: `redemption_${id}`,
    dateKey: TODAY,
    redeemedAt: serverTimestamp(),
    note: null,
    ...created(),
  };
}

const markUsed = { usedAt: serverTimestamp(), updatedAt: serverTimestamp() };

describe('trophies: marking a redemption as used (fase 21)', () => {
  beforeEach(async () => {
    await seedDocs({
      [UNUSED]: redemption('req-1'),
      [USED]: { ...redemption('req-2'), usedAt: serverTimestamp() },
    });
  });

  it('marks an unused redemption as used at the server time', async () => {
    await assertSucceeds(updateDoc(doc(ownerDb(), UNUSED), markUsed));
  });

  it('rejects a used date that is not the server time', async () => {
    await assertFails(
      updateDoc(doc(ownerDb(), UNUSED), {
        usedAt: Timestamp.fromDate(new Date('2026-01-01T12:00:00Z')),
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('rejects an empty used date', async () => {
    await assertFails(
      updateDoc(doc(ownerDb(), UNUSED), { usedAt: null, updatedAt: serverTimestamp() }),
    );
  });

  it('requires touching updatedAt', async () => {
    await assertFails(updateDoc(doc(ownerDb(), UNUSED), { usedAt: serverTimestamp() }));
  });

  it('changes nothing else while marking it', async () => {
    await assertFails(updateDoc(doc(ownerDb(), UNUSED), { ...markUsed, note: 'Con amigos' }));
    await assertFails(
      updateDoc(doc(ownerDb(), UNUSED), {
        ...markUsed,
        rewardSnapshot: { name: 'Tarde de anime', tier: 'small', cost: 1 },
      }),
    );
  });

  it('does not mark a redemption twice nor undo it', async () => {
    await assertFails(updateDoc(doc(ownerDb(), USED), markUsed));
    await assertFails(
      updateDoc(doc(ownerDb(), USED), { usedAt: deleteField(), updatedAt: serverTimestamp() }),
    );
  });

  it('only lets the owner mark it', async () => {
    await assertFails(updateDoc(doc(otherDb(), UNUSED), markUsed));
  });
});
