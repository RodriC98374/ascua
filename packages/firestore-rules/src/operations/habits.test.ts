import { assertFails } from '@firebase/rules-unit-testing';
import { getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { habitRef, habitsCollection } from '../../../../apps/client/src/data/documents';
import {
  archiveHabit,
  createHabit,
  reorderHabits,
  updateHabit,
} from '../../../../apps/client/src/operations/habits';
import { OWNER, ownerDb, useRulesTestEnvironment } from '../support/env';
import { TODAY } from '../support/fixtures';

useRulesTestEnvironment();

const reading = { name: '  Leer 20 minutos ', description: '  ', tier: 'primary' as const };

describe('habit operations', () => {
  it('creates a habit that counts from today, with clean text', async () => {
    const db = ownerDb();
    const { habitId, write } = createHabit(db, OWNER, reading, 0, TODAY);
    await write;

    const habit = await getDoc(habitRef(db, OWNER, habitId));
    expect(habit.data()).toMatchObject({
      id: habitId,
      name: 'Leer 20 minutos',
      description: null,
      tier: 'primary',
      schedule: { type: 'daily' },
      status: 'active',
      sortOrder: 0,
      startDateKey: TODAY,
      archivedDateKey: null,
    });
  });

  it('edits name, description and tier', async () => {
    const db = ownerDb();
    const { habitId, write } = createHabit(db, OWNER, reading, 0, TODAY);
    await write;
    await updateHabit(db, OWNER, habitId, {
      name: 'Leer 30 minutos',
      description: 'Antes de dormir',
      tier: 'secondary',
    });

    const habit = await getDoc(habitRef(db, OWNER, habitId));
    expect(habit.data()).toMatchObject({
      name: 'Leer 30 minutos',
      description: 'Antes de dormir',
      tier: 'secondary',
    });
  });

  it('archives with today as the last day', async () => {
    const db = ownerDb();
    const { habitId, write } = createHabit(db, OWNER, reading, 0, TODAY);
    await write;
    await archiveHabit(db, OWNER, habitId, TODAY);

    const habit = await getDoc(habitRef(db, OWNER, habitId));
    expect(habit.data()).toMatchObject({ status: 'archived', archivedDateKey: TODAY });
  });

  it('reorders several habits at once', async () => {
    const db = ownerDb();
    const ids: string[] = [];
    for (const [index, name] of ['A', 'B', 'C'].entries()) {
      const { habitId, write } = createHabit(db, OWNER, { ...reading, name }, index, TODAY);
      await write;
      ids.push(habitId);
    }
    await reorderHabits(db, OWNER, [ids[2]!, ids[0]!, ids[1]!]);

    const ordered = await getDocs(query(habitsCollection(db, OWNER), orderBy('sortOrder')));
    expect(ordered.docs.map((snapshot) => snapshot.data().name)).toEqual(['C', 'A', 'B']);
  });

  it('is rejected when the name is too long', async () => {
    const { write } = createHabit(ownerDb(), OWNER, { ...reading, name: 'x'.repeat(61) }, 0, TODAY);
    await assertFails(write);
  });
});
