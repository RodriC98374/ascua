// Restaurar la configuración desde un respaldo (fase 19) contra el emulador y las reglas reales: lo
// que crea tiene que pasar las mismas reglas que los formularios, sin ninguna puerta especial.
import {
  addDays,
  planRestore,
  readBackup,
  startOfWeek,
  type BackupContents,
  type RestoreCurrent,
} from '@ascua/shared';
import { collection, getDocs, type DocumentData, type Firestore } from 'firebase/firestore';
import { describe, expect, it } from 'vitest';

import {
  goalsCollection,
  habitsCollection,
  rewardsCollection,
  tasksCollection,
} from '../../../../apps/client/src/data/documents';
import { buildExportFile } from '../../../../apps/client/src/data/export-files';
import { restoreConfiguration } from '../../../../apps/client/src/operations/restore';
import { OTHER, OWNER, otherDb, ownerDb, useRulesTestEnvironment } from '../support/env';
import {
  ANIME,
  goalDoc,
  habitDoc,
  paths,
  reflectionDoc,
  rewardDoc,
  seedDocs,
  taskDoc,
  TODAY,
  TOMORROW,
  YESTERDAY,
} from '../support/fixtures';

useRulesTestEnvironment();

const LAST_WEEK = addDays(startOfWeek(TODAY), -7);
const NO_SORT_ORDERS = { habits: 0, rewards: 0, goals: 0 };
const EMPTY: RestoreCurrent = {
  habits: [],
  rewards: [],
  tasks: [],
  goals: [],
  reflectionWeeks: [],
};

/** Una cuenta con de todo: lo que se restaura y lo que no. */
async function seedOwner() {
  await seedDocs({
    [paths.habit('read')]: habitDoc({ startDateKey: YESTERDAY, sortOrder: 0 }),
    [paths.habit('water')]: habitDoc({
      name: 'Vasos de agua',
      tier: 'secondary',
      schedule: { type: 'days_of_week', daysOfWeek: [1, 3, 5] },
      target: { amount: 8, unit: 'vasos' },
      reminder: { time: '09:00', daysOfWeek: [1, 5] },
      sortOrder: 1,
    }),
    [paths.habit('old')]: habitDoc({
      name: 'Correr',
      status: 'archived',
      archivedDateKey: YESTERDAY,
    }),
    [paths.reward(ANIME.id)]: rewardDoc(),
    [paths.task('late')]: taskDoc({ title: 'Informe', dueDateKey: YESTERDAY }),
    [paths.task('next')]: taskDoc({ title: 'Pagar la luz', dueDateKey: TOMORROW }),
    [paths.task('done')]: taskDoc({ title: 'Llamar', completedDateKey: YESTERDAY }),
    [paths.goal('calculus')]: goalDoc({
      targetDateKey: YESTERDAY,
      habitIds: ['read', 'old'],
      taskIds: ['late', 'done'],
    }),
    [paths.goal('english')]: goalDoc({
      title: 'Inglés A2',
      status: 'achieved',
      achievedDateKey: YESTERDAY,
    }),
    [paths.reflection(LAST_WEEK)]: reflectionDoc(LAST_WEEK),
  });
}

async function ownerBackup(): Promise<BackupContents> {
  const file = await buildExportFile(ownerDb(), OWNER, 'backup', new Date());
  const result = readBackup(file.content);
  if (!result.ok) throw new Error(result.error);
  return result.contents;
}

async function list(db: Firestore, uid: string, name: string): Promise<DocumentData[]> {
  const snapshot = await getDocs(collection(db, 'users', uid, name));
  return snapshot.docs.map((document) => ({ id: document.id, ...document.data() }));
}

