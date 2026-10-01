import { describe, expect, it } from 'vitest';

import {
  DEFAULT_HABIT_ICON,
  HABIT_ICON_GROUPS,
  HABIT_ICON_IDS,
  habitIconOf,
  isHabitIcon,
} from './habit-icons';

describe('HABIT_ICON_IDS', () => {
  it('offers a wide variety without duplicates', () => {
    expect(HABIT_ICON_IDS.length).toBeGreaterThanOrEqual(90);
    expect(new Set(HABIT_ICON_IDS).size).toBe(HABIT_ICON_IDS.length);
  });

  it('only holds kebab-case ids that fit in the 40 characters firestore.rules allows', () => {
    for (const id of HABIT_ICON_IDS) {
      expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
      expect(id.length).toBeLessThanOrEqual(40);
    }
  });

  it('leaves out the default, which means "no icon"', () => {
    expect(DEFAULT_HABIT_ICON).toBe('check');
    expect(HABIT_ICON_IDS).not.toContain(DEFAULT_HABIT_ICON);
  });
});

describe('HABIT_ICON_GROUPS', () => {
  it('puts every icon in exactly one labelled group', () => {
    const grouped = HABIT_ICON_GROUPS.flatMap((group) => group.icons);
    expect([...grouped].sort()).toEqual([...HABIT_ICON_IDS].sort());
    for (const group of HABIT_ICON_GROUPS) {
      expect(group.label.length).toBeGreaterThan(0);
      expect(group.icons.length).toBeGreaterThan(0);
    }
  });
});

describe('isHabitIcon', () => {
  it('accepts the icons of the catalog only', () => {
    expect(isHabitIcon('dumbbell')).toBe(true);
    expect(isHabitIcon('check')).toBe(false);
    expect(isHabitIcon('🔥')).toBe(false);
    expect(isHabitIcon(undefined)).toBe(false);
  });
});

describe('habitIconOf', () => {
  it('returns the icon of a habit, or null when it has none', () => {
    expect(habitIconOf('book-open')).toBe('book-open');
    expect(habitIconOf('check')).toBeNull();
  });

  it('treats anything outside the catalog as no icon', () => {
    expect(habitIconOf('🔥')).toBeNull();
    expect(habitIconOf('unknown-icon')).toBeNull();
    expect(habitIconOf(null)).toBeNull();
  });
});
