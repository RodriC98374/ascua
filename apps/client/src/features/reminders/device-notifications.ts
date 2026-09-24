// Notificaciones locales del celular (expo-notifications). Solo Android (D14); la web usa
// `device-notifications.web.ts`, que no hace nada.
import * as Notifications from 'expo-notifications';
import { useEffect } from 'react';

import { lightColors } from '@/theme/colors';

import {
  REMINDER_CHANNEL_ID,
  REMINDER_TARGET_HREF,
  reminderPlanSignature,
  type ReminderRequest,
} from './reminder-requests';

/**
 * granted: se pueden programar. undetermined: se pueden pedir. blocked: el usuario las negó y
 * solo se activan desde los ajustes del celular. unsupported: la web.
 */
export type NotificationPermission = 'granted' | 'undetermined' | 'blocked' | 'unsupported';

export const areRemindersSupported = true;

// Con la app abierta, el recordatorio también se muestra.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

let channelReady: Promise<unknown> | null = null;

/** Android 13+ solo muestra el pedido de permiso si ya existe un canal. */
function ensureChannel(): Promise<unknown> {
  channelReady ??= Notifications.setNotificationChannelAsync(REMINDER_CHANNEL_ID, {
    name: 'Recordatorios',
    description: 'Avisos diarios y de racha en riesgo, a la hora que elijas en Ajustes.',
    importance: Notifications.AndroidImportance.HIGH,
    // Luz de aviso del celular: la brasa, sin depender del tema.
    lightColor: lightColors.ember,
  }).catch((error: unknown) => {
    channelReady = null;
    throw error;
  });
  return channelReady;
}

function toPermission(status: Notifications.NotificationPermissionsStatus): NotificationPermission {
  if (status.granted) return 'granted';
  return status.canAskAgain ? 'undetermined' : 'blocked';
}

export async function getNotificationPermission(): Promise<NotificationPermission> {
  return toPermission(await Notifications.getPermissionsAsync());
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  await ensureChannel();
  return toPermission(await Notifications.requestPermissionsAsync());
}

// Las reprogramaciones van en fila: borrar todo y volver a programar no debe mezclarse con otra.
let queue: Promise<void> = Promise.resolve();
let appliedSignature: string | null = null;

async function replaceScheduled(requests: readonly ReminderRequest[], signature: string) {
  if (signature === appliedSignature) return;
  appliedSignature = null;
  await ensureChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const request of requests) {
    await Notifications.scheduleNotificationAsync({
      identifier: request.identifier,
      content: {
        title: request.title,
        body: request.body,
        data: { url: REMINDER_TARGET_HREF },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: request.fireAt,
        channelId: REMINDER_CHANNEL_ID,
      },
    });
  }
  appliedSignature = signature;
}

/**
 * Operación `scheduleReminders` (data-model §7): reemplaza los recordatorios programados por los
 * del plan. No hace nada si el plan es el mismo que ya está programado.
 */
export function scheduleReminders(requests: readonly ReminderRequest[]): Promise<void> {
  const signature = reminderPlanSignature(requests);
  queue = queue.catch(() => undefined).then(() => replaceScheduled(requests, signature));
  return queue;
}

/** Al cerrar sesión: ningún aviso para una cuenta que ya no está en el celular. */
export function cancelReminders(): Promise<void> {
  return scheduleReminders([]);
}

/** Llama a `onTap` con la ruta del recordatorio que el usuario tocó, también si abrió la app. */
export function useReminderTap(onTap: (href: string) => void): void {
  const response = Notifications.useLastNotificationResponse();

  useEffect(() => {
    if (!response || response.actionIdentifier !== Notifications.DEFAULT_ACTION_IDENTIFIER) return;
    const url = response.notification.request.content.data?.url;
    if (typeof url !== 'string') return;
    onTap(url);
    // Sin esto, volver a montar la app repetiría la navegación.
    void Notifications.clearLastNotificationResponseAsync();
  }, [response, onTap]);
}
