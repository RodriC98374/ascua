import { planRestore, readBackup, type BackupContents, type RestoreCurrent } from '@ascua/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useGoals, useHabits, useRewards, useTodayTasks, useWeeklyReflections } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { useToday } from '@/features/today/use-today';
import { db } from '@/lib/firebase';
import { restoreConfiguration, type RestoreCounts } from '@/operations/restore';

import { pickBackupFile } from './pick-backup-file';
import { RestoreSection } from './restore-section';
import {
  backupDateText,
  goalRestoreDetail,
  habitRestoreDetail,
  reflectionRestoreTitle,
  restoreButtonLabel,
  restoreErrorText,
  restoreRepeatsText,
  restoreSummaryText,
  rewardRestoreDetail,
  taskRestoreDetail,
  type RestoreFileError,
} from './restore-text';

type Step =
  | { kind: 'choose'; error: RestoreFileError | null }
  | { kind: 'preview'; fileName: string; contents: BackupContents }
  | { kind: 'done'; counts: RestoreCounts };

const RESTORED = [
  'Hábitos activos, que vuelven a empezar hoy',
  'Recompensas activas',
  'Tareas pendientes',
  'Metas en curso, con sus hábitos y tareas',
  'Reflexiones semanales',
];

function nextSortOrder(items: readonly { sortOrder: number }[]): number {
  return Math.max(-1, ...items.map((item) => item.sortOrder)) + 1;
}

/**
 * Restaurar la configuración desde un respaldo (fase 19, D26): elegir el archivo, revisar lo que se
 * va a recuperar y confirmar. Nada se escribe antes de confirmar.
 */
