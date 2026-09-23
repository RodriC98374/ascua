// Del plan de recordatorios de @ascua/shared a las notificaciones que se programan en el celular.
import type { PlannedReminder, ReminderKind } from '@ascua/shared';

/** Canal de Android de los recordatorios. Una vez creado, Android solo deja cambiar su nombre. */
export const REMINDER_CHANNEL_ID = 'reminders';

/** Tocar un recordatorio abre la pantalla Hoy. */
export const REMINDER_TARGET_HREF = '/';

export interface ReminderRequest {
  identifier: string;
  title: string;
  body: string;
  fireAt: Date;
}

const CONTENT: Record<ReminderKind, { title: string; body: string }> = {
  daily: {
    title: 'Hora de tus hábitos',
    body: 'Tus hábitos de hoy te esperan. Cada marca mantiene viva tu brasa.',
  },
  streak_risk: {
    title: 'Aún puedes cumplir tu meta de hoy',
    body: 'Tienes hasta la medianoche para marcar tus hábitos y sumar un día a tu racha.',
  },
};

export function buildReminderRequests(plan: readonly PlannedReminder[]): ReminderRequest[] {
  return plan.map(({ id, kind, fireAt }) => ({ identifier: id, ...CONTENT[kind], fireAt }));
}

/** Resume un plan para no reprogramar todo cuando no cambió nada. */
export function reminderPlanSignature(requests: readonly ReminderRequest[]): string {
  return requests.map((request) => `${request.identifier}@${request.fireAt.getTime()}`).join('|');
}
