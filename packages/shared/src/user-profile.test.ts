import { describe, expect, it } from 'vitest';

import { DEFAULT_REMINDER_SETTINGS, initialUserProfile, isReminderTime } from './user-profile';

describe('initialUserProfile', () => {
  it('uses the part of the email before the @ as display name', () => {
    expect(initialUserProfile('ana.perez@example.com')).toEqual({
      email: 'ana.perez@example.com',
      displayName: 'ana.perez',
      reminderSettings: DEFAULT_REMINDER_SETTINGS,
    });
  });

  it('keeps the display name within 50 characters', () => {
    const email = `${'x'.repeat(80)}@example.com`;
    expect(initialUserProfile(email).displayName).toHaveLength(50);
  });

  it('falls back to a generic name when the email has no local part', () => {
    expect(initialUserProfile('@example.com').displayName).toBe('Usuario');
  });

  it('returns a copy of the default reminders, not the shared object', () => {
    expect(initialUserProfile('a@example.com').reminderSettings).not.toBe(
      DEFAULT_REMINDER_SETTINGS,
    );
  });
});

describe('DEFAULT_REMINDER_SETTINGS', () => {
  it('reminds in the morning and warns about the streak at night', () => {
    expect(DEFAULT_REMINDER_SETTINGS).toEqual({
      enabled: true,
      dailyReminderTime: '08:00',
      streakRiskReminderTime: '21:00',
    });
  });
});

describe('isReminderTime', () => {
  it.each(['00:00', '08:00', '21:30', '23:59'])('accepts %s', (value) => {
    expect(isReminderTime(value)).toBe(true);
  });

  it.each(['24:00', '8:00', '08:60', '0800', ''])('rejects %s', (value) => {
    expect(isReminderTime(value)).toBe(false);
  });
});
