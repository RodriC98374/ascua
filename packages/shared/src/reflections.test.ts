import { describe, expect, it } from 'vitest';

import {
  canWriteReflection,
  invitedReflectionWeek,
  isReflectionAnswered,
  reflectionWeekEnd,
} from './reflections';

// 2026-09-21 es lunes y 2026-09-27, domingo.
describe('reflectionWeekEnd', () => {
  it('is the Sunday of the week', () => {
    expect(reflectionWeekEnd('2026-09-21')).toBe('2026-09-27');
  });
});

describe('canWriteReflection', () => {
  it('opens on the Sunday of the week and stays open', () => {
    expect(canWriteReflection('2026-09-21', '2026-09-26')).toBe(false);
    expect(canWriteReflection('2026-09-21', '2026-09-27')).toBe(true);
    expect(canWriteReflection('2026-09-21', '2026-12-01')).toBe(true);
  });

  it('only takes a Monday as the week', () => {
    expect(canWriteReflection('2026-09-22', '2026-10-30')).toBe(false);
  });

  it('rejects something that is not a date', () => {
    expect(canWriteReflection('2026-02-30', '2026-10-30')).toBe(false);
  });
});

describe('invitedReflectionWeek', () => {
  it('invites to this week on Sunday', () => {
    expect(invitedReflectionWeek('2026-09-27')).toBe('2026-09-21');
  });

  it('invites to the week that just ended on Monday', () => {
    expect(invitedReflectionWeek('2026-09-28')).toBe('2026-09-21');
  });

  it('does not invite the rest of the week', () => {
    for (const day of ['2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03']) {
      expect(invitedReflectionWeek(day)).toBeNull();
    }
  });
});

describe('isReflectionAnswered', () => {
  it('needs at least one answer with text', () => {
    expect(isReflectionAnswered({ wentWell: '  ', wasHard: '', nextFocus: '' })).toBe(false);
    expect(isReflectionAnswered({ wentWell: '', wasHard: '', nextFocus: 'Dormir antes' })).toBe(
      true,
    );
  });
});
