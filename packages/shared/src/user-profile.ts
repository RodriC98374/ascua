import type { ReminderSettings, UserProfile } from './types';

/** Recordatorios con los que nace la cuenta; se editan en Ajustes. Hora de Bolivia. */
export const DEFAULT_REMINDER_SETTINGS: Readonly<ReminderSettings> = {
  enabled: true,
  dailyReminderTime: '08:00',
  streakRiskReminderTime: '21:00',
};

const MAX_DISPLAY_NAME_LENGTH = 50;

/** 'HH:mm' de 00:00 a 23:59, el mismo formato que validan las reglas. */
export function isReminderTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** Perfil que crea `initializeAccount` en el primer inicio de sesión. */
export function initialUserProfile(email: string): UserProfile {
  const localPart = email.split('@', 1).join('');
  return {
    email,
    displayName: localPart.slice(0, MAX_DISPLAY_NAME_LENGTH) || 'Usuario',
    reminderSettings: { ...DEFAULT_REMINDER_SETTINGS },
  };
}
