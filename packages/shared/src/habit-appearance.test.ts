import { describe, expect, it } from 'vitest';

import {
  categoryOf,
  DEFAULT_HABIT_CATEGORY,
  HABIT_CATEGORIES,
  HABIT_CATEGORY_IDS,
  HABIT_COLOR_ROTATION,
  HABIT_COLORS,
  isHabitCategory,
  isHabitColor,
  nextHabitColor,
  strongHabitColor,
  TASK_COLOR,
  visibleHabitColors,
} from './habit-appearance';

describe('HABIT_CATEGORIES', () => {
  it('lists every category id exactly once', () => {
    const ids = HABIT_CATEGORIES.map((category) => category.id);
    expect(ids).toEqual([...HABIT_CATEGORY_IDS]);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('gives every category a label and a default color from the palette', () => {
    for (const category of HABIT_CATEGORIES) {
      expect(category.label.length).toBeGreaterThan(0);
      expect(HABIT_COLORS).toContain(category.color);
    }
  });

  it('uses a distinct default color per category so the grid never repeats one', () => {
    const colors = HABIT_CATEGORIES.map((category) => category.color);
    expect(new Set(colors).size).toBe(colors.length);
  });

  it('falls back to "other", the category legacy habits get', () => {
    expect(DEFAULT_HABIT_CATEGORY).toBe('other');
    expect(HABIT_CATEGORY_IDS).toContain('other');
  });
});

describe('HABIT_COLORS', () => {
  it('only holds six-digit uppercase hex colors, as firestore.rules expects', () => {
    for (const color of HABIT_COLORS) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('has no duplicates', () => {
    expect(new Set(HABIT_COLORS).size).toBe(HABIT_COLORS.length);
  });

  it('offers twenty-four colors to choose from', () => {
    expect(HABIT_COLORS).toHaveLength(24);
  });
});

describe('HABIT_COLOR_ROTATION', () => {
  it('holds every palette color exactly once', () => {
    expect([...HABIT_COLOR_ROTATION].sort()).toEqual([...HABIT_COLORS].sort());
  });
});

describe('nextHabitColor', () => {
  const habit = (color: unknown, status: 'active' | 'archived' = 'active') => ({ color, status });
  const [first, second, third] = HABIT_COLOR_ROTATION;

  it('starts with the first color of the rotation', () => {
    expect(nextHabitColor([])).toBe(first);
  });

  it('gives each new habit a color no active habit has yet', () => {
    expect(nextHabitColor([habit(first)])).toBe(second);
    expect(nextHabitColor([habit(second), habit(first)])).toBe(third);
    // Un hueco en la rotación se llena primero.
    expect(nextHabitColor([habit(first), habit(third)])).toBe(second);
  });

  it('frees the color of an archived habit', () => {
    expect(nextHabitColor([habit(first, 'archived'), habit(second)])).toBe(first);
  });

  it('ignores colors outside the palette', () => {
    expect(nextHabitColor([habit('#8B5CF6'), habit(undefined)])).toBe(first);
  });

  it('repeats the least used color once all are taken', () => {
    const all = HABIT_COLOR_ROTATION.map((color) => habit(color));
    expect(nextHabitColor(all)).toBe(first);
    expect(nextHabitColor([...all, habit(first)])).toBe(second);
  });
});

describe('visibleHabitColors', () => {
  it('shows the first eight colors of the palette', () => {
    expect(visibleHabitColors(HABIT_COLORS[0])).toEqual(HABIT_COLORS.slice(0, 8));
    expect(visibleHabitColors(HABIT_COLORS[7])).toEqual(HABIT_COLORS.slice(0, 8));
  });

  it('keeps the chosen color in sight when it is one of the rest', () => {
    const chosen = HABIT_COLORS[20];
    expect(visibleHabitColors(chosen)).toEqual([...HABIT_COLORS.slice(0, 7), chosen]);
  });
});

describe('TASK_COLOR', () => {
  it('is one of the habit colors, so it has its strong tone for the check', () => {
    expect(isHabitColor(TASK_COLOR)).toBe(true);
  });
});

describe('strongHabitColor', () => {
  it('gives every pastel a distinct dark tone', () => {
    const strong = HABIT_COLORS.map(strongHabitColor);
    expect(new Set(strong).size).toBe(HABIT_COLORS.length);
    for (const color of strong) {
      expect(color).toMatch(/^#[0-9A-F]{6}$/);
    }
  });

  it('is darker than its pastel, so a thin stroke stays legible on white', () => {
    const luminance = (hex: string) =>
      [1, 3, 5].reduce((sum, at) => sum + parseInt(hex.slice(at, at + 2), 16), 0);
    for (const color of HABIT_COLORS) {
      expect(luminance(strongHabitColor(color))).toBeLessThan(luminance(color));
    }
  });

  it('keeps a contrast of at least 3:1 against white', () => {
    const channel = (value: number) => {
      const s = value / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    };
    const relativeLuminance = (hex: string) =>
      0.2126 * channel(parseInt(hex.slice(1, 3), 16)) +
      0.7152 * channel(parseInt(hex.slice(3, 5), 16)) +
      0.0722 * channel(parseInt(hex.slice(5, 7), 16));
    for (const color of HABIT_COLORS) {
      const contrast = 1.05 / (relativeLuminance(strongHabitColor(color)) + 0.05);
      expect(contrast, color).toBeGreaterThanOrEqual(3);
    }
  });

  it('falls back to grey for a color outside the palette', () => {
    expect(strongHabitColor('#FF6B35')).toBe('#57534E');
    expect(strongHabitColor(undefined)).toBe('#57534E');
  });
});

describe('isHabitCategory', () => {
  it('accepts every known id', () => {
    for (const id of HABIT_CATEGORY_IDS) {
      expect(isHabitCategory(id)).toBe(true);
    }
  });

  it('rejects anything else', () => {
    expect(isHabitCategory('salud')).toBe(false);
    expect(isHabitCategory('')).toBe(false);
    expect(isHabitCategory(undefined)).toBe(false);
    expect(isHabitCategory(null)).toBe(false);
    expect(isHabitCategory(7)).toBe(false);
  });
});

describe('isHabitColor', () => {
  it('accepts a color from the palette', () => {
    expect(isHabitColor(HABIT_COLORS[0])).toBe(true);
  });

  it('rejects a color outside the palette or a malformed one', () => {
    expect(isHabitColor('#123456')).toBe(false);
    expect(isHabitColor('red')).toBe(false);
    expect(isHabitColor(undefined)).toBe(false);
  });
});

describe('categoryOf', () => {
  it('returns the category of a known id', () => {
    expect(categoryOf('health').label).toBe('Salud');
    expect(categoryOf('academic').color).toBe(
      HABIT_CATEGORIES.find((category) => category.id === 'academic')?.color,
    );
  });

  it('falls back to "other" for a habit saved before categories existed', () => {
    expect(categoryOf(undefined).id).toBe('other');
    expect(categoryOf('mindfulness').id).toBe('other');
  });
});
