// Mantiene al día los recordatorios del celular: los reprograma al abrir la app, al cambiar los
// horarios o los hábitos y al marcar o desmarcar (data-model §8). En la web solo informa que no
// aplica.
import {
  addDays,
  planHabitReminders,
  planReminders,
  startOfWeek,
  type DailyLog,
  type DateKey,
  type HabitRecord,
  type ReminderSettings,
} from '@ascua/shared';
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

import {
  useDailyLog,
  useDailyLogsInRange,
  useGamificationState,
  useHabits,
  useUserProfile,
} from '@/data/hooks';
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
import { buildHabitReminderRequests, buildReminderRequests } from './reminder-requests';

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
  // La semana, hoy incluido: dice qué hábitos ya se cumplieron (hoy y los semanales).
  const weekLogs = useDailyLogsInRange(uid, startOfWeek(today), today);
  const gamification = useGamificationState(uid);
  // Ayer, si sigue abierto (día de gracia, D29): su racha cuenta para saber si hoy hay riesgo.
  const graceLog = useDailyLog(uid, addDays(today, -1));

  const settings = profile.data?.reminderSettings;
  if (
    habits.isLoading ||
    weekLogs.isLoading ||
    graceLog.isLoading ||
    !gamification.data ||
    !settings
  ) {
    return null;
  }

  const summary = buildTodaySummary({
    today,
    habits: habits.data,
    entries: weekLogs.data.find((log) => log.dateKey === today)?.entries ?? {},
    graceEntries: graceLog.data?.entries,
    state: gamification.data,
  });
  return (
    <ReminderPlanner
      today={today}
      settings={settings}
      isTodayGoalMet={summary.isGoalMet}
      hasHabitsToday={summary.hasHabits}
      habits={habits.data}
      weekLogs={weekLogs.data}
    />
  );
}

interface ReminderPlannerProps {
  today: DateKey;
  settings: ReminderSettings;
  isTodayGoalMet: boolean;
  hasHabitsToday: boolean;
  habits: readonly HabitRecord[];
  weekLogs: readonly DailyLog[];
}

/** Reprograma solo cuando cambia algo que altera el plan (no en cada render). */
function ReminderPlanner({
  today,
  settings: { enabled, dailyReminderTime, streakRiskReminderTime },
  isTodayGoalMet,
  hasHabitsToday,
  habits,
  weekLogs,
}: ReminderPlannerProps) {
  useEffect(() => {
    const now = new Date();
    const plan = planReminders({
      settings: { enabled, dailyReminderTime, streakRiskReminderTime },
      now,
      isTodayGoalMet,
      hasHabitsToday,
    });
    const habitPlan = planHabitReminders({ habits, now, enabled, weekLogs });
    // Si el plan no cambió (misma firma), `scheduleReminders` no toca nada.
    scheduleReminders([
      ...buildReminderRequests(plan),
      ...buildHabitReminderRequests(habitPlan),
    ]).catch((error: unknown) => console.error('No se pudieron programar los avisos', error));
  }, [
    today,
    enabled,
    dailyReminderTime,
    streakRiskReminderTime,
    isTodayGoalMet,
    hasHabitsToday,
    habits,
    weekLogs,
  ]);

  return null;
}
