import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';

import { ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  habitDoc,
  paths,
  rewardDoc,
  seedDocs,
  TODAY,
  TOMORROW,
  YESTERDAY,
} from '../support/fixtures';

useRulesTestEnvironment();

const habit = (id = 'reading') => doc(ownerDb(), paths.habit(id));
const reward = (id = 'anime') => doc(ownerDb(), paths.reward(id));

describe('habits create', () => {
  it('creates a valid habit starting today or later', async () => {
    await assertSucceeds(setDoc(habit('a'), habitDoc()));
    await assertSucceeds(
      setDoc(habit('b'), habitDoc({ startDateKey: TOMORROW, tier: 'secondary' })),
    );
  });

  it('rejects a habit that starts in the past', async () => {
    // Si no, un hábito nuevo podría cambiar el resultado de un día todavía sin cerrar.
    await assertFails(setDoc(habit(), habitDoc({ startDateKey: YESTERDAY })));
  });

  it('validates types, enums and lengths', async () => {
    await assertFails(setDoc(habit(), habitDoc({ tier: 'gold' })));
    await assertFails(setDoc(habit(), habitDoc({ name: '' })));
    await assertFails(setDoc(habit(), habitDoc({ name: 'x'.repeat(61) })));
    await assertFails(setDoc(habit(), habitDoc({ description: 'x'.repeat(201) })));
    await assertFails(setDoc(habit(), habitDoc({ color: 'purple' })));
    await assertFails(setDoc(habit(), habitDoc({ schedule: { type: 'weekly' } })));
    await assertFails(setDoc(habit(), habitDoc({ sortOrder: 1.5 })));
    await assertFails(setDoc(habit(), habitDoc({ points: 100 })));
  });

  it('accepts every known category', async () => {
    for (const category of ['health', 'physical', 'mental', 'academic', 'other']) {
      await assertSucceeds(setDoc(habit(category), habitDoc({ category })));
    }
  });

  it('rejects an unknown or missing category', async () => {
    await assertFails(setDoc(habit(), habitDoc({ category: 'salud' })));
    await assertFails(setDoc(habit(), habitDoc({ category: null })));
    const { category: _omitted, ...withoutCategory } = habitDoc();
    await assertFails(setDoc(habit(), withoutCategory));
  });

  it('must be created active and not archived', async () => {
    await assertFails(setDoc(habit(), habitDoc({ status: 'archived', archivedDateKey: TODAY })));
  });
});

