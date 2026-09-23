import { assertFails } from '@firebase/rules-unit-testing';
import { describe, expect, it } from 'vitest';

import { buildExportFile } from '../../../../apps/client/src/data/export-files';
import { OTHER, OWNER, otherDb, ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  ANIME,
  gamificationDoc,
  habitDoc,
  openLogDoc,
  paths,
  pendingState,
  profileDoc,
  rewardDoc,
  seedDocs,
  TODAY,
  transactionDoc,
  YESTERDAY,
} from '../support/fixtures';

useRulesTestEnvironment();

const NOW = new Date();

async function seedAccount() {
  await seedDocs({
    [paths.user()]: profileDoc(),
    [paths.gamification()]: gamificationDoc(pendingState({ pointsBalance: 10 })),
    [paths.habit('read')]: habitDoc({ name: 'Leer; 20 min', startDateKey: YESTERDAY }),
    [paths.dailyLog(TODAY)]: openLogDoc(TODAY, { read: { completed: true } }),
    [paths.reward(ANIME.id)]: rewardDoc(),
    [paths.transaction('t1')]: transactionDoc({
      id: 't1',
      type: 'habit_completion',
      amount: 10,
      balanceAfter: 10,
      dateKey: YESTERDAY,
      sourceType: 'habit',
      sourceId: 'read',
      description: 'Leer 20 minutos',
    }),
  });
}

describe('export files', () => {
  it('backs up every document with its fields and instants in Bolivia ISO', async () => {
    await seedAccount();
    const file = await buildExportFile(ownerDb(), OWNER, 'backup', NOW);

    expect(file.name).toBe(`ascua-respaldo-${TODAY}.json`);
    expect(file.mimeType).toBe('application/json');
    const backup = JSON.parse(file.content);
    expect(backup).toMatchObject({
      format: 'ascua-backup',
      userId: OWNER,
      profile: { displayName: 'Usuario', schemaVersion: 1 },
      gamification: { pointsBalance: 10 },
      habits: [{ id: 'read', name: 'Leer; 20 min', startDateKey: YESTERDAY }],
      dailyLogs: [{ id: TODAY, entries: { read: { completed: true } } }],
      monthlySummaries: [],
      pointTransactions: [{ id: 't1', amount: 10 }],
      rewards: [{ id: ANIME.id, name: ANIME.name }],
      rewardRedemptions: [],
    });
    expect(backup.habits[0].createdAt).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}-04:00$/,
    );
  });

  it('writes the habits per day CSV from the first habit until today', async () => {
    await seedAccount();
    const file = await buildExportFile(ownerDb(), OWNER, 'habit_days', NOW);

    expect(file.name).toBe(`ascua-habitos-por-dia-${TODAY}.csv`);
    const lines = file.content.slice(1).trim().split('\r\n');
    expect(lines).toEqual([
      'Fecha;Estado;% cumplido;Puntos;Racha;"Leer; 20 min"',
      `${YESTERDAY};Sin cerrar;0;;;0`,
      `${TODAY};En curso;100;;;1`,
    ]);
  });

  it('writes the points CSV with the server instant of each movement', async () => {
    await seedAccount();
    const file = await buildExportFile(ownerDb(), OWNER, 'point_transactions', NOW);

    const [, row] = file.content.slice(1).trim().split('\r\n');
    expect(row).toMatch(
      new RegExp(
        `^${YESTERDAY};\\d{4}-\\d{2}-\\d{2}T[\\d:.]+-04:00;Hábito cumplido;Leer 20 minutos;10;10$`,
      ),
    );
  });

  it('cannot read the data of another user', async () => {
    await seedAccount();
    await assertFails(buildExportFile(otherDb(), OWNER, 'backup', NOW));
    // El otro usuario sí puede exportar lo suyo (vacío).
    const own = JSON.parse((await buildExportFile(otherDb(), OTHER, 'backup', NOW)).content);
    expect(own.habits).toEqual([]);
  });
});
