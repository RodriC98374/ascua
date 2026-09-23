// Exportación de los datos del usuario: respaldo JSON completo y CSV para hojas de cálculo.
// Lógica pura: la app lee los documentos, llama a estas funciones y guarda el archivo.
import { APP_TIME_ZONE } from './constants';
import { dateKeyRange, toBoliviaIsoString } from './dates';
import { getScheduledHabits } from './habit-schedule';
import type {
  DailyLog,
  DateKey,
  HabitRecord,
  PointTransaction,
  PointTransactionType,
} from './types';

export const EXPORT_FORMAT = 'ascua-backup';
export const EXPORT_FORMAT_VERSION = 1;

/**
 * Punto y coma: Excel en español (es-BO) usa `;` como separador de listas y abriría un CSV con
 * comas en una sola columna. Google Sheets detecta cualquiera de los dos.
 */
const CSV_SEPARATOR = ';';
/** Marca UTF-8 para que Excel lea bien los acentos. */
const UTF8_BOM = String.fromCharCode(0xfeff);

export type CsvCell = string | number | null;

function csvCell(value: CsvCell): string {
  const text = value === null ? '' : String(value);
  return /[;"\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function toCsv(rows: readonly (readonly CsvCell[])[]): string {
  return UTF8_BOM + rows.map((row) => row.map(csvCell).join(CSV_SEPARATOR) + '\r\n').join('');
}

export interface HabitDaysInput {
  habits: readonly HabitRecord[];
  dailyLogs: readonly DailyLog[];
  today: DateKey;
}

function dayLabel(log: DailyLog | undefined, dateKey: DateKey, today: DateKey): string {
  if (dateKey === today) return 'En curso';
  switch (log?.status) {
    case 'completed':
      return log.summary?.isPerfectDay ? 'Perfecto' : 'Cumplido';
    case 'frozen':
      return 'Protegido';
    case 'missed':
      return 'Perdido';
    case 'inactive':
      return 'Sin hábitos';
    default:
      // Sin registro o todavía abierto: el día terminó pero la app aún no lo cerró.
      return 'Sin cerrar';
  }
}

/**
 * Una fila por día, del primer hábito hasta hoy, y una columna por hábito: 1 cumplido, 0 no
 * cumplido, vacío si ese día no contaba. Los días cerrados usan su resumen; hoy, las marcas.
 */
export function buildHabitDaysCsv({ habits, dailyLogs, today }: HabitDaysInput): string {
  const columns = [...habits].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.startDateKey.localeCompare(b.startDateKey),
  );
  const header = [
    'Fecha',
    'Estado',
    '% cumplido',
    'Puntos',
    'Racha',
    ...columns.map((habit) =>
      habit.status === 'archived' ? `${habit.name} (archivado)` : habit.name,
    ),
  ];
  const firstDay = columns.map((habit) => habit.startDateKey).sort()[0];
  if (!firstDay) return toCsv([header]);

  const logs = new Map(dailyLogs.map((log) => [log.dateKey, log]));
  const rows = dateKeyRange(firstDay, today).map((dateKey) => {
    const log = logs.get(dateKey);
    const summary = log?.summary ?? null;
    const scheduled = new Set(
      summary?.scheduledHabitIds ?? getScheduledHabits(habits, dateKey).map((habit) => habit.id),
    );
    const completed = new Set(
      summary?.completedHabitIds ??
        [...scheduled].filter((habitId) => log?.entries[habitId]?.completed === true),
    );
    const percent = scheduled.size > 0 ? Math.round((completed.size / scheduled.size) * 100) : null;
    return [
      dateKey,
      dayLabel(log, dateKey, today),
      percent,
      summary?.pointsEarned ?? null,
      summary?.streakAfterClose ?? null,
      ...columns.map((habit) => {
        if (!scheduled.has(habit.id)) return null;
        return completed.has(habit.id) ? 1 : 0;
      }),
    ];
  });
  return toCsv([header, ...rows]);
}

/** Movimiento con el instante en que se registró (`createdAt`), si ya lo fijó el servidor. */
export interface TimedPointTransaction extends PointTransaction {
  createdAt: Date | null;
}

const TRANSACTION_LABELS: Record<PointTransactionType, string> = {
  habit_completion: 'Hábito cumplido',
  perfect_day_bonus: 'Bono de día perfecto',
  streak_bonus_7_days: 'Bono de 7 días',
  streak_bonus_30_days: 'Bono de 30 días',
  streak_freeze_purchase: 'Compra de protector',
  reward_redemption: 'Canje de recompensa',
  manual_adjustment: 'Ajuste manual',
};

