import type { RestorePlan } from '@ascua/shared';
import { describe, expect, it } from '@jest/globals';

import { scheduleText } from '@/features/habits/habit-text';

import {
  backupDateText,
  goalRestoreDetail,
  habitRestoreDetail,
  reflectionRestoreTitle,
  restoreButtonLabel,
  restoreErrorText,
  restoreNoteText,
  restoreRepeatsText,
  restoreSummaryText,
  rewardRestoreDetail,
  taskRestoreDetail,
} from './restore-text';

const NO_COUNTS = { habits: 0, rewards: 0, tasks: 0, goals: 0, reflections: 0 };

describe('scheduleText', () => {
  it('describes each frequency', () => {
    expect(scheduleText({ type: 'daily' })).toBe('Todos los días');
    expect(scheduleText({ type: 'days_of_week', daysOfWeek: [5, 1, 3] })).toBe(
      'Días fijos: L, X, V',
    );
    expect(scheduleText({ type: 'times_per_week', timesPerWeek: 1 })).toBe('1 vez por semana');
    expect(scheduleText({ type: 'times_per_week', timesPerWeek: 3 })).toBe('3 veces por semana');
  });
});

describe('restore texts', () => {
  it('explains each file error', () => {
    expect(restoreErrorText('not_backup')).toMatch(/no es un respaldo de Ascua/);
    expect(restoreErrorText('newer_version')).toMatch(/versión más nueva/);
  });

  it('explains what changes when restoring', () => {
    expect(restoreNoteText('moved_to_today')).toBe('Estaba vencida: ahora vence hoy');
  });

  it('describes a habit with its tier, frequency and target', () => {
    const habit = {
      name: 'Agua',
      description: null,
      tier: 'primary' as const,
      category: 'health' as const,
      icon: 'check',
      color: '#9FCBAC' as const,
      schedule: { type: 'daily' as const },
      target: { amount: 8, unit: 'vasos' },
      reminder: null,
    };
    expect(habitRestoreDetail(habit)).toBe('Principal · Todos los días · 8 vasos');
    expect(habitRestoreDetail({ ...habit, tier: 'secondary', target: null })).toBe(
      'Secundario · Todos los días',
    );
  });

  it('describes rewards and tasks', () => {
    expect(
      rewardRestoreDetail({ name: 'Cine', description: null, tier: 'medium', cost: 200 }),
    ).toBe('200 pts');
    expect(
      taskRestoreDetail(
        { title: 'Informe', size: 'large', dueDateKey: '2026-10-01' },
        '2026-09-30',
      ),
    ).toBe('Grande · Mañana');
  });

  it('describes a goal with its links and deadline', () => {
    const goal = {
      title: 'Correr',
      description: null,
      targetDateKey: '2026-12-31',
      habits: [{ kind: 'existing' as const, id: 'h1' }],
      tasks: [
        { kind: 'restored' as const, sourceId: 't1' },
        { kind: 'restored' as const, sourceId: 't2' },
      ],
    };
    expect(goalRestoreDetail(goal)).toBe('1 hábito y 2 tareas · Hasta el 31 dic 2026');
    expect(goalRestoreDetail({ ...goal, habits: [], tasks: [], targetDateKey: null })).toBe(
      'Sin hábitos ni tareas · Sin fecha límite',
    );
  });

  it('names the week of a reflection', () => {
    expect(reflectionRestoreTitle('2026-09-21')).toBe('Semana del 21 – 27 sep 2026');
  });

  it('dates the backup from its export instant', () => {
    expect(backupDateText('2026-09-28T21:00:00.000-04:00')).toBe('Guardado el 28 sep 2026');
    expect(backupDateText(null)).toBeNull();
    expect(backupDateText('ayer')).toBeNull();
  });

  it('sums up what is already in the account', () => {
    const item = (existingId: string | null) => ({
      key: 'k',
      sourceId: 's',
      value: null,
      existingId,
      isSelected: existingId === null,
      notes: [],
    });
    const plan = {
      habits: [item('h1'), item('h2'), item(null)],
      rewards: [item(null)],
      tasks: [],
      goals: [item('g1')],
      reflections: [item('2026-09-14')],
      selectedCount: 2,
    } as unknown as RestorePlan;
    expect(restoreRepeatsText(plan)).toBe(
      'Ya están en tu cuenta y no se duplican: 2 hábitos, 1 meta y 1 reflexión.',
    );
    expect(
      restoreRepeatsText({ ...plan, habits: [], goals: [], reflections: [] } as RestorePlan),
    ).toBeNull();
  });

  it('counts what the button will restore', () => {
    expect(restoreButtonLabel(0)).toBe('Elige algo para recuperar');
    expect(restoreButtonLabel(1)).toBe('Recuperar 1 cosa');
    expect(restoreButtonLabel(7)).toBe('Recuperar 7 cosas');
  });

  it('sums up what was restored', () => {
    expect(restoreSummaryText({ ...NO_COUNTS, habits: 2, rewards: 1, tasks: 3 })).toBe(
      'Recuperaste 2 hábitos, 1 recompensa y 3 tareas.',
    );
    expect(restoreSummaryText({ ...NO_COUNTS, reflections: 1 })).toBe('Recuperaste 1 reflexión.');
    expect(restoreSummaryText({ ...NO_COUNTS, goals: 2, reflections: 4 })).toBe(
      'Recuperaste 2 metas y 4 reflexiones.',
    );
    expect(restoreSummaryText(NO_COUNTS)).toBe('No había nada nuevo para recuperar.');
  });
});
