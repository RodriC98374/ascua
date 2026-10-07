// Las marcas de un día (hoy o ayer, el día de gracia): tocar una casilla, sumar o restar una unidad
// de un hábito con cantidad, o marcar un paso. Las usan Hoy y la pantalla de ayer.
import { toggleHabitStep, type DailyEntries, type DateKey, type HabitRecord } from '@ascua/shared';

import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { setHabitCompletion } from '@/operations/daily-log';

export interface HabitMarksInput {
  uid: string;
  /** El día que se marca. */
  dateKey: DateKey;
  /** Si el documento del día ya existe (lo dice la suscripción); la primera marca lo crea. */
  logExists: boolean;
  /** Las marcas del día, para saber cómo estaba cada hábito. */
  entries: DailyEntries;
  isDone: (habitId: string) => boolean;
}

export interface HabitMarks {
  toggle: (habitId: string) => void;
  /** Un hábito con cantidad: suma o resta una unidad, entre 0 y su meta. */
  setCount: (habitId: string, amount: number, nextCount: number) => void;
  /** Un hábito con pasos: marca o desmarca un paso; el hábito se cumple con el último. */
  toggleStep: (habit: HabitRecord, stepId: string) => void;
}

export function habitMarks({
  uid,
  dateKey,
  logExists,
  entries,
  isDone,
}: HabitMarksInput): HabitMarks {
  return {
    toggle(habitId) {
      trackWrite(
        setHabitCompletion(db, uid, { dateKey, habitId, completed: !isDone(habitId), logExists }),
      );
    },
    setCount(habitId, amount, nextCount) {
      const count = Math.max(0, Math.min(nextCount, amount));
      trackWrite(
        setHabitCompletion(db, uid, {
          dateKey,
          habitId,
          completed: count >= amount,
          count,
          logExists,
        }),
      );
    },
    toggleStep(habit, stepId) {
      const next = toggleHabitStep(habit, entries[habit.id], stepId);
      trackWrite(
        setHabitCompletion(db, uid, {
          dateKey,
          habitId: habit.id,
          completed: next.completed,
          doneSteps: next.doneSteps,
          logExists,
        }),
      );
    },
  };
}
