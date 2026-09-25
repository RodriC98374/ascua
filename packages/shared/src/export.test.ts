import { describe, expect, it } from 'vitest';

import {
  buildBackup,
  buildHabitDaysCsv,
  buildPointTransactionsCsv,
  exportFileName,
  toCsv,
  type TimedPointTransaction,
} from './export';
import type { DailyLog, HabitRecord } from './types';

const BOM = String.fromCharCode(0xfeff);

/** Filas del CSV sin el BOM, separadas en celdas (sirve solo para celdas sin comillas). */
function parse(csv: string): string[][] {
  expect(csv.startsWith(BOM)).toBe(true);
  return csv
    .slice(1)
    .split('\r\n')
    .filter((line) => line !== '')
    .map((line) => line.split(';'));
}

function habit(overrides: Partial<HabitRecord>): HabitRecord {
  return {
    id: 'read',
    name: 'Leer',
    description: null,
    icon: 'check',
    color: '#A3C4D9',
    category: 'academic',
    tier: 'primary',
    schedule: { type: 'daily' },
    status: 'active',
    sortOrder: 0,
    startDateKey: '2026-09-20',
    archivedDateKey: null,
    ...overrides,
  };
}

function closedLog(
  dateKey: string,
  overrides: Partial<NonNullable<DailyLog['summary']>> = {},
  status: DailyLog['status'] = 'completed',
): DailyLog {
  return {
    dateKey,
    entries: {},
    status,
    summary: {
      scheduledHabitIds: ['read', 'run'],
      scheduledPrimaryHabitIds: ['read'],
      completedHabitIds: ['read'],
      completionRate: 0.5,
      isPerfectDay: false,
      pointsEarned: 10,
      streakAfterClose: 3,
      ...overrides,
    },
  };
}

describe('toCsv', () => {
  it('starts with a BOM, separates with semicolons and ends lines with CRLF', () => {
    expect(
      toCsv([
        ['a', 1],
        ['b', null],
      ]),
    ).toBe(`${BOM}a;1\r\nb;\r\n`);
  });

  it('quotes cells with separators, quotes or line breaks', () => {
    expect(toCsv([['Leer; 20 min', 'Dijo "hola"', 'dos\nlíneas']])).toBe(
      `${BOM}"Leer; 20 min";"Dijo ""hola""";"dos\nlíneas"\r\n`,
    );
  });
});

