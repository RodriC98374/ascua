import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { describe, it } from 'vitest';

import { ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  done,
  gamificationDoc,
  openLogDoc,
  paths,
  pendingState,
  seedDocs,
  TODAY,
  TOMORROW,
  TWO_DAYS_AGO,
  YESTERDAY,
} from '../support/fixtures';

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

  describe('yesterday, the grace day', () => {
    it("creates yesterday's log open while its close is still pending", async () => {
      await seedDocs({ [paths.gamification()]: gamificationDoc(pendingState()) });
      await assertSucceeds(setDoc(log(YESTERDAY), openLogDoc(YESTERDAY, done('reading'))));
    });

    it('rejects it once yesterday is closed: a new account starts with yesterday closed', async () => {
      await seedDocs({
        [paths.gamification()]: gamificationDoc(pendingState({ lastClosedDateKey: YESTERDAY })),
      });
      await assertFails(setDoc(log(YESTERDAY), openLogDoc(YESTERDAY, done('reading'))));
    });

    it('rejects it without an account state to tell whether yesterday is closed', async () => {
      await assertFails(setDoc(log(YESTERDAY), openLogDoc(YESTERDAY, done('reading'))));
    });

    it('rejects a check-in on it: only habit marks are allowed', async () => {
      await seedDocs({ [paths.gamification()]: gamificationDoc(pendingState()) });
      await assertFails(setDoc(log(YESTERDAY), { ...openLogDoc(YESTERDAY), checkIn: { mood: 3 } }));
    });
  });

  it('rejects creating tomorrow or two days ago', async () => {
    await seedDocs({ [paths.gamification()]: gamificationDoc(pendingState()) });
    await assertFails(setDoc(log(TOMORROW), openLogDoc(TOMORROW)));
    await assertFails(setDoc(log(TWO_DAYS_AGO), openLogDoc(TWO_DAYS_AGO)));
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

  it("marks and unmarks habits on yesterday's open log (the grace day)", async () => {
    await seedDocs({ [paths.dailyLog(YESTERDAY)]: openLogDoc(YESTERDAY) });
    await assertSucceeds(updateDoc(log(YESTERDAY), mark('reading')));
    await assertSucceeds(updateDoc(log(YESTERDAY), mark('reading', false)));
  });

  it("rejects the check-in on yesterday's log", async () => {
    await seedDocs({ [paths.dailyLog(YESTERDAY)]: openLogDoc(YESTERDAY) });
    await assertFails(
      updateDoc(log(YESTERDAY), { 'checkIn.mood': 3, updatedAt: serverTimestamp() }),
    );
  });

  it('rejects marking two days ago, even if its log is still open', async () => {
    await seedDocs({ [paths.dailyLog(TWO_DAYS_AGO)]: openLogDoc(TWO_DAYS_AGO) });
    await assertFails(updateDoc(log(TWO_DAYS_AGO), mark('reading')));
  });

  it('rejects marking yesterday once its log is closed', async () => {
    await seedDocs({
      [paths.dailyLog(YESTERDAY)]: { ...openLogDoc(YESTERDAY), status: 'completed', summary: {} },
    });
    await assertFails(updateDoc(log(YESTERDAY), mark('reading')));
  });

  it("rejects changing yesterday's status or summary with the marks", async () => {
    await seedDocs({ [paths.dailyLog(YESTERDAY)]: openLogDoc(YESTERDAY) });
    await assertFails(updateDoc(log(YESTERDAY), { ...mark('reading'), status: 'completed' }));
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
