import { describe, expect, it } from 'vitest';

import { EXPORT_FORMAT, EXPORT_FORMAT_VERSION } from './export';
import {
  planRestore,
  readBackup,
  restoreKey,
  type BackupContents,
  type RestoreCurrent,
} from './restore';
import type { Goal, HabitRecord, RewardRecord, Task } from './types';

const TODAY = '2026-09-30';

function habitDoc(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `Hábito ${id}`,
    description: null,
    icon: 'check',
    color: '#9FCBAC',
    category: 'health',
    tier: 'secondary',
    schedule: { type: 'daily' },
    target: null,
    reminder: null,
    status: 'active',
    sortOrder: 0,
    startDateKey: '2026-08-01',
    archivedDateKey: null,
    createdAt: '2026-08-01T10:00:00.000-04:00',
    updatedAt: '2026-08-01T10:00:00.000-04:00',
    schemaVersion: 1,
    ...overrides,
  };
}

function rewardDoc(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    name: `Recompensa ${id}`,
    description: null,
    icon: 'star',
    tier: 'small',
    cost: 60,
    status: 'active',
    sortOrder: 0,
    ...overrides,
  };
}

function taskDoc(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: `Tarea ${id}`,
    size: 'medium',
    dueDateKey: '2026-10-05',
    completedDateKey: null,
    completedAt: null,
    ...overrides,
  };
}

function goalDoc(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    title: `Meta ${id}`,
    description: null,
    targetDateKey: null,
    habitIds: [],
    taskIds: [],
    status: 'active',
    startDateKey: '2026-09-01',
    achievedDateKey: null,
    sortOrder: 0,
    ...overrides,
  };
}

function reflectionDoc(weekStartDateKey: string, overrides: Record<string, unknown> = {}) {
  return {
    id: weekStartDateKey,
    weekStartDateKey,
    wentWell: 'Leí todos los días',
    wasHard: '',
    nextFocus: '',
    ...overrides,
  };
}

function backupText(overrides: Record<string, unknown> = {}): string {
  return JSON.stringify({
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: '2026-09-28T21:00:00.000-04:00',
    timeZone: 'America/La_Paz',
    userId: 'someone',
    profile: null,
    gamification: null,
    habits: [],
    dailyLogs: [],
    monthlySummaries: [],
    pointTransactions: [],
    rewards: [],
    rewardRedemptions: [],
    tasks: [],
    goals: [],
    weeklyReflections: [],
    savings: null,
    ...overrides,
  });
}

function read(overrides: Record<string, unknown> = {}): BackupContents {
  const result = readBackup(backupText(overrides));
  if (!result.ok) throw new Error(`No se leyó: ${result.error}`);
  return result.contents;
}

