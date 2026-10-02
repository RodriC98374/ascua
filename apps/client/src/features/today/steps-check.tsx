// Fila de un hábito con pasos (fase 21, D27): la casilla del hábito no se toca; se marca sola
// cuando están todos sus pasos, cada uno con su subcasilla. Los puntos llegan con el último paso.
import { HABIT_POINTS, strongHabitColor, type HabitStep, type HabitTier } from '@ascua/shared';
import { useState, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';

import { selectionFeedback, tapFeedback } from '@/features/celebration/haptics';
import { HabitIcon } from '@/features/habits/habit-icon';
import { playSound } from '@/features/sounds/sounds';

import { Checkbox, FloatingPoints } from './check-parts';

interface StepsCheckProps {
  name: string;
  tier: HabitTier;
  color: string;
  /** El ícono con el que se ve el hábito (`habitIconFor`), antes del nombre. */
  icon?: unknown;
  steps: readonly HabitStep[];
  /** Ids de los pasos hechos hoy. */
  doneStepIds: readonly string[];
  isArchived?: boolean;
  /** Mientras se reordena la lista, tocar un paso no marca. */
  isToggleDisabled?: boolean;
  onToggleStep: (stepId: string) => void;
  trailing?: ReactNode;
  /** Línea extra bajo el nombre: el avance de un semanal ("2 de 3 esta semana"). */
  caption?: string;
}

export function StepsCheck({
  name,
  tier,
  color,
  icon,
  steps,
  doneStepIds,
  isArchived = false,
  isToggleDisabled = false,
  onToggleStep,
  trailing,
  caption,
}: StepsCheckProps) {
  // Cada vez que el último paso completa el hábito sube un "+N" desde su casilla.
  const [pointsBurst, setPointsBurst] = useState(0);
  const isPrimary = tier === 'primary';
  const doneCount = steps.filter((step) => doneStepIds.includes(step.id)).length;
  const isDone = doneCount === steps.length;
  const progress = `${doneCount} de ${steps.length} pasos`;

  function toggleStep(stepId: string) {
    const isMarking = !doneStepIds.includes(stepId);
    if (isMarking && doneCount + 1 === steps.length) {
      // El paso que completa el hábito suena y vibra como marcar una casilla.
      tapFeedback();
      playSound('tick');
      setPointsBurst((count) => count + 1);
    } else {
      selectionFeedback();
    }
    onToggleStep(stepId);
  }

  return (
    <View className="bg-surface-200 py-2">
      <View
        accessibilityLabel={`${name}, ${isPrimary ? 'principal' : 'secundario'}, ${progress}`}
        className="min-h-11 flex-row items-center gap-1"
      >
        <View className="flex-1 flex-row items-center gap-3">
          <View>
            <Checkbox isDone={isDone} size={28} color={color} />
            <FloatingPoints burst={pointsBurst} amount={HABIT_POINTS[tier]} />
          </View>
          <HabitIcon icon={icon} size={18} color={strongHabitColor(color)} />
          <View className="flex-1">
            <Text
              className={`${isPrimary ? 'font-heading text-heading-sm' : 'font-body-semibold text-body'} ${isDone ? 'text-ink-muted' : 'text-ink'}`}
            >
              {name}
            </Text>
            <Text className="font-body-semibold text-caption text-ink-muted">
              {caption ? `${progress} · ${caption}` : progress}
            </Text>
          </View>
          {isArchived && (
            <View className="bg-surface-300 rounded-full px-2 py-[3px]">
              <Text className="font-body-bold text-caption text-ink-muted">Último día</Text>
            </View>
          )}
        </View>
        {trailing ?? <View className="w-11" />}
      </View>

      {/* Subcasillas, alineadas con el nombre del hábito. */}
      <View className="pl-10">
        {steps.map((step) => {
          const isStepDone = doneStepIds.includes(step.id);
          return (
            <Pressable
              key={step.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isStepDone, disabled: isToggleDisabled }}
              accessibilityLabel={step.title}
              disabled={isToggleDisabled}
              onPress={() => toggleStep(step.id)}
              className={`min-h-11 flex-row items-center gap-3 ${isToggleDisabled ? '' : 'active:opacity-85'}`}
            >
              <Checkbox isDone={isStepDone} size={22} color={color} />
              <Text
                className={`font-body-semibold text-body flex-1 ${isStepDone ? 'text-ink-muted' : 'text-ink'}`}
              >
                {step.title}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
