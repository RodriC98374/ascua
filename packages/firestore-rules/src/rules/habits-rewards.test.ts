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
    await assertFails(
      updateDoc(habit(), { category: 'deportes', updatedAt: serverTimestamp() }),
    );
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