describe('readBackup', () => {
  it('rejects text that is not JSON', () => {
    expect(readBackup('hola')).toEqual({ ok: false, error: 'not_json' });
  });

  it('rejects JSON that is not an Ascua backup', () => {
    expect(readBackup('[]')).toEqual({ ok: false, error: 'not_backup' });
    expect(readBackup('null')).toEqual({ ok: false, error: 'not_backup' });
    expect(readBackup(JSON.stringify({ format: 'otra-app', formatVersion: 1 }))).toEqual({
      ok: false,
      error: 'not_backup',
    });
    expect(readBackup(backupText({ formatVersion: '1' }))).toEqual({
      ok: false,
      error: 'not_backup',
    });
    expect(readBackup(backupText({ habits: 'ninguno' }))).toEqual({
      ok: false,
      error: 'not_backup',
    });
    expect(readBackup(backupText({ goals: {} }))).toEqual({ ok: false, error: 'not_backup' });
  });

  it('rejects a backup from a newer version of the app', () => {
    expect(readBackup(backupText({ formatVersion: EXPORT_FORMAT_VERSION + 1 }))).toEqual({
      ok: false,
      error: 'newer_version',
    });
  });

  it('reads a backup made before tasks, goals and reflections existed', () => {
    const text = backupText();
    const old = JSON.parse(text) as Record<string, unknown>;
    delete old.tasks;
    delete old.goals;
    delete old.weeklyReflections;
    delete old.savings;
    const result = readBackup(JSON.stringify(old));
    expect(result).toMatchObject({
      ok: true,
      contents: { tasks: [], goals: [], reflections: [], unreadable: 0 },
    });
  });

  it('keeps when it was exported', () => {
    expect(read().exportedAt).toBe('2026-09-28T21:00:00.000-04:00');
    expect(read({ exportedAt: 5 }).exportedAt).toBeNull();
  });

  describe('habits', () => {
    it('reads an active habit with everything it needs to be created again', () => {
      const contents = read({
        habits: [
          habitDoc('water', {
            name: '  Vasos de agua ',
            description: ' Con la comida ',
            tier: 'primary',
            icon: 'glass-water',
            color: '#A3C4D9',
            schedule: { type: 'days_of_week', daysOfWeek: [1, 3, 5] },
            target: { amount: 8, unit: ' vasos ' },
            reminder: { time: '08:30', daysOfWeek: [1, 5] },
          }),
        ],
      });
      expect(contents.habits).toEqual([
        {
          sourceId: 'water',
          value: {
            name: 'Vasos de agua',
            description: 'Con la comida',
            tier: 'primary',
            category: 'health',
            icon: 'glass-water',
            color: '#A3C4D9',
            schedule: { type: 'days_of_week', daysOfWeek: [1, 3, 5] },
            target: { amount: 8, unit: 'vasos' },
            reminder: { time: '08:30', daysOfWeek: [1, 5] },
            steps: null,
          },
        },
      ]);
    });

    it('reads a times-per-week habit', () => {
      const [habit] = read({
        habits: [habitDoc('swim', { schedule: { type: 'times_per_week', timesPerWeek: 3 } })],
      }).habits;
      expect(habit?.value.schedule).toEqual({ type: 'times_per_week', timesPerWeek: 3 });
    });

    it('leaves archived habits out without counting them as unreadable', () => {
      const contents = read({
        habits: [habitDoc('old', { status: 'archived', archivedDateKey: '2026-09-01' })],
      });
      expect(contents.habits).toEqual([]);
      expect(contents.unreadable).toBe(0);
    });

    it('fills category and color for habits saved before they existed', () => {
      const legacy: Record<string, unknown> = habitDoc('legacy');
      delete legacy.category;
      delete legacy.color;
      delete legacy.target;
      delete legacy.reminder;
      const [habit] = read({ habits: [legacy] }).habits;
      expect(habit?.value).toMatchObject({
        category: 'other',
        color: '#96C7C0',
        target: null,
        reminder: null,
      });
    });

    it('keeps "no icon" for a habit without one or with an icon outside the catalog', () => {
      const habits = read({
        habits: [habitDoc('a'), habitDoc('b', { icon: '🔥' }), habitDoc('c', { icon: undefined })],
      }).habits;
      expect(habits.map((habit) => habit.value.icon)).toEqual(['check', 'check', 'check']);
    });

    it('keeps the steps of a habit, and drops them if they are not a valid list', () => {
      const steps = [
        { id: 'a', title: 'Dientes' },
        { id: 'b', title: 'Ropa' },
      ];
      const habits = read({
        habits: [
          habitDoc('a', { steps: [...steps.map((step) => ({ ...step, extra: true }))] }),
          habitDoc('b', { steps: [steps[0]] }),
          habitDoc('c', { steps, target: { amount: 3, unit: 'vasos' } }),
        ],
      }).habits;
      expect(habits.map((habit) => habit.value.steps)).toEqual([steps, null, null]);
    });

    it('swaps a color that is no longer in the palette for the one of its category', () => {
      const [habit] = read({ habits: [habitDoc('a', { color: '#123456' })] }).habits;
      expect(habit?.value.color).toBe('#9FCBAC');
    });

    it('drops a reminder that does not fit, keeping the habit', () => {
      const [habit] = read({
        habits: [
          habitDoc('a', {
            schedule: { type: 'days_of_week', daysOfWeek: [2, 4] },
            reminder: { time: '08:00', daysOfWeek: [1] },
          }),
        ],
      }).habits;
      expect(habit?.value.reminder).toBeNull();
      const [broken] = read({ habits: [habitDoc('b', { reminder: 'mañana' })] }).habits;
      expect(broken?.value.reminder).toBeNull();
    });

    it.each([
      ['a name too short', { name: ' a ' }],
      ['a name too long', { name: 'x'.repeat(61) }],
      ['a description too long', { description: 'x'.repeat(201) }],
      ['a description that is not text', { description: 3 }],
      ['an unknown tier', { tier: 'gold' }],
      ['an unknown schedule', { schedule: { type: 'monthly' } }],
      ['no schedule', { schedule: null }],
      [
        'no days in a days-of-week schedule',
        { schedule: { type: 'days_of_week', daysOfWeek: [] } },
      ],
      ['all seven days', { schedule: { type: 'days_of_week', daysOfWeek: [1, 2, 3, 4, 5, 6, 7] } }],
      ['repeated days', { schedule: { type: 'days_of_week', daysOfWeek: [1, 1] } }],
      ['a day out of range', { schedule: { type: 'days_of_week', daysOfWeek: [0] } }],
      ['days that are not a list', { schedule: { type: 'days_of_week', daysOfWeek: '1' } }],
      ['seven times a week', { schedule: { type: 'times_per_week', timesPerWeek: 7 } }],
      ['a fractional times per week', { schedule: { type: 'times_per_week', timesPerWeek: 1.5 } }],
      ['a target of 1', { target: { amount: 1, unit: 'vasos' } }],
      ['a target without unit', { target: { amount: 8, unit: '  ' } }],
      ['a target that is not an object', { target: 8 }],
      ['an unknown status', { status: 'paused' }],
      ['no id', { id: 7 }],
    ])('counts a habit with %s as unreadable', (_case, overrides) => {
      const contents = read({ habits: [habitDoc('a', overrides), habitDoc('b')] });
      expect(contents.habits.map((habit) => habit.sourceId)).toEqual(['b']);
      expect(contents.unreadable).toBe(1);
    });

    it('counts entries that are not objects as unreadable', () => {
      expect(read({ habits: [null, 'x', habitDoc('b')] }).unreadable).toBe(2);
    });

    it('keeps the order of the list', () => {
      const contents = read({
        habits: [
          habitDoc('c', { sortOrder: 2 }),
          habitDoc('a', { sortOrder: 0 }),
          habitDoc('b', { sortOrder: 1 }),
          habitDoc('d'),
        ],
      });
      expect(contents.habits.map((habit) => habit.sourceId)).toEqual(['a', 'd', 'b', 'c']);
      const unsorted = read({ habits: [habitDoc('b', { sortOrder: 'x' }), habitDoc('a')] });
      expect(unsorted.habits.map((habit) => habit.sourceId)).toEqual(['b', 'a']);
    });
  });

  describe('rewards', () => {
    it('reads active rewards and leaves archived ones out', () => {
      const contents = read({
        rewards: [
          rewardDoc('movie', { name: ' Cine ', description: '', tier: 'medium', cost: 200 }),
          rewardDoc('old', { status: 'archived' }),
        ],
      });
      expect(contents.rewards).toEqual([
        {
          sourceId: 'movie',
          value: { name: 'Cine', description: null, tier: 'medium', cost: 200 },
        },
      ]);
      expect(contents.unreadable).toBe(0);
    });

    it.each([
      ['a cost of zero', { cost: 0 }],
      ['a fractional cost', { cost: 10.5 }],
      ['a cost over the limit', { cost: 1_000_001 }],
      ['an unknown tier', { tier: 'huge' }],
      ['a name too short', { name: 'x' }],
      ['an unknown status', { status: 'deleted' }],
    ])('counts a reward with %s as unreadable', (_case, overrides) => {
      const contents = read({ rewards: [rewardDoc('a', overrides)] });
      expect(contents.rewards).toEqual([]);
      expect(contents.unreadable).toBe(1);
    });
  });

  describe('tasks', () => {
    it('reads pending tasks and leaves completed ones out', () => {
      const contents = read({
        tasks: [
          taskDoc('b', { title: ' Informe ', size: 'large', dueDateKey: '2026-10-02' }),
          taskDoc('done', { completedDateKey: '2026-09-20' }),
          taskDoc('a', { dueDateKey: '2026-09-25' }),
          taskDoc('c', { title: 'Comprar', dueDateKey: '2026-10-02' }),
        ],
      });
      expect(contents.tasks).toEqual([
        { sourceId: 'a', value: { title: 'Tarea a', size: 'medium', dueDateKey: '2026-09-25' } },
        { sourceId: 'c', value: { title: 'Comprar', size: 'medium', dueDateKey: '2026-10-02' } },
        { sourceId: 'b', value: { title: 'Informe', size: 'large', dueDateKey: '2026-10-02' } },
      ]);
      expect(contents.unreadable).toBe(0);
    });

    it.each([
      ['an invalid date', { dueDateKey: '2026-02-30' }],
      ['an unknown size', { size: 'huge' }],
      ['a title too long', { title: 'x'.repeat(81) }],
      ['a completion that is not a date', { completedDateKey: 5 }],
    ])('counts a task with %s as unreadable', (_case, overrides) => {
      const contents = read({ tasks: [taskDoc('a', overrides)] });
      expect(contents.tasks).toEqual([]);
      expect(contents.unreadable).toBe(1);
    });
  });

  describe('goals', () => {
    it('reads active goals with their links and leaves achieved or archived ones out', () => {
      const contents = read({
        goals: [
          goalDoc('run', {
            title: ' Correr 10 km ',
            description: 'Antes de fin de año',
            targetDateKey: '2026-12-31',
            habitIds: ['h1', 'h1', 'h2'],
            taskIds: ['t1'],
          }),
          goalDoc('done', { status: 'achieved', achievedDateKey: '2026-09-10' }),
          goalDoc('old', { status: 'archived' }),
        ],
      });
      expect(contents.goals).toEqual([
        {
          sourceId: 'run',
          value: {
            title: 'Correr 10 km',
            description: 'Antes de fin de año',
            targetDateKey: '2026-12-31',
            habitIds: ['h1', 'h2'],
            taskIds: ['t1'],
          },
        },
      ]);
      expect(contents.unreadable).toBe(0);
    });

    it.each([
      ['links that are not a list', { habitIds: 'h1' }],
      ['links that are not text', { taskIds: [1] }],
      ['too many habits', { habitIds: Array.from({ length: 11 }, (_, index) => `h${index}`) }],
      ['an invalid deadline', { targetDateKey: '31-12-2026' }],
      ['a title too short', { title: 'x' }],
      ['an unknown status', { status: 'paused' }],
    ])('counts a goal with %s as unreadable', (_case, overrides) => {
      const contents = read({ goals: [goalDoc('a', overrides)] });
      expect(contents.goals).toEqual([]);
      expect(contents.unreadable).toBe(1);
    });
  });

  describe('reflections', () => {
    it('reads answered reflections of a week', () => {
      const contents = read({
        weeklyReflections: [
          reflectionDoc('2026-09-21', { wentWell: ' Bien ', nextFocus: 'Dormir' }),
          reflectionDoc('2026-09-14'),
        ],
      });
      expect(contents.reflections).toEqual([
        {
          sourceId: '2026-09-14',
          value: {
            weekStartDateKey: '2026-09-14',
            wentWell: 'Leí todos los días',
            wasHard: '',
            nextFocus: '',
          },
        },
        {
          sourceId: '2026-09-21',
          value: {
            weekStartDateKey: '2026-09-21',
            wentWell: 'Bien',
            wasHard: '',
            nextFocus: 'Dormir',
          },
        },
      ]);
    });

    it.each([
      ['a week that does not start on Monday', reflectionDoc('2026-09-22')],
      ['no answers', reflectionDoc('2026-09-21', { wentWell: '  ' })],
      ['an answer too long', reflectionDoc('2026-09-21', { wasHard: 'x'.repeat(501) })],
      ['an answer that is not text', reflectionDoc('2026-09-21', { nextFocus: null })],
    ])('counts a reflection with %s as unreadable', (_case, reflection) => {
      const contents = read({ weeklyReflections: [reflection] });
      expect(contents.reflections).toEqual([]);
      expect(contents.unreadable).toBe(1);
    });
  });
});

