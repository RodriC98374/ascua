import { describe, expect, it } from '@jest/globals';

import { moneyTimeText, parseWholeAmount, pointsTimeText, rateText } from './calculator-text';

describe('moneyTimeText', () => {
  it('fits in one month of budget', () => {
    expect(moneyTimeText(0.4)).toBe('Entra en tu presupuesto de un mes.');
    expect(moneyTimeText(1)).toBe('Entra en tu presupuesto de un mes.');
  });

  it('says how many months of budget it takes, rounding up', () => {
    expect(moneyTimeText(2.7)).toBe('Juntas el dinero en 3 meses de presupuesto.');
    expect(moneyTimeText(1.1)).toBe('Juntas el dinero en 2 meses de presupuesto.');
  });
});

describe('pointsTimeText', () => {
  it('celebrates when the points are already there', () => {
    expect(pointsTimeText(0, 40)).toBe('Ya te alcanzan los puntos.');
  });

  it('says the days at the real pace', () => {
    expect(pointsTimeText(1, 40)).toBe('A tu ritmo (40 pts por día), en 1 día.');
    expect(pointsTimeText(75, 42.6)).toBe('A tu ritmo (43 pts por día), en unos 75 días.');
  });

  it('explains when there is no pace yet', () => {
    expect(pointsTimeText(null, null)).toBe(
      'Todavía no hay días cerrados para medir tu ritmo de puntos.',
    );
  });
});

describe('rateText', () => {
  it('shows the rate with one decimal at most', () => {
    expect(rateText(5)).toBe('5');
    expect(rateText(3.333)).toBe('3,3');
  });
});

describe('parseWholeAmount', () => {
  it('reads a whole number of Bs', () => {
    expect(parseWholeAmount('250')).toBe(250);
    expect(parseWholeAmount(' 75 ')).toBe(75);
  });

  it('is null for empty or non-whole text', () => {
    expect(parseWholeAmount('')).toBeNull();
    expect(parseWholeAmount('2,5')).toBeNull();
    expect(parseWholeAmount('abc')).toBeNull();
  });
});
