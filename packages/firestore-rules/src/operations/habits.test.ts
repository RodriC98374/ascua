import { assertFails } from '@firebase/rules-unit-testing';
import { getDoc, getDocs, orderBy, query } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { habitRef, habitsCollection } from '../../../../apps/client/src/data/documents';
import {
  archiveHabit,
  createHabit,
  reorderHabits,
  updateHabit,
  type NewHabitInput,
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

const reading: NewHabitInput = {
  name: '  Leer 20 minutos ',
  description: '  ',
  tier: 'primary',
  category: 'academic',
  icon: null,
  color: '#A3C4D9',
  schedule: { type: 'daily' },
  target: null,
  reminder: null,
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

  it('creates habits on fixed days, several times per week and with a daily target', async () => {
    const db = ownerDb();
    const gym = createHabit(
      db,
      OWNER,
      { ...reading, name: 'Gimnasio', schedule: { type: 'days_of_week', daysOfWeek: [1, 3, 5] } },
      0,
      TODAY,
    );
    const swim = createHabit(
      db,
      OWNER,
      { ...reading, name: 'Nadar', schedule: { type: 'times_per_week', timesPerWeek: 2 } },
      1,
      TODAY,
    );
    const water = createHabit(
      db,
      OWNER,
      { ...reading, name: 'Agua', target: { amount: 8, unit: ' vasos ' } },
      2,
      TODAY,
    );
    await Promise.all([gym.write, swim.write, water.write]);

    expect(await loadHabit(gym.habitId)).toMatchObject({
      schedule: { type: 'days_of_week', daysOfWeek: [1, 3, 5] },
      target: null,
    });
    expect(await loadHabit(swim.habitId)).toMatchObject({
      schedule: { type: 'times_per_week', timesPerWeek: 2 },
    });
    expect(await loadHabit(water.habitId)).toMatchObject({
      schedule: { type: 'daily' },
      target: { amount: 8, unit: 'vasos' },
    });
  });

  it('saves the chosen icon, lets it change and falls back to the default without one', async () => {
    const db = ownerDb();
    const { habitId, write } = createHabit(db, OWNER, { ...reading, icon: 'book-open' }, 0, TODAY);
    await write;
    expect(await loadHabit(habitId)).toMatchObject({ icon: 'book-open' });

    await updateHabit(db, OWNER, habitId, { ...reading, icon: 'library' });
    expect(await loadHabit(habitId)).toMatchObject({ icon: 'library' });

    await updateHabit(db, OWNER, habitId, { ...reading, icon: null });
    expect(await loadHabit(habitId)).toMatchObject({ icon: 'check' });
  });

  it('keeps the target when editing the rest of the habit', async () => {
    const db = ownerDb();
    const { habitId, write } = createHabit(
      db,
      OWNER,
      { ...reading, target: { amount: 8, unit: 'vasos' } },
      0,
      TODAY,
    );
    await write;
    await updateHabit(db, OWNER, habitId, { ...reading, name: 'Agua' });
    expect(await loadHabit(habitId)).toMatchObject({
      name: 'Agua',
      target: { amount: 8, unit: 'vasos' },
    });
  });

  it('creates a habit with its reminder, with the days in order', async () => {
    const db = ownerDb();
    const { habitId, write } = createHabit(
      db,
      OWNER,
      { ...reading, reminder: { time: '19:30', daysOfWeek: [5, 1, 3] } },
      0,
      TODAY,
    );
    await write;
    expect(await loadHabit(habitId)).toMatchObject({
      reminder: { time: '19:30', daysOfWeek: [1, 3, 5] },
    });
  });

  it('adds, changes and removes the reminder when editing', async () => {
    const db = ownerDb();
    const { habitId, write } = createHabit(db, OWNER, reading, 0, TODAY);
    await write;
    expect(await loadHabit(habitId)).toMatchObject({ reminder: null });

    await updateHabit(db, OWNER, habitId, {
      ...reading,
      reminder: { time: '07:00', daysOfWeek: [7] },
    });
    expect(await loadHabit(habitId)).toMatchObject({
      reminder: { time: '07:00', daysOfWeek: [7] },
    });
    await updateHabit(db, OWNER, habitId, {
      ...reading,
      reminder: { time: '21:05', daysOfWeek: [2, 4] },
    });
    expect(await loadHabit(habitId)).toMatchObject({
      reminder: { time: '21:05', daysOfWeek: [2, 4] },
    });
    await updateHabit(db, OWNER, habitId, { ...reading, reminder: null });
    expect(await loadHabit(habitId)).toMatchObject({ reminder: null });
  });

  it('is rejected when the reminder uses a day the habit does not have', async () => {
    const { write } = createHabit(
      ownerDb(),
      OWNER,
      {
        ...reading,
        schedule: { type: 'days_of_week', daysOfWeek: [1, 3] },
        reminder: { time: '08:00', daysOfWeek: [2] },
      },
      0,
      TODAY,
    );
    await assertFails(write);
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
      icon: null,
      color: '#C4B2DE',
      reminder: null,
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

    it('reads them without a target and edits them without adding one', async () => {
      await seedDocs({ [paths.habit('old')]: legacyHabit('old', 0) });
      const db = ownerDb();
      expect(await loadHabit('old')).toMatchObject({ target: null, reminder: null });
      await updateHabit(db, OWNER, 'old', { ...reading, name: 'Leer' });
      expect(await loadHabit('old')).toMatchObject({ name: 'Leer', target: null });
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