describe('habit frequency and target (fase 16)', () => {
  const fixedDays = (daysOfWeek: unknown) => ({ schedule: { type: 'days_of_week', daysOfWeek } });
  const timesPerWeek = (times: unknown) => ({
    schedule: { type: 'times_per_week', timesPerWeek: times },
  });
  const target = (amount: unknown, unit: unknown = 'vasos') => ({ target: { amount, unit } });

  it('accepts fixed days of the week', async () => {
    await assertSucceeds(setDoc(habit('a'), habitDoc(fixedDays([1, 3, 5]))));
    await assertSucceeds(setDoc(habit('b'), habitDoc(fixedDays([7]))));
    await assertSucceeds(setDoc(habit('c'), habitDoc(fixedDays([1, 2, 3, 4, 5, 6]))));
  });

  it('rejects invalid fixed days', async () => {
    await assertFails(setDoc(habit(), habitDoc(fixedDays([]))));
    // Los siete días son "todos los días".
    await assertFails(setDoc(habit(), habitDoc(fixedDays([1, 2, 3, 4, 5, 6, 7]))));
    await assertFails(setDoc(habit(), habitDoc(fixedDays([0, 3]))));
    await assertFails(setDoc(habit(), habitDoc(fixedDays([3, 8]))));
    await assertFails(setDoc(habit(), habitDoc(fixedDays([1, 1]))));
    await assertFails(setDoc(habit(), habitDoc(fixedDays(['lunes']))));
    await assertFails(setDoc(habit(), habitDoc(fixedDays(3))));
    await assertFails(
      setDoc(
        habit(),
        habitDoc({ schedule: { type: 'days_of_week', daysOfWeek: [1], timesPerWeek: 2 } }),
      ),
    );
  });

  it('accepts from one to six times per week', async () => {
    await assertSucceeds(setDoc(habit('a'), habitDoc(timesPerWeek(1))));
    await assertSucceeds(setDoc(habit('b'), habitDoc(timesPerWeek(6))));
  });

  it('rejects invalid times per week', async () => {
    await assertFails(setDoc(habit(), habitDoc(timesPerWeek(0))));
    await assertFails(setDoc(habit(), habitDoc(timesPerWeek(7))));
    await assertFails(setDoc(habit(), habitDoc(timesPerWeek(2.5))));
    await assertFails(setDoc(habit(), habitDoc({ schedule: { type: 'times_per_week' } })));
  });

  it('accepts a daily target with its unit, or none', async () => {
    await assertSucceeds(setDoc(habit('a'), habitDoc(target(8))));
    await assertSucceeds(setDoc(habit('b'), habitDoc(target(999, 'x'.repeat(20)))));
    await assertSucceeds(setDoc(habit('c'), habitDoc({ target: null })));
    await assertSucceeds(setDoc(habit('d'), habitDoc({ ...target(3), ...timesPerWeek(2) })));
  });

  it('rejects an invalid target', async () => {
    await assertFails(setDoc(habit(), habitDoc(target(1))));
    await assertFails(setDoc(habit(), habitDoc(target(1000))));
    await assertFails(setDoc(habit(), habitDoc(target(2.5))));
    await assertFails(setDoc(habit(), habitDoc(target(8, ''))));
    await assertFails(setDoc(habit(), habitDoc(target(8, 'x'.repeat(21)))));
    await assertFails(setDoc(habit(), habitDoc({ target: { amount: 8 } })));
    await assertFails(setDoc(habit(), habitDoc({ target: { amount: 8, unit: 'vasos', max: 9 } })));
  });

  it('keeps frequency and target fixed after creating the habit', async () => {
    await seedDocs({ [paths.habit('reading')]: habitDoc({ startDateKey: '2026-01-01' }) });
    await assertFails(updateDoc(habit(), { ...timesPerWeek(3), updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(habit(), { ...target(8), updatedAt: serverTimestamp() }));

    await seedDocs({
      [paths.habit('water')]: habitDoc({ startDateKey: '2026-01-01', ...target(8) }),
    });
    await assertFails(updateDoc(habit('water'), { ...target(6), updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(habit('water'), { target: null, updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(habit('water'), { name: 'Agua', updatedAt: serverTimestamp() }));
  });
});

describe('habit reminder (fase 17)', () => {
  const reminder = (time: unknown, daysOfWeek: unknown) => ({ reminder: { time, daysOfWeek } });
  const fixedDays = (daysOfWeek: number[]) => ({ schedule: { type: 'days_of_week', daysOfWeek } });

  it('accepts a reminder with a time and chosen days, or none', async () => {
    await assertSucceeds(setDoc(habit('a'), habitDoc(reminder('07:30', [1, 3, 5]))));
    await assertSucceeds(setDoc(habit('b'), habitDoc(reminder('23:59', [1, 2, 3, 4, 5, 6, 7]))));
    await assertSucceeds(setDoc(habit('c'), habitDoc({ reminder: null })));
  });

  it('rejects a malformed time', async () => {
    await assertFails(setDoc(habit(), habitDoc(reminder('7:30', [1]))));
    await assertFails(setDoc(habit(), habitDoc(reminder('24:00', [1]))));
    await assertFails(setDoc(habit(), habitDoc(reminder(730, [1]))));
  });

  it('rejects empty, repeated or unknown days', async () => {
    await assertFails(setDoc(habit(), habitDoc(reminder('08:00', []))));
    await assertFails(setDoc(habit(), habitDoc(reminder('08:00', [2, 2]))));
    await assertFails(setDoc(habit(), habitDoc(reminder('08:00', [0]))));
    await assertFails(setDoc(habit(), habitDoc(reminder('08:00', [8]))));
    await assertFails(setDoc(habit(), habitDoc(reminder('08:00', 'lunes'))));
  });

  it('rejects extra or missing fields', async () => {
    await assertFails(setDoc(habit(), habitDoc({ reminder: { time: '08:00' } })));
    await assertFails(
      setDoc(habit(), habitDoc({ reminder: { time: '08:00', daysOfWeek: [1], sound: true } })),
    );
  });

  it('only allows the days of a days-of-week habit', async () => {
    await assertSucceeds(
      setDoc(habit('a'), habitDoc({ ...fixedDays([1, 3]), ...reminder('08:00', [3]) })),
    );
    await assertFails(
      setDoc(habit('b'), habitDoc({ ...fixedDays([1, 3]), ...reminder('08:00', [2]) })),
    );
  });

  it('can be added, changed and removed after creating the habit', async () => {
    await seedDocs({ [paths.habit('reading')]: habitDoc({ startDateKey: '2026-01-01' }) });
    await assertSucceeds(
      updateDoc(habit(), { ...reminder('20:00', [1, 2]), updatedAt: serverTimestamp() }),
    );
    await assertSucceeds(
      updateDoc(habit(), { ...reminder('21:15', [7]), updatedAt: serverTimestamp() }),
    );
    await assertSucceeds(updateDoc(habit(), { reminder: null, updatedAt: serverTimestamp() }));
    await assertFails(
      updateDoc(habit(), { ...reminder('25:00', [1]), updatedAt: serverTimestamp() }),
    );
  });
});

describe('habit steps (fase 21)', () => {
  const step = (id: unknown, title: unknown = `Paso ${String(id)}`) => ({ id, title });
  const steps = (count: number) => ({
    steps: Array.from({ length: count }, (_, index) => step(`s${index}`)),
  });

  it('accepts from two to six steps, or none', async () => {
    await assertSucceeds(setDoc(habit('a'), habitDoc(steps(2))));
    await assertSucceeds(setDoc(habit('b'), habitDoc(steps(6))));
    await assertSucceeds(setDoc(habit('c'), habitDoc({ steps: null })));
    await assertSucceeds(
      setDoc(habit('d'), habitDoc({ steps: [step('a', 'x'.repeat(60)), step('x'.repeat(20))] })),
    );
  });

  // Cada paso suma evaluaciones a la regla: el hábito más cargado tiene que seguir entrando en el
  // límite de Firestore, al crearlo y al editarlo.
  it('accepts the heaviest habit: fixed days, a reminder and six steps', async () => {
    const heavy = {
      schedule: { type: 'days_of_week', daysOfWeek: [1, 2, 3, 4, 5, 6] },
      reminder: { time: '21:00', daysOfWeek: [1, 2, 3, 4, 5, 6] },
      description: 'x'.repeat(200),
      ...steps(6),
    };
    await assertSucceeds(setDoc(habit('heavy'), habitDoc(heavy)));
    await seedDocs({ [paths.habit('old')]: habitDoc({ startDateKey: '2026-01-01', ...heavy }) });
    await assertSucceeds(
      updateDoc(habit('old'), {
        name: 'Rutina de noche',
        tier: 'secondary',
        steps: steps(6).steps.map((item) => ({ ...item, title: 'x'.repeat(60) })),
        reminder: { time: '22:15', daysOfWeek: [1, 2, 3, 4, 5, 6] },
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('rejects too few or too many steps', async () => {
    await assertFails(setDoc(habit(), habitDoc(steps(1))));
    await assertFails(setDoc(habit(), habitDoc(steps(7))));
    await assertFails(setDoc(habit(), habitDoc({ steps: [] })));
  });

  it('rejects something that is not a list of steps', async () => {
    await assertFails(setDoc(habit(), habitDoc({ steps: 'dientes, ropa' })));
    await assertFails(setDoc(habit(), habitDoc({ steps: { a: 'Dientes', b: 'Ropa' } })));
    await assertFails(setDoc(habit(), habitDoc({ steps: [step('a'), 'Ropa'] })));
  });

  it('validates the id and the title of every step', async () => {
    await assertFails(setDoc(habit(), habitDoc({ steps: [step('a'), step('b', '')] })));
    await assertFails(setDoc(habit(), habitDoc({ steps: [step('a'), step('b', 'x'.repeat(61))] })));
    await assertFails(setDoc(habit(), habitDoc({ steps: [step('a'), step('', 'Ropa')] })));
    await assertFails(
      setDoc(habit(), habitDoc({ steps: [step('a'), step('x'.repeat(21), 'Ropa')] })),
    );
    await assertFails(setDoc(habit(), habitDoc({ steps: [step('a'), step(2, 'Ropa')] })));
    // El último de seis también se revisa.
    await assertFails(setDoc(habit(), habitDoc({ steps: [...steps(5).steps, step('last', '')] })));
  });

  it('rejects extra or missing fields in a step', async () => {
    await assertFails(setDoc(habit(), habitDoc({ steps: [step('a'), { id: 'b' }] })));
    await assertFails(
      setDoc(habit(), habitDoc({ steps: [step('a'), { id: 'b', title: 'Ropa', done: true }] })),
    );
  });

  it('can be added, changed and removed after creating the habit', async () => {
    await seedDocs({ [paths.habit('reading')]: habitDoc({ startDateKey: '2026-01-01' }) });
    await assertSucceeds(updateDoc(habit(), { ...steps(3), updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(habit(), { ...steps(2), updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(habit(), { steps: null, updatedAt: serverTimestamp() }));
    await assertFails(updateDoc(habit(), { ...steps(1), updatedAt: serverTimestamp() }));
  });
});

describe('habits update', () => {
  beforeEach(async () => {
    await seedDocs({ [paths.habit('reading')]: habitDoc({ startDateKey: '2026-01-01' }) });
  });

  it('edits name, tier and order', async () => {
    await assertSucceeds(
      updateDoc(habit(), {
        name: 'Leer 30 minutos',
        tier: 'secondary',
        sortOrder: 3,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('edits category and color', async () => {
    await assertSucceeds(
      updateDoc(habit(), {
        category: 'mental',
        color: '#C4B2DE',
        updatedAt: serverTimestamp(),
      }),
    );
    await assertFails(updateDoc(habit(), { category: 'deportes', updatedAt: serverTimestamp() }));
  });

  it('archives with today as the last day it counts', async () => {
    await assertSucceeds(
      updateDoc(habit(), {
        status: 'archived',
        archivedDateKey: TODAY,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('rejects archiving with a date other than today', async () => {
    await assertFails(
      updateDoc(habit(), {
        status: 'archived',
        archivedDateKey: YESTERDAY,
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('keeps startDateKey immutable', async () => {
    await assertFails(updateDoc(habit(), { startDateKey: TODAY, updatedAt: serverTimestamp() }));
  });

  it('never deletes a habit', async () => {
    await assertFails(deleteDoc(habit()));
  });
});

describe('archived habits', () => {
  beforeEach(async () => {
    await seedDocs({
      [paths.habit('reading')]: habitDoc({
        startDateKey: '2026-01-01',
        status: 'archived',
        archivedDateKey: YESTERDAY,
      }),
    });
  });

  it('cannot be reactivated', async () => {
    // Reactivarlo lo haría contar en días pasados todavía sin cerrar.
    await assertFails(
      updateDoc(habit(), { status: 'active', archivedDateKey: null, updatedAt: serverTimestamp() }),
    );
  });

  it('keeps their archive date', async () => {
    await assertFails(updateDoc(habit(), { archivedDateKey: TODAY, updatedAt: serverTimestamp() }));
  });
});

describe('rewards', () => {
  it('creates a valid reward', async () => {
    await assertSucceeds(setDoc(reward(), rewardDoc()));
  });

  it('validates tier and cost', async () => {
    await assertFails(setDoc(reward(), rewardDoc(undefined, { tier: 'huge' })));
    await assertFails(setDoc(reward(), rewardDoc(undefined, { cost: 0 })));
    await assertFails(setDoc(reward(), rewardDoc(undefined, { cost: 12.5 })));
    await assertFails(setDoc(reward(), rewardDoc(undefined, { name: '' })));
  });

  it('allows any cost, not only the suggested range', async () => {
    await assertSucceeds(setDoc(reward(), rewardDoc(undefined, { tier: 'small', cost: 1000 })));
  });

  it('archives and reactivates, but never deletes', async () => {
    await seedDocs({ [paths.reward('anime')]: rewardDoc() });
    await assertSucceeds(updateDoc(reward(), { status: 'archived', updatedAt: serverTimestamp() }));
    await assertSucceeds(updateDoc(reward(), { status: 'active', updatedAt: serverTimestamp() }));
    await assertFails(deleteDoc(reward()));
  });
});
