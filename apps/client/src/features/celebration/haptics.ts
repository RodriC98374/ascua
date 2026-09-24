// Vibraciones cortas que acompañan a las animaciones. En Android usan el vibrador; en web, la
// Vibration API si el navegador la tiene (en la PC no hacen nada). Nunca bloquean ni fallan.
import * as Haptics from 'expo-haptics';

/** Marcar un hábito. */
export function tapFeedback() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

/** Desmarcar o cambiar de opción. */
export function selectionFeedback() {
  Haptics.selectionAsync().catch(() => {});
}

/** Racha asegurada, día perfecto, recompensa canjeada. */
export function celebrationFeedback() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}
