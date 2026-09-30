// Reflexión semanal (fase 18, D25): tres preguntas sobre la semana, de lunes a domingo. Se puede
// escribir desde el domingo de esa semana, cuando sea; Hoy la invita el domingo y el lunes.
import { addDays, isoWeekday, isValidDateKey, startOfWeek } from './dates';
import type { DateKey, WeeklyReflection } from './types';

/** Domingo de la semana que empieza en `weekStartDateKey`. */
export function reflectionWeekEnd(weekStartDateKey: DateKey): DateKey {
  return addDays(weekStartDateKey, 6);
}

/** La semana empieza un lunes y su domingo ya llegó. Las mismas condiciones que las reglas. */
export function canWriteReflection(weekStartDateKey: DateKey, today: DateKey): boolean {
  return (
    isValidDateKey(weekStartDateKey) &&
    isoWeekday(weekStartDateKey) === 1 &&
    reflectionWeekEnd(weekStartDateKey) <= today
  );
}

/**
 * La semana que Hoy invita a reflexionar: el domingo, la que termina; el lunes, la que acaba de
 * terminar. El resto de los días, ninguna (se puede escribir igual desde Mes).
 */
export function invitedReflectionWeek(today: DateKey): DateKey | null {
  const weekday = isoWeekday(today);
  if (weekday === 7) return startOfWeek(today);
  if (weekday === 1) return addDays(today, -7);
  return null;
}

/** Al menos una respuesta con texto: una reflexión vacía no se guarda. */
export function isReflectionAnswered(
  answers: Pick<WeeklyReflection, 'wentWell' | 'wasHard' | 'nextFocus'>,
): boolean {
  return [answers.wentWell, answers.wasHard, answers.nextFocus].some(
    (answer) => answer.trim().length > 0,
  );
}
