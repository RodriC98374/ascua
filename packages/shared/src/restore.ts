// Restaurar la configuración desde un respaldo JSON (fase 19, D26). Solo se recupera lo que se puede
// volver a crear con las reglas de siempre: hábitos y metas activos (empiezan hoy), recompensas
// activas, tareas pendientes y reflexiones. El historial, los puntos y la racha no se restauran.
// Lógica pura: la app lee el archivo, muestra el plan y escribe lo elegido.
import {
  GOAL_DESCRIPTION_MAX_LENGTH,
  GOAL_TITLE_MAX_LENGTH,
  GOAL_TITLE_MIN_LENGTH,
  HABIT_DESCRIPTION_MAX_LENGTH,
  HABIT_NAME_MAX_LENGTH,
  HABIT_NAME_MIN_LENGTH,
  MAX_GOAL_HABITS,
  MAX_GOAL_TASKS,
  MAX_PRIMARY_HABITS,
  REFLECTION_ANSWER_MAX_LENGTH,
  REWARD_COST_MAX,
  REWARD_DESCRIPTION_MAX_LENGTH,
  REWARD_NAME_MAX_LENGTH,
  REWARD_NAME_MIN_LENGTH,
  TARGET_AMOUNT_MAX,
  TARGET_AMOUNT_MIN,
  TARGET_UNIT_MAX_LENGTH,
  TASK_TITLE_MAX_LENGTH,
  TASK_TITLE_MIN_LENGTH,
  TIMES_PER_WEEK_MAX,
  TIMES_PER_WEEK_MIN,
} from './constants';
import { isoWeekday, isValidDateKey } from './dates';
import { EXPORT_FORMAT, EXPORT_FORMAT_VERSION } from './export';
import {
  categoryOf,
  isHabitCategory,
  isHabitColor,
  DEFAULT_HABIT_CATEGORY,
  type HabitCategory,
  type HabitColor,
} from './habit-appearance';
import { DEFAULT_HABIT_ICON, habitIconOf } from './habit-icons';
import { isValidHabitReminder } from './habit-reminders';
import { canWriteReflection, isReflectionAnswered } from './reflections';
import type {
  DateKey,
  Goal,
  HabitRecord,
  HabitReminder,
  HabitSchedule,
  HabitTarget,
  HabitTier,
  RewardRecord,
  RewardTier,
  Task,
  TaskSize,
  WeeklyReflection,
} from './types';

/** Lo que hace falta para volver a crear un hábito (empieza el día que se restaura). */
export interface RestoredHabit {
  name: string;
  description: string | null;
  tier: HabitTier;
  category: HabitCategory;
  /** El ícono elegido, o el valor por defecto si no tenía o ya no está en el catálogo. */
  icon: string;
  color: HabitColor;
  schedule: HabitSchedule;
  target: HabitTarget | null;
  reminder: HabitReminder | null;
}

export interface RestoredReward {
  name: string;
  description: string | null;
  tier: RewardTier;
  cost: number;
}

export interface RestoredTask {
  title: string;
  size: TaskSize;
  dueDateKey: DateKey;
}

/** Una meta del respaldo; sus vínculos son IDs del respaldo, no de la cuenta. */
export interface RestoredGoal {
  title: string;
  description: string | null;
  targetDateKey: DateKey | null;
  habitIds: string[];
  taskIds: string[];
}

export type RestoredReflection = WeeklyReflection;

/** Un documento del respaldo que se puede restaurar, con su ID original. */
export interface SourceItem<T> {
  sourceId: string;
  value: T;
}

export interface BackupContents {
  /** Instante de la exportación (ISO con offset), si el archivo lo trae. */
  exportedAt: string | null;
  habits: SourceItem<RestoredHabit>[];
  rewards: SourceItem<RestoredReward>[];
  tasks: SourceItem<RestoredTask>[];
  goals: SourceItem<RestoredGoal>[];
  reflections: SourceItem<RestoredReflection>[];
  /** Documentos con una forma que no se reconoce: no se restauran. */
  unreadable: number;
}

export type BackupReadError = 'not_json' | 'not_backup' | 'newer_version';

export type BackupReadResult =
  { ok: true; contents: BackupContents } | { ok: false; error: BackupReadError };

type UnknownRecord = Record<string, unknown>;

