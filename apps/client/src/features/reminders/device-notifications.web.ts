// La web no notifica (D14): los recordatorios llegan al celular. Misma API que la versión nativa.
import type { ReminderRequest } from './reminder-requests';

export type NotificationPermission = 'granted' | 'undetermined' | 'blocked' | 'unsupported';

export const areRemindersSupported = false;

export async function getNotificationPermission(): Promise<NotificationPermission> {
  return 'unsupported';
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  return 'unsupported';
}

export async function scheduleReminders(_requests: readonly ReminderRequest[]): Promise<void> {}

export async function cancelReminders(): Promise<void> {}

export function useReminderTap(_onTap: (href: string) => void): void {}
