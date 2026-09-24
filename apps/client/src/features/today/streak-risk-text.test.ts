import { describe, expect, it } from '@jest/globals';

import { streakRiskMessage } from './streak-risk-text';

const MINUTE = 60 * 1000;
const HOUR = 60 * MINUTE;

describe('streakRiskMessage', () => {
  it('names the streak at stake when there is no freeze', () => {
    expect(streakRiskMessage({ kind: 'save', msLeft: 2 * HOUR + 35 * MINUTE }, 12)).toBe(
      'Quedan 2 h 35 min para salvar tu racha de 12 días.',
    );
  });

  it('says a freeze will save the streak', () => {
    expect(streakRiskMessage({ kind: 'freeze', msLeft: 40 * MINUTE }, 5)).toBe(
      'Quedan 40 min. Si no cumples tus principales, un protector salvará tu racha.',
    );
  });

  it('invites to start the streak', () => {
    expect(streakRiskMessage({ kind: 'start', msLeft: 3 * HOUR }, 0)).toBe(
      'Quedan 3 h para encender tu racha.',
    );
  });

  it('uses the singular for one hour or one minute and for a one-day streak', () => {
    expect(streakRiskMessage({ kind: 'save', msLeft: HOUR + 5 * MINUTE }, 1)).toBe(
      'Queda 1 h 5 min para salvar tu racha de 1 día.',
    );
    expect(streakRiskMessage({ kind: 'start', msLeft: MINUTE }, 0)).toBe(
      'Queda 1 min para encender tu racha.',
    );
    expect(streakRiskMessage({ kind: 'start', msLeft: 10 * 1000 }, 0)).toBe(
      'Quedan menos de 1 min para encender tu racha.',
    );
  });
});
