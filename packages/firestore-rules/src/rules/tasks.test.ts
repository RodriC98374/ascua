import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import {
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { describe, it } from 'vitest';

import { otherDb, ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  paths,
  seedDocs,
  taskDoc,
  TODAY,
  TOMORROW,
  TWO_DAYS_AGO,
  YESTERDAY,
} from '../support/fixtures';

useRulesTestEnvironment();

const task = (id = 'bill') => doc(ownerDb(), paths.task(id));
const pastInstant = Timestamp.fromDate(new Date('2026-01-01T12:00:00Z'));

/** Tarea ya guardada (creada hace días) antes de cada caso. */
async function seedTask(overrides: Record<string, unknown> = {}, id = 'bill') {
  await seedDocs({
    [paths.task(id)]: taskDoc({
      dueDateKey: TWO_DAYS_AGO,
      createdAt: pastInstant,
      updatedAt: pastInstant,
      ...overrides,
    }),
  });
}

const touched = () => ({ updatedAt: serverTimestamp() });

describe('tasks create', () => {
  it('creates a pending task for today or a later day', async () => {
    await assertSucceeds(setDoc(task('a'), taskDoc()));
    await assertSucceeds(setDoc(task('b'), taskDoc({ dueDateKey: TOMORROW, size: 'large' })));
  });

  it('rejects a task due in the past', async () => {
    await assertFails(setDoc(task(), taskDoc({ dueDateKey: YESTERDAY })));
  });

  it('must be created pending', async () => {
    await assertFails(
      setDoc(task(), taskDoc({ completedDateKey: TODAY, completedAt: serverTimestamp() })),
    );
  });

  it('validates types, enums and lengths', async () => {
    await assertFails(setDoc(task(), taskDoc({ title: '' })));
    await assertFails(setDoc(task(), taskDoc({ title: 'x'.repeat(81) })));
    await assertFails(setDoc(task(), taskDoc({ size: 'huge' })));
    await assertFails(setDoc(task(), taskDoc({ dueDateKey: '2026-02-30' })));
    await assertFails(setDoc(task(), taskDoc({ points: 100 })));
  });

  it('keeps each user in their own tasks', async () => {
    await assertFails(setDoc(doc(otherDb(), paths.task('bill')), taskDoc()));
    await seedTask();
    await assertFails(getDoc(doc(otherDb(), paths.task('bill'))));
    await assertSucceeds(getDoc(task()));
  });
});

describe('tasks update', () => {
  it('edits title, size and moves the date to today or later', async () => {
    await seedTask();
    await assertSucceeds(
      updateDoc(task(), { title: 'Pagar el agua', size: 'small', ...touched() }),
    );
    await assertSucceeds(updateDoc(task(), { dueDateKey: TOMORROW, ...touched() }));
  });

  it('keeps an overdue date when editing other fields, but never moves a date into the past', async () => {
    await seedTask();
    await assertSucceeds(updateDoc(task(), { title: 'Sigue vencida', ...touched() }));
    await assertFails(updateDoc(task(), { dueDateKey: YESTERDAY, ...touched() }));
  });

  it('completes a task today, with the server instant', async () => {
    await seedTask();
    await assertSucceeds(
      updateDoc(task(), {
        completedDateKey: TODAY,
        completedAt: serverTimestamp(),
        ...touched(),
      }),
    );
  });

  it('never completes a task on another day or with a made-up instant', async () => {
    await seedTask();
    await assertFails(
      updateDoc(task(), {
        completedDateKey: YESTERDAY,
        completedAt: serverTimestamp(),
        ...touched(),
      }),
    );
    await assertFails(
      updateDoc(task(), { completedDateKey: TODAY, completedAt: pastInstant, ...touched() }),
    );
    await assertFails(updateDoc(task(), { completedDateKey: TODAY, ...touched() }));
  });

  it('unchecks a task completed today', async () => {
    await seedTask({ completedDateKey: TODAY, completedAt: pastInstant });
    await assertSucceeds(
      updateDoc(task(), { completedDateKey: null, completedAt: null, ...touched() }),
    );
  });

  it('locks a task completed on a past day: its points are already in the history', async () => {
    await seedTask({ completedDateKey: YESTERDAY, completedAt: pastInstant });
    await assertFails(
      updateDoc(task(), { completedDateKey: null, completedAt: null, ...touched() }),
    );
    await assertFails(updateDoc(task(), { title: 'Otra cosa', ...touched() }));
  });

  it('keeps createdAt and schemaVersion', async () => {
    await seedTask();
    await assertFails(updateDoc(task(), { createdAt: serverTimestamp(), ...touched() }));
    await assertFails(updateDoc(task(), { schemaVersion: 2, ...touched() }));
  });
});

describe('tasks delete', () => {
  it('deletes a pending task or one completed today', async () => {
    await seedTask({}, 'pending');
    await seedTask({ completedDateKey: TODAY, completedAt: pastInstant }, 'today');
    await assertSucceeds(deleteDoc(task('pending')));
    await assertSucceeds(deleteDoc(task('today')));
  });

  it('never deletes a task completed on a past day', async () => {
    await seedTask({ completedDateKey: YESTERDAY, completedAt: pastInstant });
    await assertFails(deleteDoc(task()));
  });
});
