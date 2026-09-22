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
import { created, paths, seedDocs, TODAY } from '../support/fixtures';

useRulesTestEnvironment();

/** Los lee con el converter, que es como los recibe la interfaz antes de llamar a una operación. */
async function loadHabit(habitId: string) {
  const habit = await getDoc(habitRef(ownerDb(), OWNER, habitId));
  return habit.data()!;
}

async function loadHabits() {
  const habits = await getDocs(habitsCollection(ownerDb(), OWNER));
  return habits.docs.map((snapshot) => snapshot.data());
}

const reading = {
  name: '  Leer 20 minutos ',
  description: '  ',
  tier: 'primary' as const,
  category: 'academic' as const,
  color: '#A3C4D9' as const,
};

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

  it('edits name, description, tier, category and color', async () => {
    const db = ownerDb();
    const { habitId, write } = createHabit(db, OWNER, reading, 0, TODAY);
    await write;
    await updateHabit(db, OWNER, habitId, {
      name: 'Leer 30 minutos',
      description: 'Antes de dormir',
      tier: 'secondary',
      category: 'mental',
      color: '#C4B2DE',
    });

    const habit = await getDoc(habitRef(db, OWNER, habitId));
    expect(habit.data()).toMatchObject({
      category: 'mental',
      color: '#C4B2DE',
      name: 'Leer 30 minutos',
      description: 'Antes de dormir',
      tier: 'secondary',
    });
  });

  it('archives with today as the last day', async () => {
    const db = ownerDb();
    const { habitId, write } = createHabit(db, OWNER, reading, 0, TODAY);
    await write;
    await archiveHabit(db, OWNER, await loadHabit(habitId), TODAY);

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
    await reorderHabits(db, OWNER, [ids[2]!, ids[0]!, ids[1]!], await loadHabits());

    const ordered = await getDocs(query(habitsCollection(db, OWNER), orderBy('sortOrder')));
    expect(ordered.docs.map((snapshot) => snapshot.data().name)).toEqual(['C', 'A', 'B']);
  });

  it('is rejected when the name is too long', async () => {
    const { write } = createHabit(ownerDb(), OWNER, { ...reading, name: 'x'.repeat(61) }, 0, TODAY);
    await assertFails(write);
  });

  // Los hábitos creados antes de que existieran las categorías no traen `category`, y las reglas
  // la exigen: archivarlos o reordenarlos tiene que completarla en la misma escritura.
  describe('habits saved before categories existed', () => {
    const legacyHabit = (id: string, sortOrder: number) => ({
      name: `Antiguo ${id}`,
      description: null,
      icon: 'check',
      color: '#FF6B35',
      tier: 'secondary',
      schedule: { type: 'daily' },
      status: 'active',
      sortOrder,
      startDateKey: '2026-01-01',
      archivedDateKey: null,
      ...created(),
    });

    it('archives one, completing its category', async () => {
      await seedDocs({ [paths.habit('old')]: legacyHabit('old', 0) });
      const db = ownerDb();
      await archiveHabit(db, OWNER, await loadHabit('old'), TODAY);

      const habit = await getDoc(habitRef(db, OWNER, 'old'));
      expect(habit.data()).toMatchObject({
        status: 'archived',
        archivedDateKey: TODAY,
        category: 'other',
      });
    });

    it('reorders them', async () => {
      await seedDocs({
        [paths.habit('old1')]: legacyHabit('old1', 0),
        [paths.habit('old2')]: legacyHabit('old2', 1),
      });
      const db = ownerDb();
      await reorderHabits(db, OWNER, ['old2', 'old1'], await loadHabits());

      const ordered = await getDocs(query(habitsCollection(db, OWNER), orderBy('sortOrder')));
      expect(ordered.docs.map((snapshot) => snapshot.id)).toEqual(['old2', 'old1']);
    });
  });
});