function habitRecord(id: string, overrides: Partial<HabitRecord> = {}): HabitRecord {
  return {
    id,
    name: `Hábito ${id}`,
    description: null,
    icon: 'check',
    color: '#9FCBAC',
    category: 'health',
    tier: 'secondary',
    schedule: { type: 'daily' },
    status: 'active',
    sortOrder: 0,
    startDateKey: '2026-09-01',
    archivedDateKey: null,
    ...overrides,
  };
}

function rewardRecord(id: string, overrides: Partial<RewardRecord> = {}): RewardRecord {
  return {
    id,
    name: `Recompensa ${id}`,
    description: null,
    icon: 'star',
    tier: 'small',
    cost: 60,
    status: 'active',
    sortOrder: 0,
    ...overrides,
  };
}

function taskRecord(id: string, overrides: Partial<Task> = {}): Task {
  return {
    id,
    title: `Tarea ${id}`,
    size: 'medium',
    dueDateKey: TODAY,
    completedDateKey: null,
    ...overrides,
  };
}

function goalRecord(id: string, overrides: Partial<Goal> = {}): Goal {
  return {
    id,
    title: `Meta ${id}`,
    description: null,
    targetDateKey: null,
    habitIds: [],
    taskIds: [],
    status: 'active',
    startDateKey: '2026-09-01',
    achievedDateKey: null,
    sortOrder: 0,
    ...overrides,
  };
}

