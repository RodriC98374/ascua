/** La palabra que se escribe para confirmar el reinicio: un toque sin querer no borra nada. */
export const RESET_CONFIRMATION_WORD = 'REINICIAR';

/** ¿Lo escrito confirma el reinicio? Sin importar mayúsculas ni espacios de más. */
export function isResetConfirmed(text: string): boolean {
  return text.trim().toUpperCase() === RESET_CONFIRMATION_WORD;
}
