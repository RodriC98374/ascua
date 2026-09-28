import { describe, expect, it } from '@jest/globals';

import { checkInStatusText, formatCheckInAverage } from './check-in-text';

describe('formatCheckInAverage', () => {
  it('shows one decimal with a comma, as in Spanish', () => {
    expect(formatCheckInAverage(3.456)).toBe('3,5');
    expect(formatCheckInAverage(4)).toBe('4,0');
  });

  it('shows a dash without answers', () => {
    expect(formatCheckInAverage(null)).toBe('—');
  });
});

describe('checkInStatusText', () => {
  it('invites to answer when nothing is answered yet', () => {
    expect(checkInStatusText({})).toBe('Del 1 al 5. No da puntos: es para ver cómo te sientes.');
  });

  it('says how many scales are left', () => {
    expect(checkInStatusText({ mood: 3 })).toBe('Te faltan 2.');
    expect(checkInStatusText({ mood: 3, energy: 4 })).toBe('Te falta 1.');
  });

  it('closes the day when every scale is answered', () => {
    expect(checkInStatusText({ mood: 3, energy: 4, motivation: 5 })).toBe(
      'Listo por hoy. Lo verás en Mes.',
    );
  });
});
