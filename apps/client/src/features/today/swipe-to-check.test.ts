import { describe, expect, it } from '@jest/globals';

import { isSwipeCommitted, SWIPE, swipeOffset, swipeThreshold } from './swipe-to-check';

describe('swipeThreshold', () => {
  it('is a fraction of the row width on a phone', () => {
    expect(swipeThreshold(300)).toBeCloseTo(300 * SWIPE.thresholdRatio);
  });

  it('never asks for more than the maximum on wide rows', () => {
    expect(swipeThreshold(480)).toBe(SWIPE.maxThreshold);
  });
});

describe('swipeOffset', () => {
  const threshold = 100;

  it('never moves the row to the left', () => {
    expect(swipeOffset(-40, threshold)).toBe(0);
    expect(swipeOffset(0, threshold)).toBe(0);
  });

  it('follows the finger up to the threshold', () => {
    expect(swipeOffset(60, threshold)).toBe(60);
    expect(swipeOffset(threshold, threshold)).toBe(threshold);
  });

  it('resists past the threshold', () => {
    expect(swipeOffset(200, threshold)).toBe(threshold + 100 * SWIPE.overdragResistance);
  });
});

describe('isSwipeCommitted', () => {
  const threshold = 100;

  it('commits once the threshold is reached', () => {
    expect(isSwipeCommitted(threshold, 0, threshold)).toBe(true);
    expect(isSwipeCommitted(150, -200, threshold)).toBe(true);
  });

  it('cancels a slow release before the threshold', () => {
    expect(isSwipeCommitted(threshold - 1, 0, threshold)).toBe(false);
  });

  it('commits a fast fling from half the threshold', () => {
    expect(isSwipeCommitted(threshold / 2, SWIPE.flingVelocity, threshold)).toBe(true);
  });

  it('cancels a fast fling that did not reach half the threshold', () => {
    expect(isSwipeCommitted(threshold / 2 - 1, SWIPE.flingVelocity * 2, threshold)).toBe(false);
  });

  it('cancels a leftward swipe', () => {
    expect(isSwipeCommitted(-150, -2000, threshold)).toBe(false);
  });
});