export function RestoreFlow() {
  const uid = useUid();
  const today = useToday();
  const habits = useHabits(uid);
  const rewards = useRewards(uid);
  const tasks = useTodayTasks(uid, today);
  const goals = useGoals(uid);
  const reflections = useWeeklyReflections(uid);
  const [step, setStep] = useState<Step>({ kind: 'choose', error: null });
  const [deselected, setDeselected] = useState<ReadonlySet<string>>(new Set());
  const [isPicking, setIsPicking] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);

  const isLoadingAccount = [habits, rewards, tasks, goals, reflections].some(
    (state) => state.isLoading,
  );

  async function choose() {
    setIsPicking(true);
    try {
      const picked = await pickBackupFile();
      if (!picked) return;
      if (picked.text === null) {
        setStep({ kind: 'choose', error: 'too_big' });
        return;
      }
      const result = readBackup(picked.text);
      if (!result.ok) {
        setStep({ kind: 'choose', error: result.error });
        return;
      }
      setDeselected(new Set());
      setRestoreError(null);
      setStep({ kind: 'preview', fileName: picked.name, contents: result.contents });
    } catch (error) {
      console.error('No se pudo leer el respaldo', error);
      setStep({ kind: 'choose', error: 'unreadable_file' });
    } finally {
      setIsPicking(false);
    }
  }

  if (step.kind === 'done') {
    return (
      <View className="gap-6">
        <Card className="gap-2">
          <Text className="font-heading text-heading-md text-ink">¡Listo!</Text>
          <Text className="font-body text-body text-ink">{restoreSummaryText(step.counts)}</Text>
          {step.counts.habits > 0 && (
            <Text className="font-body text-body text-ink-muted">
              Tus hábitos empiezan hoy: la racha sigue desde donde está en esta cuenta.
            </Text>
          )}
        </Card>
        <Button label="Ir a Hoy" onPress={() => router.replace('/')} />
        <Button label="Volver a Ajustes" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  if (step.kind === 'choose') {
    return (
      <View className="gap-6">
        <Card className="gap-3">
          <Text className="font-body text-body text-ink">
            Elige un respaldo JSON guardado desde Ajustes. Recuperas:
          </Text>
          <View className="gap-1.5">
            {RESTORED.map((line) => (
              <View key={line} className="flex-row gap-2">
                <Text className="font-body-bold text-body text-ember-strong">·</Text>
                <Text className="font-body text-body text-ink flex-1">{line}</Text>
              </View>
            ))}
          </View>
          <Text className="font-body text-caption text-ink-muted">
            La racha, los puntos y el historial de días no se recuperan. Lo que ya tienes no se
            duplica, y antes de guardar nada ves todo para elegir.
          </Text>
        </Card>
        {step.error && (
          <Text accessibilityRole="alert" className="font-body-bold text-body text-error">
            {restoreErrorText(step.error)}
          </Text>
        )}
        <Button label="Elegir archivo" onPress={choose} isLoading={isPicking} />
      </View>
    );
  }

  if (isLoadingAccount) {
    return <Text className="font-body text-body text-ink-muted">Revisando tu cuenta…</Text>;
  }

  const current: RestoreCurrent = {
    habits: habits.data,
    rewards: rewards.data,
    tasks: tasks.data,
    goals: goals.data,
    reflectionWeeks: reflections.data.map((reflection) => reflection.weekStartDateKey),
  };
  const plan = planRestore({ contents: step.contents, current, today, deselected });
  const { contents } = step;
  const date = backupDateText(contents.exportedAt);
  const all = [plan.habits, plan.rewards, plan.tasks, plan.goals, plan.reflections].flat();
  const repeats = restoreRepeatsText(plan);
  const hasNew = all.some((item) => item.existingId === null);

  function toggle(keys: readonly string[], isSelected: boolean) {
    setDeselected((previous) => {
      const next = new Set(previous);
      for (const key of keys) {
        if (isSelected) next.delete(key);
        else next.add(key);
      }
      return next;
    });
  }

  async function restore() {
    setIsRestoring(true);
    setRestoreError(null);
    try {
      const counts = await restoreConfiguration(
        db,
        uid,
        plan,
        {
          habits: nextSortOrder(habits.data),
          rewards: nextSortOrder(rewards.data),
          goals: nextSortOrder(goals.data),
        },
        today,
      );
      setStep({ kind: 'done', counts });
    } catch (error) {
      console.error('No se pudo restaurar', error);
      setRestoreError(
        'No se pudo terminar de restaurar. Revisa tu conexión y vuelve a intentarlo: lo que ya se guardó no se duplica.',
      );
    } finally {
      setIsRestoring(false);
    }
  }

  return (
    <View className="gap-6">
      <Card className="gap-1">
        <Text className="font-body-bold text-body text-ink" numberOfLines={1}>
          {step.fileName}
        </Text>
        {date && <Text className="font-body text-caption text-ink-muted">{date}</Text>}
        {contents.unreadable > 0 && (
          <Text className="font-body text-caption text-ink-muted">
            {contents.unreadable === 1
              ? 'Una cosa del archivo no se pudo leer y se deja afuera.'
              : `${contents.unreadable} cosas del archivo no se pudieron leer y se dejan afuera.`}
          </Text>
        )}
        {repeats && <Text className="font-body text-caption text-ink-muted">{repeats}</Text>}
      </Card>

      {!hasNew ? (
        <Text className="font-body text-body text-ink-muted">
          {all.length > 0
            ? 'No hay nada nuevo: todo lo de este respaldo ya está en tu cuenta.'
            : 'Este respaldo no tiene nada que recuperar: lo que trae está archivado, cumplido o logrado.'}
        </Text>
      ) : (
        <>
          <RestoreSection
            title="Hábitos"
            items={plan.habits}
            titleOf={(habit) => habit.name}
            detailOf={habitRestoreDetail}
            onToggle={toggle}
          />
          <RestoreSection
            title="Recompensas"
            items={plan.rewards}
            titleOf={(reward) => reward.name}
            detailOf={rewardRestoreDetail}
            onToggle={toggle}
          />
          <RestoreSection
            title="Tareas"
            items={plan.tasks}
            titleOf={(task) => task.title}
            detailOf={(task) => taskRestoreDetail(task, today)}
            onToggle={toggle}
          />
          <RestoreSection
            title="Metas"
            items={plan.goals}
            titleOf={(goal) => goal.title}
            detailOf={goalRestoreDetail}
            onToggle={toggle}
          />
          <RestoreSection
            title="Reflexiones"
            items={plan.reflections}
            titleOf={(reflection) => reflectionRestoreTitle(reflection.weekStartDateKey)}
            detailOf={(reflection) =>
              reflection.wentWell || reflection.wasHard || reflection.nextFocus
            }
            onToggle={toggle}
          />
        </>
      )}

      {restoreError && (
        <Text accessibilityRole="alert" className="font-body-bold text-body text-error">
          {restoreError}
        </Text>
      )}
      <View className="gap-3">
        {hasNew && (
          <Button
            label={restoreButtonLabel(plan.selectedCount)}
            onPress={restore}
            isLoading={isRestoring}
            isDisabled={plan.selectedCount === 0}
          />
        )}
        <Button
          label="Elegir otro archivo"
          variant="secondary"
          onPress={choose}
          isDisabled={isRestoring}
        />
      </View>
    </View>
  );
}
