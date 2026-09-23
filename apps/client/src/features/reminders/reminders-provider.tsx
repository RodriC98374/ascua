// Mantiene al día los recordatorios del celular: los reprograma al abrir la app, al cambiar los
// horarios y al marcar o desmarcar hábitos (data-model §8). En la web solo informa que no aplica.
import { planReminders, type DateKey, type ReminderSettings } from '@ascua/shared';
import { router, type Href } from 'expo-router';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, Linking } from 'react-native';

import { useDailyLog, useGamificationState, useHabits, useUserProfile } from '@/data/hooks';
import { buildTodaySummary } from '@/features/today/today-summary';
import { useToday } from '@/features/today/use-today';

import {
  areRemindersSupported,
  cancelReminders,
  getNotificationPermission,
  requestNotificationPermission,
  scheduleReminders,
  useReminderTap,
  type NotificationPermission,
} from './device-notifications';
import { buildReminderRequests } from './reminder-requests';

interface RemindersContextValue {
  /** null mientras se consulta al sistema. */
  permission: NotificationPermission | null;
  requestPermission: () => Promise<void>;
  /** Para cuando el permiso quedó bloqueado: solo se activa desde los ajustes del celular. */
  openDeviceSettings: () => void;
}

const RemindersContext = createContext<RemindersContextValue | null>(null);

export function useReminders(): RemindersContextValue {
  const value = useContext(RemindersContext);
  if (!value) throw new Error('useReminders necesita un RemindersProvider');
  return value;
}

export function RemindersProvider({ uid, children }: { uid: string; children: ReactNode }) {
  const [permission, setPermission] = useState<NotificationPermission | null>(
    areRemindersSupported ? null : 'unsupported',
  );

  // El permiso puede cambiar desde los ajustes del celular: se vuelve a leer al volver a la app.
  useEffect(() => {
    if (!areRemindersSupported) return;
    const refresh = () => {
      getNotificationPermission()
        .then(setPermission)
        .catch((error: unknown) => console.error('No se pudo leer el permiso de avisos', error));
    };
    refresh();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') refresh();
    });
    return () => subscription.remove();
  }, []);

  // Al cerrar sesión se desmonta: los avisos de esta cuenta dejan de llegar.
  useEffect(
    () => () => {
      cancelReminders().catch((error: unknown) =>
        console.error('No se pudieron cancelar los avisos', error),
      );
    },
    [uid],
  );

  useReminderTap(useCallback((href: string) => router.navigate(href as Href), []));

  const value = useMemo<RemindersContextValue>(
    () => ({
      permission,
      requestPermission: async () => setPermission(await requestNotificationPermission()),
      openDeviceSettings: () => void Linking.openSettings(),
    }),
    [permission],
  );

  return (
    <RemindersContext.Provider value={value}>
      {permission === 'granted' && <ReminderScheduler uid={uid} />}
      {children}
    </RemindersContext.Provider>
  );
}

/** Solo existe con permiso concedido; así la web no abre suscripciones que no usa. */
function ReminderScheduler({ uid }: { uid: string }) {
  const today = useToday();
  const profile = useUserProfile(uid);
  const habits = useHabits(uid);
  const log = useDailyLog(uid, today);
  const gamification = useGamificationState(uid);

  const settings = profile.data?.reminderSettings;
  if (habits.isLoading || log.isLoading || !gamification.data || !settings) return null;

  const summary = buildTodaySummary({
    today,
    habits: habits.data,
    entries: log.data?.entries ?? {},
    state: gamification.data,
  });
  return (
    <ReminderPlanner
      today={today}
      settings={settings}
      isTodayGoalMet={summary.isGoalMet}
      hasHabitsToday={summary.hasHabits}
    />
  );
}

interface ReminderPlannerProps {
  today: DateKey;
  settings: ReminderSettings;
  isTodayGoalMet: boolean;
  hasHabitsToday: boolean;
}

/** Reprograma solo cuando cambia algo que altera el plan (no en cada render). */
function ReminderPlanner({
  today,
  settings: { enabled, dailyReminderTime, streakRiskReminderTime },
  isTodayGoalMet,
  hasHabitsToday,
}: ReminderPlannerProps) {
  useEffect(() => {
    const plan = planReminders({
      settings: { enabled, dailyReminderTime, streakRiskReminderTime },
      now: new Date(),
      isTodayGoalMet,
      hasHabitsToday,
    });
    scheduleReminders(buildReminderRequests(plan)).catch((error: unknown) =>
      console.error('No se pudieron programar los avisos', error),
    );
  }, [today, enabled, dailyReminderTime, streakRiskReminderTime, isTodayGoalMet, hasHabitsToday]);

  return null;
}
