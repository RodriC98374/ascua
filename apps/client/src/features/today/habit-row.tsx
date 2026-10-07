import {
  doneHabitStepIds,
  habitIconFor,
  habitStepsOf,
  type HabitEntry,
  type HabitRecord,
} from '@ascua/shared';
import type { ReactNode } from 'react';

import { HabitCheck } from './habit-check';
import type { HabitMarks } from './habit-marks';
import { QuantityCheck } from './quantity-check';
import { StepsCheck } from './steps-check';

interface HabitRowProps {
  habit: HabitRecord;
  marks: HabitMarks;
  isDone: boolean;
  /** Lo hecho de un hábito con cantidad. */
  count: number;
  /** La marca del hábito en el día, para los pasos hechos. */
  entry: HabitEntry | undefined;
  /** Acción a la derecha, fuera del área que marca. */
  trailing?: ReactNode;
  /** Línea chica bajo el nombre: el avance de un semanal. */
  caption?: string;
  isToggleDisabled?: boolean;
}

/** La casilla, el contador o los pasos de un hábito, según tenga cantidad, pasos o ninguno. */
export function HabitRow({
  habit,
  marks,
  isDone,
  count,
  entry,
  trailing,
  caption,
  isToggleDisabled = false,
}: HabitRowProps) {
  const isArchived = habit.status === 'archived';
  if (habit.target) {
    const amount = habit.target.amount;
    return (
      <QuantityCheck
        name={habit.name}
        tier={habit.tier}
        color={habit.color}
        icon={habitIconFor(habit)}
        amount={amount}
        unit={habit.target.unit}
        count={count}
        isDone={isDone}
        isArchived={isArchived}
        weeklyCaption={caption}
        onIncrement={() => marks.setCount(habit.id, amount, count + 1)}
        onDecrement={() => marks.setCount(habit.id, amount, count - 1)}
        trailing={trailing}
      />
    );
  }
  const steps = habitStepsOf(habit);
  if (steps.length > 0) {
    return (
      <StepsCheck
        name={habit.name}
        tier={habit.tier}
        color={habit.color}
        icon={habitIconFor(habit)}
        steps={steps}
        doneStepIds={doneHabitStepIds(habit, entry)}
        isArchived={isArchived}
        isToggleDisabled={isToggleDisabled}
        onToggleStep={(stepId) => marks.toggleStep(habit, stepId)}
        trailing={trailing}
        caption={caption}
      />
    );
  }
  return (
    <HabitCheck
      name={habit.name}
      tier={habit.tier}
      color={habit.color}
      icon={habitIconFor(habit)}
      isDone={isDone}
      isArchived={isArchived}
      isToggleDisabled={isToggleDisabled}
      onToggle={() => marks.toggle(habit.id)}
      trailing={trailing}
      caption={caption}
    />
  );
}
