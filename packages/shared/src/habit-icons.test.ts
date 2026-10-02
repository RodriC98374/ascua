import { describe, expect, it } from 'vitest';

import { HABIT_CATEGORY_IDS } from './habit-appearance';
import {
  CATEGORY_HABIT_ICONS,
  DEFAULT_HABIT_ICON,
  HABIT_ICON_GROUPS,
  HABIT_ICON_IDS,
  habitIconFor,
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

describe('CATEGORY_HABIT_ICONS', () => {
  it('gives every category a different icon of the catalog', () => {
    const icons = HABIT_CATEGORY_IDS.map((category) => CATEGORY_HABIT_ICONS[category]);
    for (const icon of icons) expect(isHabitIcon(icon)).toBe(true);
    expect(new Set(icons).size).toBe(icons.length);
  });
});

describe('habitIconFor', () => {
  it('keeps the icon the habit chose', () => {
    expect(habitIconFor({ icon: 'moon', category: 'health' })).toBe('moon');
  });

  it('falls back to the icon of its category, so every habit shows one', () => {
    expect(habitIconFor({ icon: 'check', category: 'physical' })).toBe(
      CATEGORY_HABIT_ICONS.physical,
    );
    expect(habitIconFor({ icon: null, category: 'academic' })).toBe(CATEGORY_HABIT_ICONS.academic);
  });

  it('uses the icon of "other" for a habit without a known category', () => {
    expect(habitIconFor({ icon: undefined, category: undefined })).toBe(CATEGORY_HABIT_ICONS.other);
    expect(habitIconFor({ icon: '🔥', category: 'mindfulness' })).toBe(CATEGORY_HABIT_ICONS.other);
  });
});
