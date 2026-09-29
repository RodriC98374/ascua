import { describe, expect, it } from '@jest/globals';
import type { Habit, PlannedHabitReminder, PlannedReminder } from '@ascua/shared';

import {
  buildHabitReminderRequests,
  buildReminderRequests,
  reminderPlanSignature,
} from './reminder-requests';

const plan: PlannedReminder[] = [
  {
    id: 'streak_risk-2026-09-23',
    kind: 'streak_risk',
    dateKey: '2026-09-23',
    fireAt: new Date('2026-09-24T01:00:00Z'),
  },
  {
    id: 'daily-2026-09-24',
    kind: 'daily',
    dateKey: '2026-09-24',
    fireAt: new Date('2026-09-24T12:00:00Z'),
  },
];

describe('buildReminderRequests', () => {
  it('keeps the plan id, order and time and adds the text of each kind', () => {
    const [streakRisk, daily] = buildReminderRequests(plan);
    expect(streakRisk).toEqual({
      identifier: 'streak_risk-2026-09-23',
      title: 'Aún puedes cumplir tu meta de hoy',
      body: expect.stringContaining('medianoche'),
      fireAt: new Date('2026-09-24T01:00:00Z'),
    });
    expect(daily).toMatchObject({ identifier: 'daily-2026-09-24', title: 'Hora de tus hábitos' });
  });

  it('is empty for an empty plan', () => {
    expect(buildReminderRequests([])).toEqual([]);
  });
});

const reading: Habit = {
  id: 'read',
  name: 'Leer 20 minutos',
  tier: 'primary',
  schedule: { type: 'daily' },
  status: 'active',
  startDateKey: '2026-09-01',
  archivedDateKey: null,
};

const habitPlan: PlannedHabitReminder<Habit>[] = [
  {
    id: 'habit-read-2026-09-23',
    habit: reading,
    dateKey: '2026-09-23',
    fireAt: new Date('2026-09-23T23:30:00Z'),
  },
];

describe('buildHabitReminderRequests', () => {
  it('uses the habit name as the title and keeps the plan id and time', () => {
    expect(buildHabitReminderRequests(habitPlan)).toEqual([
      {
        identifier: 'habit-read-2026-09-23',
        title: 'Leer 20 minutos',
        body: expect.stringContaining('Hoy'),
        fireAt: new Date('2026-09-23T23:30:00Z'),
      },
    ]);
  });

  it('mentions the daily target of a habit with quantity', () => {
    const water = { ...reading, name: 'Agua', target: { amount: 8, unit: 'vasos' } };
    const [request] = buildHabitReminderRequests([{ ...habitPlan[0]!, habit: water }]);
    expect(request?.body).toContain('8 vasos');
  });
});

describe('reminderPlanSignature', () => {
  it('is the same for the same plan', () => {
    expect(reminderPlanSignature(buildReminderRequests(plan))).toBe(
      reminderPlanSignature(buildReminderRequests([...plan])),
    );
  });

  it('changes when a time or a reminder changes', () => {
    const base = reminderPlanSignature(buildReminderRequests(plan));
    const moved = plan.map((reminder, index) =>
      index === 0 ? { ...reminder, fireAt: new Date('2026-09-24T02:00:00Z') } : reminder,
    );
    expect(reminderPlanSignature(buildReminderRequests(moved))).not.toBe(base);
    expect(reminderPlanSignature(buildReminderRequests(plan.slice(1)))).not.toBe(base);
  });

  it('changes when a habit is renamed, so the notification shows the new name', () => {
    const base = reminderPlanSignature(buildHabitReminderRequests(habitPlan));
    const renamed = habitPlan.map((reminder) => ({
      ...reminder,
      habit: { ...reminder.habit, name: 'Leer 30 minutos' },
    }));
    expect(reminderPlanSignature(buildHabitReminderRequests(renamed))).not.toBe(base);
  });
});
