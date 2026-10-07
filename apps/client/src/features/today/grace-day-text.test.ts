import { describe, expect, it } from '@jest/globals';

import { graceDayMessage } from './grace-day-text';

const status = (overrides = {}) => ({
  missingPrimaries: 0,
  missingOthers: 0,
  streakDays: 0,
  freezes: 0,
  ...overrides,
});

describe('graceDayMessage', () => {
  it('says nothing when everything was marked yesterday', () => {
    expect(graceDayMessage(status({ streakDays: 5 }))).toBeNull();
  });

  it('says what is at stake for the streak when primaries are missing', () => {
    expect(graceDayMessage(status({ missingPrimaries: 2, streakDays: 5 }))).toBe(
      'Ayer te faltaron 2 principales. Márcalos hasta las 00:00 y tu racha de 5 días sigue viva.',
    );
  });

  it('uses the singular for one primary and one day of streak', () => {
    expect(graceDayMessage(status({ missingPrimaries: 1, streakDays: 1 }))).toBe(
      'Ayer te faltó 1 principal. Márcalo hasta las 00:00 y tu racha de 1 día sigue viva.',
    );
  });

  it('warns a freeze would be spent when there is one to spend', () => {
    expect(graceDayMessage(status({ missingPrimaries: 1, streakDays: 8, freezes: 1 }))).toBe(
      'Ayer te faltó 1 principal. Márcalo hasta las 00:00 o se usará un protector para cuidar tu racha de 8 días.',
    );
  });

  it('only offers to count the day when there is no streak to protect', () => {
    expect(graceDayMessage(status({ missingPrimaries: 2 }))).toBe(
      'Ayer te faltaron 2 principales. Márcalos hasta las 00:00 para que ayer cuente.',
    );
  });

  it('mentions only points when just secondaries are missing', () => {
    expect(graceDayMessage(status({ missingOthers: 3, streakDays: 5 }))).toBe(
      'Ayer quedaron 3 hábitos sin marcar. Aún suman puntos hasta las 00:00.',
    );
    expect(graceDayMessage(status({ missingOthers: 1 }))).toBe(
      'Ayer quedó 1 hábito sin marcar. Aún suma puntos hasta las 00:00.',
    );
  });

  it('keeps the streak line when primaries and secondaries are missing', () => {
    expect(graceDayMessage(status({ missingPrimaries: 1, missingOthers: 2, streakDays: 3 }))).toBe(
      'Ayer te faltó 1 principal. Márcalo hasta las 00:00 y tu racha de 3 días sigue viva.',
    );
  });
});