const EMPTY_ACCOUNT: RestoreCurrent = {
  habits: [],
  rewards: [],
  tasks: [],
  goals: [],
  reflectionWeeks: [],
};

describe('planRestore', () => {
  it('selects everything by default in an empty account', () => {
    const contents = read({
      habits: [habitDoc('h1')],
      rewards: [rewardDoc('r1')],
      tasks: [taskDoc('t1')],
      goals: [goalDoc('g1')],
      weeklyReflections: [reflectionDoc('2026-09-21')],
    });
    const plan = planRestore({ contents, current: EMPTY_ACCOUNT, today: TODAY });
    expect(plan.selectedCount).toBe(5);
    for (const items of [plan.habits, plan.rewards, plan.tasks, plan.goals, plan.reflections]) {
      expect(items).toHaveLength(1);
      expect(items[0]).toMatchObject({ isSelected: true, existingId: null, notes: [] });
    }
    expect(plan.habits[0]?.key).toBe(restoreKey('habits', 'h1'));
  });

  it('skips what is already in the account, comparing names without case or spaces', () => {
    const contents = read({
      habits: [habitDoc('h1', { name: 'Leer' }), habitDoc('h2', { name: 'Correr' })],
      rewards: [rewardDoc('r1', { name: 'Cine' })],
      tasks: [taskDoc('t1', { title: 'Informe' })],
      goals: [goalDoc('g1', { title: 'Inglés A2' })],
      weeklyReflections: [reflectionDoc('2026-09-21')],
    });
    const current: RestoreCurrent = {
      habits: [
        habitRecord('mine', { name: ' leer ' }),
        habitRecord('gone', { name: 'Correr', status: 'archived', archivedDateKey: '2026-09-10' }),
      ],
      rewards: [rewardRecord('mine-r', { name: 'CINE' })],
      tasks: [taskRecord('mine-t', { title: 'informe' })],
      goals: [goalRecord('mine-g', { title: 'inglés a2' })],
      reflectionWeeks: ['2026-09-21'],
    };
    const plan = planRestore({ contents, current, today: TODAY });
    expect(plan.habits.map((item) => [item.sourceId, item.existingId, item.isSelected])).toEqual([
      ['h1', 'mine', false],
      ['h2', null, true],
    ]);
    expect(plan.rewards[0]).toMatchObject({ existingId: 'mine-r', isSelected: false });
    expect(plan.tasks[0]).toMatchObject({ existingId: 'mine-t', isSelected: false });
    expect(plan.goals[0]).toMatchObject({ existingId: 'mine-g', isSelected: false });
    expect(plan.reflections[0]).toMatchObject({ existingId: '2026-09-21', isSelected: false });
    expect(plan.selectedCount).toBe(1);
  });

  it('does not take a completed task or an achieved goal as a repeat', () => {
    const contents = read({
      tasks: [taskDoc('t1', { title: 'Informe' })],
      goals: [goalDoc('g1', { title: 'Inglés A2' })],
    });
    const current: RestoreCurrent = {
      ...EMPTY_ACCOUNT,
      tasks: [taskRecord('mine-t', { title: 'Informe', completedDateKey: '2026-09-29' })],
      goals: [
        goalRecord('mine-g', {
          title: 'Inglés A2',
          status: 'achieved',
          achievedDateKey: '2026-09-29',
        }),
      ],
    };
    const plan = planRestore({ contents, current, today: TODAY });
    expect(plan.tasks[0]?.isSelected).toBe(true);
    expect(plan.goals[0]?.isSelected).toBe(true);
  });

  it('leaves out what the user unchecked', () => {
    const contents = read({ habits: [habitDoc('h1'), habitDoc('h2')] });
    const plan = planRestore({
      contents,
      current: EMPTY_ACCOUNT,
      today: TODAY,
      deselected: new Set([restoreKey('habits', 'h1')]),
    });
    expect(plan.habits.map((item) => item.isSelected)).toEqual([false, true]);
    expect(plan.selectedCount).toBe(1);
  });

  it('makes primaries secondary once there is no room left, in list order', () => {
    const contents = read({
      habits: [
        habitDoc('p1', { tier: 'primary', sortOrder: 0 }),
        habitDoc('p2', { tier: 'primary', sortOrder: 1 }),
        habitDoc('s1', { tier: 'secondary', sortOrder: 2 }),
        habitDoc('p3', { tier: 'primary', sortOrder: 3 }),
      ],
    });
    const current: RestoreCurrent = {
      ...EMPTY_ACCOUNT,
      habits: [
        habitRecord('mine', { tier: 'primary' }),
        habitRecord('old', {
          tier: 'primary',
          status: 'archived',
          archivedDateKey: '2026-09-10',
        }),
      ],
    };
    const plan = planRestore({ contents, current, today: TODAY });
    expect(plan.habits.map((item) => [item.sourceId, item.value.tier, item.notes])).toEqual([
      ['p1', 'primary', []],
      ['p2', 'primary', []],
      ['s1', 'secondary', []],
      ['p3', 'secondary', ['made_secondary']],
    ]);
  });

  it('frees a primary place when the user unchecks a primary', () => {
    const contents = read({
      habits: [
        habitDoc('p1', { tier: 'primary', sortOrder: 0 }),
        habitDoc('p2', { tier: 'primary', sortOrder: 1 }),
        habitDoc('p3', { tier: 'primary', sortOrder: 2 }),
        habitDoc('p4', { tier: 'primary', sortOrder: 3 }),
      ],
    });
    const all = planRestore({ contents, current: EMPTY_ACCOUNT, today: TODAY });
    expect(all.habits.at(-1)?.notes).toEqual(['made_secondary']);
    const without = planRestore({
      contents,
      current: EMPTY_ACCOUNT,
      today: TODAY,
      deselected: new Set([restoreKey('habits', 'p1')]),
    });
    expect(without.habits.at(-1)?.value.tier).toBe('primary');
    expect(without.habits.at(-1)?.notes).toEqual([]);
  });

  it('moves overdue tasks to today', () => {
    const contents = read({
      tasks: [taskDoc('late', { dueDateKey: '2026-09-20' }), taskDoc('soon')],
    });
    const plan = planRestore({ contents, current: EMPTY_ACCOUNT, today: TODAY });
    expect(plan.tasks.map((item) => [item.value.dueDateKey, item.notes])).toEqual([
      [TODAY, ['moved_to_today']],
      ['2026-10-05', []],
    ]);
  });

  it('clears a deadline that already passed', () => {
    const contents = read({
      goals: [
        goalDoc('late', { targetDateKey: '2026-09-29' }),
        goalDoc('today', { targetDateKey: TODAY }),
      ],
    });
    const plan = planRestore({ contents, current: EMPTY_ACCOUNT, today: TODAY });
    expect(plan.goals.map((item) => [item.value.targetDateKey, item.notes])).toEqual([
      [null, ['deadline_cleared']],
      [TODAY, []],
    ]);
  });

  it('links goals to restored items, to the ones already in the account, or drops the link', () => {
    const contents = read({
      habits: [
        habitDoc('h-new', { name: 'Correr' }),
        habitDoc('h-mine', { name: 'Leer' }),
        habitDoc('h-off', { name: 'Yoga' }),
      ],
      tasks: [taskDoc('t-new', { title: 'Comprar zapatillas' })],
      goals: [
        goalDoc('g1', {
          habitIds: ['h-new', 'h-mine', 'h-off', 'h-archived'],
          taskIds: ['t-new', 't-done'],
        }),
      ],
    });
    const current: RestoreCurrent = {
      ...EMPTY_ACCOUNT,
      habits: [habitRecord('existing-read', { name: 'Leer' })],
    };
    const plan = planRestore({
      contents,
      current,
      today: TODAY,
      deselected: new Set([restoreKey('habits', 'h-off')]),
    });
    expect(plan.goals[0]?.value.habits).toEqual([
      { kind: 'restored', sourceId: 'h-new' },
      { kind: 'existing', id: 'existing-read' },
    ]);
    expect(plan.goals[0]?.value.tasks).toEqual([{ kind: 'restored', sourceId: 't-new' }]);
  });

  it('leaves out reflections of a week that has not ended', () => {
    const contents = read({
      weeklyReflections: [reflectionDoc('2026-09-28'), reflectionDoc('2026-09-21')],
    });
    const plan = planRestore({ contents, current: EMPTY_ACCOUNT, today: TODAY });
    expect(plan.reflections.map((item) => item.sourceId)).toEqual(['2026-09-21']);
  });
});
