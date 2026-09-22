import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';

import { ownerDb, useRulesTestEnvironment } from '../support/env';
import { done, openLogDoc, paths, seedDocs, TODAY, TOMORROW, YESTERDAY } from '../support/fixtures';

useRulesTestEnvironment();

const log = (dateKey: string) => doc(ownerDb(), paths.dailyLog(dateKey));
const mark = (habitId: string, completed = true) => ({
  [`entries.${habitId}`]: { completed, updatedAt: serverTimestamp() },
  updatedAt: serverTimestamp(),
});

describe('dailyLogs create', () => {
  it("creates today's log open and without summary", async () => {
    await assertSucceeds(setDoc(log(TODAY), openLogDoc(TODAY, done('reading'))));
  });

  it('rejects creating yesterday or tomorrow (no grace period)', async () => {
    await assertFails(setDoc(log(YESTERDAY), openLogDoc(YESTERDAY)));
    await assertFails(setDoc(log(TOMORROW), openLogDoc(TOMORROW)));
  });

  it('rejects a log created already closed or with a summary', async () => {
    await assertFails(setDoc(log(TODAY), { ...openLogDoc(TODAY), status: 'completed' }));
    await assertFails(setDoc(log(TODAY), { ...openLogDoc(TODAY), summary: { pointsEarned: 50 } }));
  });

  it('requires the dateKey field to match the document ID', async () => {
    await assertFails(setDoc(log(TODAY), { ...openLogDoc(TODAY), dateKey: YESTERDAY }));
  });
});

describe('dailyLogs update of entries', () => {
  it("marks and unmarks habits on today's log", async () => {
    await seedDocs({ [paths.dailyLog(TODAY)]: openLogDoc(TODAY) });
    await assertSucceeds(updateDoc(log(TODAY), mark('reading')));
    await assertSucceeds(updateDoc(log(TODAY), mark('reading', false)));
  });

  it("rejects marking yesterday's log, even if it is still open", async () => {
    await seedDocs({ [paths.dailyLog(YESTERDAY)]: openLogDoc(YESTERDAY) });
    await assertFails(updateDoc(log(YESTERDAY), mark('reading')));
  });

  it('rejects changing status or summary together with the entries', async () => {
    await seedDocs({ [paths.dailyLog(TODAY)]: openLogDoc(TODAY) });
    await assertFails(updateDoc(log(TODAY), { ...mark('reading'), status: 'completed' }));
    await assertFails(updateDoc(log(TODAY), { ...mark('reading'), summary: { pointsEarned: 50 } }));
  });

  it('never deletes a log', async () => {
    await seedDocs({ [paths.dailyLog(TODAY)]: openLogDoc(TODAY) });
    await assertFails(deleteDoc(log(TODAY)));
  });
});
