import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { deleteDoc, doc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';
import { beforeEach, describe, it } from 'vitest';

import { ownerDb, useRulesTestEnvironment } from './support/env';
import { paths, profileDoc, seedDocs } from './support/fixtures';

useRulesTestEnvironment();

const profile = () => doc(ownerDb(), paths.user());

describe('users/{uid} create', () => {
  it('creates the profile with valid values', async () => {
    await assertSucceeds(setDoc(profile(), profileDoc()));
  });

  it('requires the email of the signed-in account', async () => {
    await assertFails(setDoc(profile(), profileDoc({ email: 'someone@example.com' })));
  });

  it('rejects unknown fields', async () => {
    await assertFails(setDoc(profile(), profileDoc({ isAdmin: true })));
  });

  it('rejects an empty or too long display name', async () => {
    await assertFails(setDoc(profile(), profileDoc({ displayName: '' })));
    await assertFails(setDoc(profile(), profileDoc({ displayName: 'x'.repeat(51) })));
  });

  it('rejects reminder times that are not HH:mm', async () => {
    const reminderSettings = (dailyReminderTime: string) => ({
      enabled: true,
      dailyReminderTime,
      streakRiskReminderTime: '21:00',
    });
    await assertFails(
      setDoc(profile(), profileDoc({ reminderSettings: reminderSettings('24:00') })),
    );
    await assertFails(
      setDoc(profile(), profileDoc({ reminderSettings: reminderSettings('8:00') })),
    );
  });

  it('requires server timestamps and schema version 1', async () => {
    await assertFails(setDoc(profile(), profileDoc({ createdAt: new Date('2020-01-01') })));
    await assertFails(setDoc(profile(), profileDoc({ schemaVersion: 2 })));
  });
});

describe('users/{uid} update', () => {
  beforeEach(async () => {
    await seedDocs({ [paths.user()]: profileDoc() });
  });

  it('changes the display name and reminder settings', async () => {
    await assertSucceeds(
      updateDoc(profile(), {
        displayName: 'Nuevo nombre',
        'reminderSettings.dailyReminderTime': '07:30',
        updatedAt: serverTimestamp(),
      }),
    );
  });

  it('keeps the email immutable', async () => {
    await assertFails(
      updateDoc(profile(), { email: 'owner@example.com.bo', updatedAt: serverTimestamp() }),
    );
  });

  it('requires updatedAt to be the server time', async () => {
    await assertFails(updateDoc(profile(), { displayName: 'Sin fecha' }));
  });

  it('never deletes the profile', async () => {
    await assertFails(deleteDoc(profile()));
  });
});