describe('buildHabitDaysCsv', () => {
  const habits = [
    habit({ id: 'run', name: 'Correr', tier: 'secondary', sortOrder: 1 }),
    habit({ id: 'read', name: 'Leer', sortOrder: 0 }),
  ];

  it('has one row per day from the first habit until today, oldest first', () => {
    const rows = parse(buildHabitDaysCsv({ habits, dailyLogs: [], today: '2026-09-22' }));
    expect(rows[0]).toEqual(['Fecha', 'Estado', '% cumplido', 'Puntos', 'Racha', 'Leer', 'Correr']);
    expect(rows.slice(1).map((row) => row[0])).toEqual(['2026-09-20', '2026-09-21', '2026-09-22']);
  });

  it('uses the closed summary: 1 done, 0 not done, empty when not scheduled', () => {
    const rows = parse(
      buildHabitDaysCsv({
        habits,
        dailyLogs: [
          closedLog('2026-09-20', { scheduledHabitIds: ['read'], completedHabitIds: ['read'] }),
          closedLog('2026-09-21'),
        ],
        today: '2026-09-22',
      }),
    );
    expect(rows[1]).toEqual(['2026-09-20', 'Cumplido', '100', '10', '3', '1', '']);
    expect(rows[2]).toEqual(['2026-09-21', 'Cumplido', '50', '10', '3', '1', '0']);
  });

  it('labels every closed status in Spanish', () => {
    const rows = parse(
      buildHabitDaysCsv({
        habits: [habit({ startDateKey: '2026-09-17' })],
        dailyLogs: [
          closedLog('2026-09-17', { isPerfectDay: true }),
          closedLog('2026-09-18', {}, 'frozen'),
          closedLog('2026-09-19', {}, 'missed'),
          closedLog('2026-09-20', { scheduledHabitIds: [], completedHabitIds: [] }, 'inactive'),
        ],
        today: '2026-09-22',
      }),
    );
    expect(rows.slice(1).map((row) => row[1])).toEqual([
      'Perfecto',
      'Protegido',
      'Perdido',
      'Sin hábitos',
      'Sin cerrar',
      'En curso',
    ]);
    expect(rows[4]?.slice(2)).toEqual(['', '10', '3', '']);
  });

  it('uses the marks of today while the day is open', () => {
    const rows = parse(
      buildHabitDaysCsv({
        habits,
        dailyLogs: [
          {
            dateKey: '2026-09-22',
            entries: { run: { completed: true }, read: { completed: false } },
            status: 'open',
            summary: null,
          },
        ],
        today: '2026-09-22',
      }),
    );
    expect(rows.at(-1)).toEqual(['2026-09-22', 'En curso', '50', '', '', '0', '1']);
  });

  it('marks archived habits in the header and leaves them empty after archiving', () => {
    const rows = parse(
      buildHabitDaysCsv({
        // Mismo `sortOrder`: desempata el día de inicio, así que el archivado va primero.
        habits: [
          habit({ id: 'new', name: 'Leer', startDateKey: '2026-09-22', sortOrder: 0 }),
          habit({ status: 'archived', archivedDateKey: '2026-09-21' }),
        ],
        dailyLogs: [],
        today: '2026-09-22',
      }),
    );
    expect(rows[0]?.slice(5)).toEqual(['Leer (archivado)', 'Leer']);
    expect(rows.at(-1)?.slice(5)).toEqual(['', '0']);
    expect(rows[1]?.slice(5)).toEqual(['0', '']);
  });

  it('has only the header when there are no habits', () => {
    expect(
      parse(buildHabitDaysCsv({ habits: [], dailyLogs: [], today: '2026-09-22' })),
    ).toHaveLength(1);
  });
});

describe('buildPointTransactionsCsv', () => {
  function movement(overrides: Partial<TimedPointTransaction>): TimedPointTransaction {
    return {
      id: 'x',
      type: 'habit_completion',
      amount: 10,
      balanceAfter: 10,
      dateKey: '2026-09-21',
      sourceType: 'habit',
      sourceId: 'read',
      description: 'Leer',
      createdAt: new Date('2026-09-22T04:00:01Z'),
      ...overrides,
    };
  }

  it('lists movements oldest first with their Bolivia instant and a Spanish type', () => {
    const rows = parse(
      buildPointTransactionsCsv([
        movement({
          id: 'b',
          type: 'reward_redemption',
          amount: -60,
          balanceAfter: 25,
          dateKey: '2026-09-22',
          description: 'Tarde de anime',
          createdAt: new Date('2026-09-22T20:00:00Z'),
        }),
        movement({ id: 'a', balanceAfter: 85 }),
        movement({
          id: 'c',
          type: 'perfect_day_bonus',
          amount: 5,
          balanceAfter: 90,
          createdAt: null,
        }),
      ]),
    );
    expect(rows[0]).toEqual(['Fecha', 'Registrado', 'Tipo', 'Descripción', 'Puntos', 'Saldo']);
    expect(rows.slice(1)).toEqual([
      ['2026-09-21', '', 'Bono de día perfecto', 'Leer', '5', '90'],
      ['2026-09-21', '2026-09-22T00:00:01.000-04:00', 'Hábito cumplido', 'Leer', '10', '85'],
      [
        '2026-09-22',
        '2026-09-22T16:00:00.000-04:00',
        'Canje de recompensa',
        'Tarde de anime',
        '-60',
        '25',
      ],
    ]);
  });

  it('has a label for every type', () => {
    const types = [
      'streak_bonus_7_days',
      'streak_bonus_30_days',
      'streak_freeze_purchase',
      'manual_adjustment',
      'task_completion',
    ] as const;
    const rows = parse(
      buildPointTransactionsCsv(types.map((type, i) => movement({ id: String(i), type }))),
    );
    expect(rows.slice(1).map((row) => row[2])).toEqual([
      'Bono de 7 días',
      'Bono de 30 días',
      'Compra de protector',
      'Ajuste manual',
      'Tareas cumplidas',
    ]);
  });
});

