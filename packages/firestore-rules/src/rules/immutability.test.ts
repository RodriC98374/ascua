import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';

import { ownerDb, useRulesTestEnvironment } from '../support/env';
import { created, paths, seedDocs, TODAY } from '../support/fixtures';

useRulesTestEnvironment();

const TRANSACTION = paths.transaction('freeze_req-1');
const REDEMPTION = paths.redemption('req-2');

describe('ledger immutability', () => {
  beforeEach(async () => {
    await seedDocs({
      [TRANSACTION]: {
        type: 'streak_freeze_purchase',
        amount: -150,
        balanceAfter: 50,
        dateKey: TODAY,
        sourceType: 'streak_freeze',
        sourceId: 'req-1',
        description: 'Protector de racha',
        ...created(),
      },
      [REDEMPTION]: {
        rewardId: 'anime',
        rewardSnapshot: { name: 'Tarde de anime', tier: 'small', cost: 60 },
        pointTransactionId: 'redemption_req-2',
        dateKey: TODAY,
        redeemedAt: serverTimestamp(),
        note: null,
        ...created(),
      },
    });
  });

  it('lets the owner read transactions and redemptions', async () => {
    await assertSucceeds(getDoc(doc(ownerDb(), TRANSACTION)));
    await assertSucceeds(getDoc(doc(ownerDb(), REDEMPTION)));
  });

  it('never edits a transaction', async () => {
    await assertFails(updateDoc(doc(ownerDb(), TRANSACTION), { amount: 150 }));
  });

  it('never deletes a transaction', async () => {
    await assertFails(deleteDoc(doc(ownerDb(), TRANSACTION)));
  });

  it('never edits a redemption', async () => {
    await assertFails(updateDoc(doc(ownerDb(), REDEMPTION), { note: 'Cambiado' }));
  });

  it('never deletes a redemption', async () => {
    await assertFails(deleteDoc(doc(ownerDb(), REDEMPTION)));
  });
});
