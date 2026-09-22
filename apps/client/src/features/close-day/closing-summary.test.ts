import { describe, expect, it } from '@jest/globals';

import type { ClosedDay } from '../../operations/close-pending-days';
import { closingErrorKind, describeClosing } from './closing-summary';

function day(overrides: Partial<ClosedDay>): ClosedDay {
  return {
    dateKey: '2026-09-21',
    status: 'completed',
    pointsEarned: 15,
    freezeUsed: false,
    streakBeforeClose: 4,
    streakAfterClose: 5,
    ...overrides,
  };
}

describe('describeClosing', () => {
  it('shows nothing when no day was closed', () => {
    expect(describeClosing([])).toBeNull();
  });

  it('shows nothing when every closed day was inactive (no habits yet)', () => {
    expect(
      describeClosing([day({ status: 'inactive', pointsEarned: 0, streakAfterClose: 0 })]),
    ).toBeNull();
  });

  it('celebrates the points and the streak after closing yesterday', () => {
    expect(describeClosing([day({})])).toEqual({
      title: 'Cerramos el día de ayer',
      details: ['+15 puntos pasaron a tu saldo.', 'Tu racha va en 5 días.'],
    });
  });

  it('sums the points of several days and names how many were closed', () => {
    const summary = describeClosing([
      day({ dateKey: '2026-09-19', pointsEarned: 10, streakBeforeClose: 2, streakAfterClose: 3 }),
      day({ dateKey: '2026-09-20', pointsEarned: 20, streakBeforeClose: 3, streakAfterClose: 4 }),
    ]);
    expect(summary?.title).toBe('Cerramos tus últimos 2 días');
    expect(summary?.details[0]).toBe('+30 puntos pasaron a tu saldo.');
  });

  it('says which day a freeze protected the streak', () => {
    const summary = describeClosing([
      day({ status: 'frozen', pointsEarned: 0, freezeUsed: true, streakAfterClose: 4 }),
    ]);
    expect(summary?.details).toEqual([
      'Un protector cuidó tu racha el lunes, 21 de septiembre.',
      'Tu racha sigue en 4 días.',
    ]);
  });

  it('counts several freezes in one sentence', () => {
    const summary = describeClosing([
      day({ dateKey: '2026-09-20', status: 'frozen', pointsEarned: 0, freezeUsed: true }),
      day({ status: 'frozen', pointsEarned: 0, freezeUsed: true, streakAfterClose: 4 }),
    ]);
    expect(summary?.details[0]).toBe('2 protectores cuidaron tu racha.');
  });

  it('announces a new start without blaming when a streak was lost', () => {
    const summary = describeClosing([
      day({ status: 'missed', pointsEarned: 5, streakBeforeClose: 6, streakAfterClose: 0 }),
    ]);
    expect(summary?.details).toEqual([
      '+5 puntos pasaron a tu saldo.',
      'Tu racha volvió a empezar. Hoy puedes encenderla de nuevo.',
    ]);
  });

  it('uses the singular for one point and one streak day', () => {
    const summary = describeClosing([
      day({ pointsEarned: 1, streakBeforeClose: 0, streakAfterClose: 1 }),
    ]);
    expect(summary?.details).toEqual(['+1 punto pasó a tu saldo.', 'Tu racha va en 1 día.']);
  });
});

describe('closingErrorKind', () => {
  const firestoreError = (code: string) => Object.assign(new Error(code), { code });

  it('treats a missing connection as offline', () => {
    expect(closingErrorKind(firestoreError('unavailable'))).toBe('offline');
  });

  it('treats a rules rejection as rejected', () => {
    expect(closingErrorKind(firestoreError('permission-denied'))).toBe('rejected');
  });

  it('treats anything else as unknown', () => {
    expect(closingErrorKind(firestoreError('internal'))).toBe('unknown');
    expect(closingErrorKind('boom')).toBe('unknown');
  });
});
