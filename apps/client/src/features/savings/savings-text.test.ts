import { describe, expect, it } from '@jest/globals';

import { depositOptions, savingsErrorMessage } from './savings-text';

describe('depositOptions', () => {
  it('offers the quick amounts that fit and the maximum', () => {
    expect(depositOptions(300)).toEqual([10, 25, 50, 100, 300]);
    expect(depositOptions(40)).toEqual([10, 25, 40]);
    expect(depositOptions(50)).toEqual([10, 25, 50]);
  });

  it('offers nothing when there is nothing to set aside', () => {
    expect(depositOptions(0)).toEqual([]);
  });
});

describe('savingsErrorMessage', () => {
  it('explains each reason', () => {
    expect(savingsErrorMessage({ reason: 'over_limit', maxDeposit: 30 })).toBe(
      'Ahora puedes apartar hasta 30 pts.',
    );
    expect(savingsErrorMessage({ reason: 'over_limit', maxDeposit: 0 })).toBe(
      'No te quedan puntos libres para apartar.',
    );
    expect(savingsErrorMessage({ reason: 'other_reward' })).toBe(
      'Ya tienes una alcancía para otra recompensa.',
    );
    expect(savingsErrorMessage({ reason: 'reward_archived' })).toBe(
      'Esta recompensa ya no está disponible.',
    );
  });

  it('asks for a connection when offline', () => {
    expect(savingsErrorMessage({ code: 'unavailable' })).toMatch(/conexión/);
  });

  it('falls back to a generic message', () => {
    expect(savingsErrorMessage(new Error('boom'))).toBe(
      'No se pudo apartar. Tus puntos no cambiaron; vuelve a intentarlo.',
    );
  });
});