/** Resultado de leer un documento: restaurable, fuera del alcance (archivado…) o ilegible. */
type Parsed<T> = { value: T; order: number } | 'skip' | 'unreadable';

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isInteger(value: unknown, min: number, max: number): value is number {
  return Number.isInteger(value) && (value as number) >= min && (value as number) <= max;
}

/** Texto recortado dentro del largo, o null si no lo es. */
function text(value: unknown, min: number, max: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length >= min && trimmed.length <= max ? trimmed : null;
}

/** Descripción opcional: null, vacía o texto hasta `max`. `undefined` si no es válida. */
function optionalText(value: unknown, max: number): string | null | undefined {
  if (value === null || value === undefined) return null;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (trimmed.length > max) return undefined;
  return trimmed || null;
}

function order(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function isDayList(value: unknown, maxSize: number): value is number[] {
  return (
    Array.isArray(value) &&
    value.length >= 1 &&
    value.length <= maxSize &&
    value.every((day) => isInteger(day, 1, 7)) &&
    new Set(value).size === value.length
  );
}

function readSchedule(value: unknown): HabitSchedule | null {
  if (!isRecord(value)) return null;
  if (value.type === 'daily') return { type: 'daily' };
  // Como en las reglas, de 1 a 6 días: los siete se guardan como diario.
  if (value.type === 'days_of_week' && isDayList(value.daysOfWeek, 6))
    return { type: 'days_of_week', daysOfWeek: [...value.daysOfWeek].sort((a, b) => a - b) };
  if (
    value.type === 'times_per_week' &&
    isInteger(value.timesPerWeek, TIMES_PER_WEEK_MIN, TIMES_PER_WEEK_MAX)
  )
    return { type: 'times_per_week', timesPerWeek: value.timesPerWeek };
  return null;
}

/** `undefined` si la meta no es válida; null si el hábito no tiene. */
function readTarget(value: unknown): HabitTarget | null | undefined {
  if (value === null || value === undefined) return null;
  if (!isRecord(value)) return undefined;
  const unit = text(value.unit, 1, TARGET_UNIT_MAX_LENGTH);
  if (!isInteger(value.amount, TARGET_AMOUNT_MIN, TARGET_AMOUNT_MAX) || unit === null)
    return undefined;
  return { amount: value.amount, unit };
}

/** Un recordatorio que no encaja se deja afuera sin perder el hábito: se vuelve a poner fácil. */
function readReminder(value: unknown, schedule: HabitSchedule): HabitReminder | null {
  if (!isRecord(value) || typeof value.time !== 'string' || !isDayList(value.daysOfWeek, 7))
    return null;
  const reminder = {
    time: value.time,
    daysOfWeek: [...value.daysOfWeek].sort((a, b) => a - b),
  };
  return isValidHabitReminder(reminder, schedule) ? reminder : null;
}

function parseHabit(doc: UnknownRecord): Parsed<RestoredHabit> {
  if (doc.status === 'archived') return 'skip';
  if (doc.status !== 'active') return 'unreadable';
  const name = text(doc.name, HABIT_NAME_MIN_LENGTH, HABIT_NAME_MAX_LENGTH);
  const description = optionalText(doc.description, HABIT_DESCRIPTION_MAX_LENGTH);
  const schedule = readSchedule(doc.schedule);
  const target = readTarget(doc.target);
  const tier = doc.tier;
  if (
    name === null ||
    description === undefined ||
    (tier !== 'primary' && tier !== 'secondary') ||
    schedule === null ||
    target === undefined
  )
    return 'unreadable';
  // Los hábitos de antes de las categorías (o con un color que ya no está) toman los de su categoría.
  const category = isHabitCategory(doc.category) ? doc.category : DEFAULT_HABIT_CATEGORY;
  const color = isHabitColor(doc.color) ? doc.color : categoryOf(category).color;
  return {
    value: {
      name,
      description,
      tier,
      category,
      icon: habitIconOf(doc.icon) ?? DEFAULT_HABIT_ICON,
      color,
      schedule,
      target,
      reminder: readReminder(doc.reminder, schedule),
    },
    order: order(doc.sortOrder),
  };
}

const REWARD_TIERS: readonly unknown[] = ['small', 'medium', 'large'] satisfies RewardTier[];
const TASK_SIZES: readonly unknown[] = ['small', 'medium', 'large'] satisfies TaskSize[];

function parseReward(doc: UnknownRecord): Parsed<RestoredReward> {
  if (doc.status === 'archived') return 'skip';
  if (doc.status !== 'active') return 'unreadable';
  const name = text(doc.name, REWARD_NAME_MIN_LENGTH, REWARD_NAME_MAX_LENGTH);
  const description = optionalText(doc.description, REWARD_DESCRIPTION_MAX_LENGTH);
  if (
    name === null ||
    description === undefined ||
    !REWARD_TIERS.includes(doc.tier) ||
    !isInteger(doc.cost, 1, REWARD_COST_MAX)
  )
    return 'unreadable';
  return {
    value: { name, description, tier: doc.tier as RewardTier, cost: doc.cost },
    order: order(doc.sortOrder),
  };
}

function parseTask(doc: UnknownRecord): Parsed<RestoredTask> {
  if (typeof doc.completedDateKey === 'string' && isValidDateKey(doc.completedDateKey))
    return 'skip';
  if (doc.completedDateKey !== null && doc.completedDateKey !== undefined) return 'unreadable';
  const title = text(doc.title, TASK_TITLE_MIN_LENGTH, TASK_TITLE_MAX_LENGTH);
  const { dueDateKey } = doc;
  if (
    title === null ||
    !TASK_SIZES.includes(doc.size) ||
    typeof dueDateKey !== 'string' ||
    !isValidDateKey(dueDateKey)
  )
    return 'unreadable';
  return { value: { title, size: doc.size as TaskSize, dueDateKey }, order: 0 };
}

function idList(value: unknown, maxSize: number): string[] | null {
  if (!Array.isArray(value) || !value.every((id) => typeof id === 'string')) return null;
  const ids = [...new Set(value as string[])];
  return ids.length <= maxSize ? ids : null;
}

function parseGoal(doc: UnknownRecord): Parsed<RestoredGoal> {
  if (doc.status === 'achieved' || doc.status === 'archived') return 'skip';
  if (doc.status !== 'active') return 'unreadable';
  const title = text(doc.title, GOAL_TITLE_MIN_LENGTH, GOAL_TITLE_MAX_LENGTH);
  const description = optionalText(doc.description, GOAL_DESCRIPTION_MAX_LENGTH);
  const habitIds = idList(doc.habitIds, MAX_GOAL_HABITS);
  const taskIds = idList(doc.taskIds, MAX_GOAL_TASKS);
  const { targetDateKey } = doc;
  const isDeadline =
    targetDateKey === null || (typeof targetDateKey === 'string' && isValidDateKey(targetDateKey));
  if (
    title === null ||
    description === undefined ||
    habitIds === null ||
    taskIds === null ||
    !isDeadline
  )
    return 'unreadable';
  return {
    value: { title, description, targetDateKey, habitIds, taskIds },
    order: order(doc.sortOrder),
  };
}

function parseReflection(doc: UnknownRecord): Parsed<RestoredReflection> {
  const { weekStartDateKey } = doc;
  const answers = [doc.wentWell, doc.wasHard, doc.nextFocus].map((answer) =>
    text(answer, 0, REFLECTION_ANSWER_MAX_LENGTH),
  );
  const [wentWell, wasHard, nextFocus] = answers;
  if (
    typeof weekStartDateKey !== 'string' ||
    !isValidDateKey(weekStartDateKey) ||
    isoWeekday(weekStartDateKey) !== 1 ||
    wentWell == null ||
    wasHard == null ||
    nextFocus == null ||
    !isReflectionAnswered({ wentWell, wasHard, nextFocus })
  )
    return 'unreadable';
  return { value: { weekStartDateKey, wentWell, wasHard, nextFocus }, order: 0 };
}

/** Una colección del respaldo: la lista, vacía si el archivo es de antes de que existiera. */
function collection(value: unknown, isRequired: boolean): unknown[] | null {
  if (value === undefined && !isRequired) return [];
  return Array.isArray(value) ? value : null;
}

interface Section<T> {
  items: SourceItem<T>[];
  unreadable: number;
}

function readSection<T>(
  docs: unknown[],
  parse: (doc: UnknownRecord) => Parsed<T>,
  compare: (a: { value: T; order: number }, b: { value: T; order: number }) => number,
): Section<T> {
  let unreadable = 0;
  const parsed: { sourceId: string; value: T; order: number }[] = [];
  for (const doc of docs) {
    if (!isRecord(doc) || typeof doc.id !== 'string') {
      unreadable += 1;
      continue;
    }
    const sourceId = doc.id;
    const result = parse(doc);
    if (result === 'unreadable') unreadable += 1;
    else if (result !== 'skip') parsed.push({ sourceId, ...result });
  }
  parsed.sort(compare);
  return { items: parsed.map(({ sourceId, value }) => ({ sourceId, value })), unreadable };
}

const bySortOrder = (a: { order: number }, b: { order: number }) => a.order - b.order;

/** Lee el texto de un archivo de respaldo y deja solo lo que se puede restaurar. */
export function readBackup(fileText: string): BackupReadResult {
  let raw: unknown;
  try {
    raw = JSON.parse(fileText);
  } catch {
    return { ok: false, error: 'not_json' };
  }
  if (!isRecord(raw) || raw.format !== EXPORT_FORMAT || !Number.isInteger(raw.formatVersion))
    return { ok: false, error: 'not_backup' };
  if ((raw.formatVersion as number) > EXPORT_FORMAT_VERSION)
    return { ok: false, error: 'newer_version' };

  const habits = collection(raw.habits, true);
  const rewards = collection(raw.rewards, true);
  const tasks = collection(raw.tasks, false);
  const goals = collection(raw.goals, false);
  const reflections = collection(raw.weeklyReflections, false);
  if (!habits || !rewards || !tasks || !goals || !reflections)
    return { ok: false, error: 'not_backup' };

  const sections = {
    habits: readSection(habits, parseHabit, bySortOrder),
    rewards: readSection(rewards, parseReward, bySortOrder),
    tasks: readSection(
      tasks,
      parseTask,
      (a, b) =>
        a.value.dueDateKey.localeCompare(b.value.dueDateKey) ||
        a.value.title.localeCompare(b.value.title),
    ),
    goals: readSection(goals, parseGoal, bySortOrder),
    reflections: readSection(reflections, parseReflection, (a, b) =>
      a.value.weekStartDateKey.localeCompare(b.value.weekStartDateKey),
    ),
  };
  return {
    ok: true,
    contents: {
      exportedAt: typeof raw.exportedAt === 'string' ? raw.exportedAt : null,
      habits: sections.habits.items,
      rewards: sections.rewards.items,
      tasks: sections.tasks.items,
      goals: sections.goals.items,
      reflections: sections.reflections.items,
      unreadable: Object.values(sections).reduce((sum, section) => sum + section.unreadable, 0),
    },
  };
}

export type RestoreSection = 'habits' | 'rewards' | 'tasks' | 'goals' | 'reflections';

/** Clave de un elemento en la vista previa (para marcarlo o desmarcarlo). */
export function restoreKey(section: RestoreSection, sourceId: string): string {
  return `${section}:${sourceId}`;
}

/** Lo que ya hay en la cuenta, para no duplicar. */
export interface RestoreCurrent {
  habits: readonly HabitRecord[];
  rewards: readonly RewardRecord[];
  tasks: readonly Task[];
  goals: readonly Goal[];
  reflectionWeeks: readonly DateKey[];
}

/** Lo que cambia al restaurar un elemento para que las reglas lo acepten. */
export type RestoreNote = 'made_secondary' | 'moved_to_today' | 'deadline_cleared';

export interface PlannedRestoreItem<T> {
  key: string;
  sourceId: string;
  value: T;
  /** El que ya está en la cuenta con el mismo nombre: no se restaura. */
  existingId: string | null;
  isSelected: boolean;
  notes: RestoreNote[];
}

/** Vínculo de una meta: a algo que se restaura ahora o a algo que ya estaba en la cuenta. */
export type GoalLink = { kind: 'restored'; sourceId: string } | { kind: 'existing'; id: string };

export interface PlannedGoal {
  title: string;
  description: string | null;
  targetDateKey: DateKey | null;
  habits: GoalLink[];
  tasks: GoalLink[];
}

export interface RestorePlan {
  habits: PlannedRestoreItem<RestoredHabit>[];
  rewards: PlannedRestoreItem<RestoredReward>[];
  tasks: PlannedRestoreItem<RestoredTask>[];
  goals: PlannedRestoreItem<PlannedGoal>[];
  reflections: PlannedRestoreItem<RestoredReflection>[];
  selectedCount: number;
}

export interface RestorePlanInput {
  contents: BackupContents;
  current: RestoreCurrent;
  today: DateKey;
  /** Claves (`restoreKey`) que el usuario desmarcó. */
  deselected?: ReadonlySet<string>;
}

const normalize = (name: string) => name.trim().toLocaleLowerCase('es');

function byName<T>(items: readonly T[], nameOf: (item: T) => string): Map<string, T> {
  return new Map(items.map((item) => [normalize(nameOf(item)), item]));
}

/**
 * Qué se va a crear: lo repetido se salta, los principales de más pasan a secundarios, las tareas
 * vencidas vencen hoy, las fechas límite pasadas se quitan y las metas se vinculan con lo nuevo o
 * con lo que ya estaba.
 */
export function planRestore({
  contents,
  current,
  today,
  deselected = new Set(),
}: RestorePlanInput): RestorePlan {
  function plan<T>(
    section: RestoreSection,
    items: readonly SourceItem<T>[],
    existingIdOf: (value: T) => string | null,
  ): PlannedRestoreItem<T>[] {
    return items.map(({ sourceId, value }) => {
      const key = restoreKey(section, sourceId);
      const existingId = existingIdOf(value);
      return {
        key,
        sourceId,
        value,
        existingId,
        isSelected: existingId === null && !deselected.has(key),
        notes: [],
      };
    });
  }

  const activeHabits = current.habits.filter((habit) => habit.status === 'active');
  const habitsByName = byName(activeHabits, (habit) => habit.name);
  const rewardsByName = byName(
    current.rewards.filter((reward) => reward.status === 'active'),
    (reward) => reward.name,
  );
  const tasksByTitle = byName(
    current.tasks.filter((task) => task.completedDateKey === null),
    (task) => task.title,
  );
  const goalsByTitle = byName(
    current.goals.filter((goal) => goal.status === 'active'),
    (goal) => goal.title,
  );
  const reflectionWeeks = new Set(current.reflectionWeeks);

  let primaryRoom =
    MAX_PRIMARY_HABITS - activeHabits.filter((habit) => habit.tier === 'primary').length;
  const habits = plan('habits', contents.habits, (habit) => {
    return habitsByName.get(normalize(habit.name))?.id ?? null;
  }).map((item) => {
    if (!item.isSelected || item.value.tier !== 'primary') return item;
    if (primaryRoom > 0) {
      primaryRoom -= 1;
      return item;
    }
    return {
      ...item,
      value: { ...item.value, tier: 'secondary' as const },
      notes: ['made_secondary' as const],
    };
  });

  const rewards = plan(
    'rewards',
    contents.rewards,
    (reward) => rewardsByName.get(normalize(reward.name))?.id ?? null,
  );

  const tasks = plan(
    'tasks',
    contents.tasks,
    (task) => tasksByTitle.get(normalize(task.title))?.id ?? null,
  ).map((item) =>
    item.value.dueDateKey < today
      ? {
          ...item,
          value: { ...item.value, dueDateKey: today },
          notes: ['moved_to_today' as const],
        }
      : item,
  );

  function linksTo<T>(ids: readonly string[], items: readonly PlannedRestoreItem<T>[]): GoalLink[] {
    const bySourceId = new Map(items.map((item) => [item.sourceId, item]));
    return ids.flatMap((sourceId): GoalLink[] => {
      const item = bySourceId.get(sourceId);
      if (item?.existingId) return [{ kind: 'existing', id: item.existingId }];
      if (item?.isSelected) return [{ kind: 'restored', sourceId }];
      return [];
    });
  }

  const goals = plan(
    'goals',
    contents.goals,
    (goal) => goalsByTitle.get(normalize(goal.title))?.id ?? null,
  ).map((item): PlannedRestoreItem<PlannedGoal> => {
    const { habitIds, taskIds, ...goal } = item.value;
    const isLate = goal.targetDateKey !== null && goal.targetDateKey < today;
    return {
      ...item,
      value: {
        ...goal,
        targetDateKey: isLate ? null : goal.targetDateKey,
        habits: linksTo(habitIds, habits),
        tasks: linksTo(taskIds, tasks),
      },
      notes: isLate ? ['deadline_cleared'] : [],
    };
  });

  const reflections = plan(
    'reflections',
    contents.reflections.filter(({ value }) => canWriteReflection(value.weekStartDateKey, today)),
    (reflection) =>
      reflectionWeeks.has(reflection.weekStartDateKey) ? reflection.weekStartDateKey : null,
  );

  const selectedCount = [habits, rewards, tasks, goals, reflections]
    .flat()
    .filter((item) => item.isSelected).length;
  return { habits, rewards, tasks, goals, reflections, selectedCount };
}
