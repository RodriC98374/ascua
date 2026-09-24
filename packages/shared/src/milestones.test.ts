import { describe, expect, it } from 'vitest';

import { STREAK_MILESTONES } from './constants';
import { milestoneProgress, milestoneReached } from './milestones';

describe('STREAK_MILESTONES', () => {
  it('are a week, a month, a hundred days and a year, in order', () => {
    expect(STREAK_MILESTONES).toEqual([7, 30, 100, 365]);
  });
});

describe('milestoneReached', () => {
  it.each([
    [6, 7, 7],
    [29, 30, 30],
    [99, 100, 100],
    [364, 365, 365],
  ])('reaches a milestone going from %d to %d days', (from, to, milestone) => {
    expect(milestoneReached(from, to)).toBe(milestone);
  });

  it.each([
    [0, 1],
    [7, 8],
    [8, 7],
    [7, 7],
  ])('reaches nothing going from %d to %d days', (from, to) => {
    expect(milestoneReached(from, to)).toBeNull();
  });

  it('returns the largest milestone crossed in a single jump', () => {
    expect(milestoneReached(5, 31)).toBe(30);
  });
});

describe('milestoneProgress', () => {
  it('starts with nothing earned and the first milestone a week away', () => {
    expect(milestoneProgress(0, 0)).toEqual({
      best: 0,
      earned: [],
      next: { days: 7, remaining: 7 },
    });
  });

  it('earns milestones with the best streak and counts the next one from the current streak', () => {
    expect(milestoneProgress(20, 18)).toEqual({
      best: 20,
      earned: [7],
      next: { days: 30, remaining: 12 },
    });
  });

  it('keeps earned milestones after the streak resets', () => {
    expect(milestoneProgress(40, 3)).toEqual({
      best: 40,
      earned: [7, 30],
      next: { days: 100, remaining: 97 },
    });
  });

  it('counts today when the current streak already beats the best one', () => {
    expect(milestoneProgress(6, 7)).toEqual({
      best: 7,
      earned: [7],
      next: { days: 30, remaining: 23 },
    });
  });

  it('has no next milestone after a full year', () => {
    expect(milestoneProgress(400, 5)).toEqual({
      best: 400,
      earned: [7, 30, 100, 365],
      next: null,
    });
  });
});