/** Todos los movimientos, del más antiguo al más reciente. */
export function buildPointTransactionsCsv(transactions: readonly TimedPointTransaction[]): string {
  // Sin `createdAt` (escritura aún sin confirmar), primero dentro de su día.
  const createdMs = (transaction: TimedPointTransaction) => transaction.createdAt?.getTime() ?? 0;
  const ordered = [...transactions].sort(
    (a, b) => a.dateKey.localeCompare(b.dateKey) || createdMs(a) - createdMs(b),
  );
  return toCsv([
    ['Fecha', 'Registrado', 'Tipo', 'Descripción', 'Puntos', 'Saldo'],
    ...ordered.map((transaction) => [
      transaction.dateKey,
      transaction.createdAt ? toBoliviaIsoString(transaction.createdAt) : null,
      TRANSACTION_LABELS[transaction.type],
      transaction.description,
      transaction.amount,
      transaction.balanceAfter,
    ]),
  ]);
}

/** Un documento tal como está en Firestore, con su ID. */
export interface ExportDocument {
  id: string;
  data: Readonly<Record<string, unknown>>;
}

export interface BackupInput {
  userId: string;
  exportedAt: Date;
  profile: ExportDocument | null;
  gamification: ExportDocument | null;
  habits: readonly ExportDocument[];
  dailyLogs: readonly ExportDocument[];
  monthlySummaries: readonly ExportDocument[];
  pointTransactions: readonly ExportDocument[];
  rewards: readonly ExportDocument[];
  rewardRedemptions: readonly ExportDocument[];
}

type BackupRecord = Record<string, unknown>;

export interface Backup {
  format: typeof EXPORT_FORMAT;
  formatVersion: typeof EXPORT_FORMAT_VERSION;
  exportedAt: string;
  timeZone: string;
  userId: string;
  profile: BackupRecord | null;
  gamification: BackupRecord | null;
  habits: BackupRecord[];
  dailyLogs: BackupRecord[];
  monthlySummaries: BackupRecord[];
  pointTransactions: BackupRecord[];
  rewards: BackupRecord[];
  rewardRedemptions: BackupRecord[];
}

/** Un `Timestamp` de Firestore (o cualquier valor con `toDate`), sin importar Firebase. */
function isInstantLike(value: object): value is { toDate: () => Date } {
  return 'toDate' in value && typeof value.toDate === 'function';
}

/** Instantes a ISO con el offset de Bolivia; el resto, tal cual. */
function serialize(value: unknown): unknown {
  if (value instanceof Date) return toBoliviaIsoString(value);
  if (Array.isArray(value)) return value.map(serialize);
  if (typeof value === 'object' && value !== null) {
    if (isInstantLike(value)) return toBoliviaIsoString(value.toDate());
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, serialize(item)]));
  }
  return value;
}

function serializeData(document: ExportDocument): BackupRecord {
  return serialize(document.data) as BackupRecord;
}

function serializeCollection(documents: readonly ExportDocument[]): BackupRecord[] {
  return [...documents]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((document) => ({ id: document.id, ...serializeData(document) }));
}

/** Respaldo completo: todos los documentos del usuario, restaurable a futuro. */
export function buildBackup(input: BackupInput): Backup {
  return {
    format: EXPORT_FORMAT,
    formatVersion: EXPORT_FORMAT_VERSION,
    exportedAt: toBoliviaIsoString(input.exportedAt),
    timeZone: APP_TIME_ZONE,
    userId: input.userId,
    profile: input.profile && serializeData(input.profile),
    gamification: input.gamification && serializeData(input.gamification),
    habits: serializeCollection(input.habits),
    dailyLogs: serializeCollection(input.dailyLogs),
    monthlySummaries: serializeCollection(input.monthlySummaries),
    pointTransactions: serializeCollection(input.pointTransactions),
    rewards: serializeCollection(input.rewards),
    rewardRedemptions: serializeCollection(input.rewardRedemptions),
  };
}

export type ExportKind = 'backup' | 'habit_days' | 'point_transactions';

const FILE_NAMES: Record<ExportKind, [string, string]> = {
  backup: ['ascua-respaldo', 'json'],
  habit_days: ['ascua-habitos-por-dia', 'csv'],
  point_transactions: ['ascua-movimientos-de-puntos', 'csv'],
};

export function exportFileName(kind: ExportKind, today: DateKey): string {
  const [base, extension] = FILE_NAMES[kind];
  return `${base}-${today}.${extension}`;
}
