import { describe, expect, it } from '@jest/globals';
import type { PlannedReminder } from '@ascua/shared';

import { buildReminderRequests, reminderPlanSignature } from './reminder-requests';

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
});
