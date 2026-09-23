import { getDoc } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import { userProfileRef } from '../../../../apps/client/src/data/documents';
import { updateReminderSettings } from '../../../../apps/client/src/operations/profile';
import { OWNER, ownerDb, useRulesTestEnvironment } from '../support/env';
import { paths, profileDoc, seedDocs } from '../support/fixtures';

useRulesTestEnvironment();

describe('profile operations', () => {
  it('saves the reminder settings', async () => {
    await seedDocs({ [paths.user()]: profileDoc() });
    const db = ownerDb();

    await updateReminderSettings(db, OWNER, {
      enabled: false,
      dailyReminderTime: '07:30',
      streakRiskReminderTime: '22:15',
    });

    const profile = await getDoc(userProfileRef(db, OWNER));
    expect(profile.data()?.reminderSettings).toEqual({
      enabled: false,
      dailyReminderTime: '07:30',
      streakRiskReminderTime: '22:15',
    });
  });

  it('is rejected by the rules with an invalid time', async () => {
    await seedDocs({ [paths.user()]: profileDoc() });

    await expect(
      updateReminderSettings(ownerDb(), OWNER, {
        enabled: true,
        dailyReminderTime: '7:30',
        streakRiskReminderTime: '21:00',
      }),
    ).rejects.toThrow();
  });
});
