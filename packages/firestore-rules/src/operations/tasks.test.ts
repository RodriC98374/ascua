import { assertFails } from '@firebase/rules-unit-testing';
import { getDoc, getDocs, Timestamp } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { taskRef, tasksCollection } from '../../../../apps/client/src/data/documents';
import {
  createTask,
  deleteTask,
  moveTask,
  setTaskCompletion,
  updateTask,
} from '../../../../apps/client/src/operations/tasks';
import { OWNER, ownerDb, useRulesTestEnvironment } from '../support/env';
import { paths, seedDocs, taskDoc, TODAY, TOMORROW, YESTERDAY } from '../support/fixtures';

useRulesTestEnvironment();

/** La lee con el converter, como la recibe la interfaz. */
async function loadTask(taskId: string) {
  return (await getDoc(taskRef(ownerDb(), OWNER, taskId))).data();
}

const bill = { title: '  Pagar la luz ', size: 'medium' as const, dueDateKey: TODAY };

describe('task operations', () => {
  it('creates a pending task with clean text, created today', async () => {
    const { taskId, write } = createTask(ownerDb(), OWNER, bill);
    await write;
    expect(await loadTask(taskId)).toEqual({
      id: taskId,
      title: 'Pagar la luz',
      size: 'medium',
      dueDateKey: TODAY,
      completedDateKey: null,
      createdDateKey: TODAY,
    });
  });

  it('edits and moves a task', async () => {
    const db = ownerDb();
    const { taskId, write } = createTask(db, OWNER, bill);
    await write;
    await updateTask(db, OWNER, taskId, {
      title: 'Pagar el agua',
      size: 'small',
      dueDateKey: TODAY,
    });
    await moveTask(db, OWNER, taskId, TOMORROW);
    expect(await loadTask(taskId)).toMatchObject({
      title: 'Pagar el agua',
      size: 'small',
      dueDateKey: TOMORROW,
    });
  });

  it('completes and unchecks a task today', async () => {
    const db = ownerDb();
    const { taskId, write } = createTask(db, OWNER, bill);
    await write;
    await setTaskCompletion(db, OWNER, taskId, true, TODAY);
    expect((await loadTask(taskId))?.completedDateKey).toBe(TODAY);
    await setTaskCompletion(db, OWNER, taskId, false, TODAY);
    expect((await loadTask(taskId))?.completedDateKey).toBeNull();
  });

  it('deletes a pending task', async () => {
    const db = ownerDb();
    const { taskId, write } = createTask(db, OWNER, bill);
    await write;
    await deleteTask(db, OWNER, taskId);
    expect((await getDocs(tasksCollection(db, OWNER))).empty).toBe(true);
  });

  it('cannot touch a task completed on a past day', async () => {
    const past = Timestamp.fromDate(new Date('2026-01-01T12:00:00Z'));
    await seedDocs({
      [paths.task('done')]: taskDoc({
        dueDateKey: YESTERDAY,
        completedDateKey: YESTERDAY,
        completedAt: past,
        createdAt: past,
        updatedAt: past,
      }),
    });
    const db = ownerDb();
    await assertFails(setTaskCompletion(db, OWNER, 'done', false, TODAY));
    await assertFails(deleteTask(db, OWNER, 'done'));
    expect(await loadTask('done')).toMatchObject({
      completedDateKey: YESTERDAY,
      createdDateKey: '2026-01-01',
    });
  });
});