describe('buildBackup', () => {
  const instant = (iso: string) => ({ seconds: 0, nanoseconds: 0, toDate: () => new Date(iso) });

  it('keeps every collection, sorted by id, with instants in Bolivia ISO', () => {
    const backup = buildBackup({
      userId: 'uid-1',
      exportedAt: new Date('2026-09-23T16:00:00Z'),
      profile: {
        id: 'uid-1',
        data: { displayName: 'Rodri', createdAt: instant('2026-09-21T12:00:00Z') },
      },
      gamification: { id: 'gamification', data: { pointsBalance: 25 } },
      habits: [
        { id: 'b', data: { name: 'Correr', entries: [instant('2026-09-21T04:00:00Z')] } },
        {
          id: 'a',
          data: { name: 'Leer', nested: { updatedAt: new Date('2026-09-21T05:00:00Z') } },
        },
      ],
      dailyLogs: [{ id: '2026-09-21', data: { entries: { a: { completed: true } } } }],
      monthlySummaries: [],
      pointTransactions: [],
      rewards: [],
      rewardRedemptions: [],
      tasks: [
        { id: 't2', data: { title: 'Pagar luz', completedAt: instant('2026-09-22T15:00:00Z') } },
        { id: 't1', data: { title: 'Llamar', completedAt: null } },
      ],
    });

    expect(backup).toEqual({
      format: 'ascua-backup',
      formatVersion: 1,
      exportedAt: '2026-09-23T12:00:00.000-04:00',
      timeZone: 'America/La_Paz',
      userId: 'uid-1',
      profile: { displayName: 'Rodri', createdAt: '2026-09-21T08:00:00.000-04:00' },
      gamification: { pointsBalance: 25 },
      habits: [
        { id: 'a', name: 'Leer', nested: { updatedAt: '2026-09-21T01:00:00.000-04:00' } },
        { id: 'b', name: 'Correr', entries: ['2026-09-21T00:00:00.000-04:00'] },
      ],
      dailyLogs: [{ id: '2026-09-21', entries: { a: { completed: true } } }],
      monthlySummaries: [],
      pointTransactions: [],
      rewards: [],
      rewardRedemptions: [],
      tasks: [
        { id: 't1', title: 'Llamar', completedAt: null },
        { id: 't2', title: 'Pagar luz', completedAt: '2026-09-22T11:00:00.000-04:00' },
      ],
    });
  });

  it('writes null for missing single documents and survives a JSON round trip', () => {
    const backup = buildBackup({
      userId: 'uid-1',
      exportedAt: new Date('2026-09-23T16:00:00Z'),
      profile: null,
      gamification: null,
      habits: [],
      dailyLogs: [],
      monthlySummaries: [],
      pointTransactions: [],
      rewards: [],
      rewardRedemptions: [],
      tasks: [],
    });
    expect(backup.profile).toBeNull();
    expect(JSON.parse(JSON.stringify(backup))).toEqual(backup);
  });
});

describe('exportFileName', () => {
  it('names each file with the Bolivia day', () => {
    expect(exportFileName('backup', '2026-09-23')).toBe('ascua-respaldo-2026-09-23.json');
    expect(exportFileName('habit_days', '2026-09-23')).toBe('ascua-habitos-por-dia-2026-09-23.csv');
    expect(exportFileName('point_transactions', '2026-09-23')).toBe(
      'ascua-movimientos-de-puntos-2026-09-23.csv',
    );
  });
});