describe('restoreConfiguration', () => {
  it('recreates the configuration of a backup in another account, passing the rules', async () => {
    await seedOwner();
    const contents = await ownerBackup();
    const db = otherDb();
    const plan = planRestore({ contents, current: EMPTY, today: TODAY });

    const counts = await restoreConfiguration(db, OTHER, plan, NO_SORT_ORDERS, TODAY);

    expect(counts).toEqual({ habits: 2, rewards: 1, tasks: 2, goals: 1, reflections: 1 });
    const habits = await list(db, OTHER, 'habits');
    expect(habits).toHaveLength(2);
    const water = habits.find((habit) => habit.name === 'Vasos de agua');
    expect(water).toMatchObject({
      tier: 'secondary',
      schedule: { type: 'days_of_week', daysOfWeek: [1, 3, 5] },
      target: { amount: 8, unit: 'vasos' },
      reminder: { time: '09:00', daysOfWeek: [1, 5] },
      status: 'active',
      startDateKey: TODAY,
      archivedDateKey: null,
      sortOrder: 1,
    });
    const read = habits.find((habit) => habit.name === 'Leer 20 minutos');

    const tasks = await list(db, OTHER, 'tasks');
    expect(tasks.map((task) => [task.title, task.dueDateKey]).sort()).toEqual([
      ['Informe', TODAY],
      ['Pagar la luz', TOMORROW],
    ]);
    const report = tasks.find((task) => task.title === 'Informe');

    const [goal] = await list(db, OTHER, 'goals');
    expect(goal).toMatchObject({
      title: 'Aprobar Cálculo',
      targetDateKey: null,
      habitIds: [read?.id],
      taskIds: [report?.id],
      status: 'active',
      startDateKey: TODAY,
    });

    expect(await list(db, OTHER, 'rewards')).toMatchObject([
      { name: ANIME.name, cost: ANIME.cost, status: 'active' },
    ]);
    expect(await list(db, OTHER, 'weeklyReflections')).toMatchObject([
      { id: LAST_WEEK, weekStartDateKey: LAST_WEEK, wentWell: 'Cumplí casi todos los días' },
    ]);
    expect(await list(db, OTHER, 'dailyLogs')).toEqual([]);
    expect(await list(db, OTHER, 'pointTransactions')).toEqual([]);
  });

  it('finds everything repeated when restoring into the same account', async () => {
    await seedOwner();
    const contents = await ownerBackup();
    const db = ownerDb();
    const [habits, rewards, tasks, goals] = await Promise.all([
      getDocs(habitsCollection(db, OWNER)),
      getDocs(rewardsCollection(db, OWNER)),
      getDocs(tasksCollection(db, OWNER)),
      getDocs(goalsCollection(db, OWNER)),
    ]);
    const current: RestoreCurrent = {
      habits: habits.docs.map((document) => document.data()),
      rewards: rewards.docs.map((document) => document.data()),
      tasks: tasks.docs.map((document) => document.data()),
      goals: goals.docs.map((document) => document.data()),
      reflectionWeeks: [LAST_WEEK],
    };

    const plan = planRestore({ contents, current, today: TODAY });

    expect(plan.selectedCount).toBe(0);
    expect(await restoreConfiguration(db, OWNER, plan, NO_SORT_ORDERS, TODAY)).toEqual({
      habits: 0,
      rewards: 0,
      tasks: 0,
      goals: 0,
      reflections: 0,
    });
  });

  it('writes large backups in several batches', async () => {
    const tasks = Array.from({ length: 450 }, (_, index) => ({
      sourceId: `t${index}`,
      value: { title: `Tarea ${index}`, size: 'small' as const, dueDateKey: TOMORROW },
    }));
    const contents: BackupContents = {
      exportedAt: null,
      habits: [],
      rewards: [],
      tasks,
      goals: [],
      reflections: [],
      unreadable: 0,
    };
    const db = otherDb();
    const plan = planRestore({ contents, current: EMPTY, today: TODAY });

    await restoreConfiguration(db, OTHER, plan, NO_SORT_ORDERS, TODAY);

    expect(await list(db, OTHER, 'tasks')).toHaveLength(450);
  });
});
