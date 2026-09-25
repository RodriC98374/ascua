// Las reglas calculan fechas sin Intl. El emulador no permite fijar `request.time`, así que las
// funciones de fecha se prueban directamente mediante sondas (ver `rulesForTests`).
import {
  DAILY_TASK_POINTS_CAP,
  HABIT_POINTS,
  MAX_STREAK_FREEZES,
  PERFECT_DAY_BONUS,
  STREAK_BONUSES,
  STREAK_FREEZE_COST,
} from '@ascua/shared';
import { assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, Timestamp, type DocumentData } from 'firebase/firestore';
import { describe, it } from 'vitest';

import { ownerDb, useRulesTestEnvironment } from '../support/env';
import { seedDocs } from '../support/fixtures';

useRulesTestEnvironment();

let caseNumber = 0;

async function probe(name: string, data: DocumentData) {
  const path = `probes/${name}/cases/case-${++caseNumber}`;
  await seedDocs({ [path]: data });
  return getDoc(doc(ownerDb(), path));
}

describe('dateKeyOf (Bolivia day of an instant)', () => {
  const cases: [string, string][] = [
    ['2026-09-22T03:59:59.999Z', '2026-09-21'], // 23:59:59 en Bolivia
    ['2026-09-22T04:00:00.000Z', '2026-09-22'], // 00:00 en Bolivia
    ['2026-10-01T03:59:00.000Z', '2026-09-30'], // cambio de mes
    ['2027-01-01T03:30:00.000Z', '2026-12-31'], // cambio de año
    ['2028-02-29T15:00:00.000Z', '2028-02-29'], // año bisiesto
  ];

  it.each(cases)('maps %s to %s', async (instant, expected) => {
    await assertSucceeds(
      probe('dateKeyOf', { at: Timestamp.fromDate(new Date(instant)), expected }),
    );
  });

  it('rejects a wrong day at the midnight border', async () => {
    await assertFails(
      probe('dateKeyOf', {
        at: Timestamp.fromDate(new Date('2026-09-22T03:59:59.999Z')),
        expected: '2026-09-22',
      }),
    );
  });
});

describe('nextDateKey and prevDateKey', () => {
  const cases: [string, string][] = [
    ['2026-09-21', '2026-09-22'],
    ['2026-09-30', '2026-10-01'],
    ['2026-12-31', '2027-01-01'],
    ['2027-02-28', '2027-03-01'],
    ['2028-02-28', '2028-02-29'],
  ];

  it.each(cases)('the day after %s is %s', async (input, expected) => {
    await assertSucceeds(probe('nextDateKey', { input, expected }));
    await assertSucceeds(probe('prevDateKey', { input: expected, expected: input }));
  });
});

describe('isDateKey', () => {
  it.each(['2026-09-21', '2028-02-29', '2026-12-31'])('accepts %s', async (input) => {
    await assertSucceeds(probe('isDateKey', { input }));
  });

  it.each(['2026-02-30', '2027-02-29', '2026-13-01', '2026-9-21', '20260921', '2026-09-21T00'])(
    'rejects %s',
    async (input) => {
      await assertFails(probe('isDateKey', { input }));
    },
  );

  it('rejects values that are not strings', async () => {
    await assertFails(probe('isDateKey', { input: 20260921 }));
  });
});

describe('rulesConstants', () => {
  it('matches the business constants in @ascua/shared', async () => {
    const streakBonuses = Object.fromEntries(
      STREAK_BONUSES.map((bonus) => [
        bonus.type,
        { everyDays: bonus.everyDays, points: bonus.points },
      ]),
    );
    await assertSucceeds(
      probe('constants', {
        expected: {
          habitPoints: HABIT_POINTS,
          perfectDayBonus: PERFECT_DAY_BONUS,
          streakBonuses,
          streakFreezeCost: STREAK_FREEZE_COST,
          maxStreakFreezes: MAX_STREAK_FREEZES,
          dailyTaskPointsCap: DAILY_TASK_POINTS_CAP,
        },
      }),
    );
  });
});
