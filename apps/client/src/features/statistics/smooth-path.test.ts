import { describe, expect, it } from '@jest/globals';

import { smoothPath, smoothValues, type CurvePoint } from './smooth-path';

/** Los números de un trazado `M x y C ...` como puntos [x, y]. */
function coordinates(path: string): [number, number][] {
  const numbers = path.match(/-?\d+(\.\d+)?/g)!.map(Number);
  const pairs: [number, number][] = [];
  for (let index = 0; index < numbers.length; index += 2) {
    pairs.push([numbers[index]!, numbers[index + 1]!]);
  }
  return pairs;
}

describe('smoothPath', () => {
  it('draws nothing without points and only a start with one', () => {
    expect(smoothPath([])).toBe('');
    expect(smoothPath([{ x: 4, y: 7 }])).toBe('M 4 7');
  });

  it('joins two points with a straight line', () => {
    expect(
      smoothPath([
        { x: 0, y: 10 },
        { x: 30, y: 40 },
      ]),
    ).toBe('M 0 10 L 30 40');
  });

  it('goes through every point with one cubic curve per gap', () => {
    const points: CurvePoint[] = [
      { x: 0, y: 50 },
      { x: 20, y: 30 },
      { x: 40, y: 45 },
      { x: 60, y: 10 },
    ];
    const path = smoothPath(points);
    expect(path.match(/C/g)).toHaveLength(3);
    // Cada curva termina en el punto siguiente: las últimas coordenadas de cada `C`.
    const ends = path
      .split('C')
      .slice(1)
      .map((segment) => coordinates(segment).at(-1));
    expect(ends).toEqual([
      [20, 30],
      [40, 45],
      [60, 10],
    ]);
  });

  it('never leaves the range between two neighbours, even at a sharp turn', () => {
    // Una caída brusca: un suavizado común se pasaría por debajo del último punto.
    const points: CurvePoint[] = [
      { x: 0, y: 10 },
      { x: 20, y: 10 },
      { x: 40, y: 90 },
      { x: 60, y: 90 },
      { x: 80, y: 10 },
    ];
    const ys = coordinates(smoothPath(points)).map(([, y]) => y);
    expect(Math.min(...ys)).toBeGreaterThanOrEqual(10);
    expect(Math.max(...ys)).toBeLessThanOrEqual(90);
  });

  it('keeps a flat stretch flat', () => {
    const path = smoothPath([
      { x: 0, y: 20 },
      { x: 20, y: 20 },
      { x: 40, y: 20 },
    ]);
    expect(new Set(coordinates(path).map(([, y]) => y))).toEqual(new Set([20]));
  });
});

describe('smoothValues', () => {
  it('returns the same values when there is nothing to smooth', () => {
    expect(smoothValues([3, 5], 8)).toEqual([3, 5]);
    expect(smoothValues([1, 2, 3], 1)).toEqual([1, 2, 3]);
    expect(smoothValues([], 8)).toEqual([]);
  });

  it('keeps every original value at its position and adds the steps between', () => {
    const values = [4, 9, 2, 7];
    const result = smoothValues(values, 5);
    expect(result).toHaveLength((values.length - 1) * 5 + 1);
    values.forEach((value, index) => expect(result[index * 5]).toBeCloseTo(value, 10));
  });

  it('never goes below zero when a streak drops and stays at zero', () => {
    const result = smoothValues([20, 20, 20, 0, 0, 0], 8);
    expect(Math.min(...result)).toBeGreaterThanOrEqual(0);
    expect(Math.max(...result)).toBeLessThanOrEqual(20);
  });

  it('stays between two neighbours, so a rising line only rises', () => {
    const result = smoothValues([1, 2, 6, 7, 20], 8);
    for (let index = 1; index < result.length; index++) {
      expect(result[index]!).toBeGreaterThanOrEqual(result[index - 1]! - 1e-9);
    }
  });
});
