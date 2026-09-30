// Textos y opciones de la alcancía (fase 18).

/** Montos rápidos para apartar. */
const QUICK_AMOUNTS = [10, 25, 50, 100];

/** Los montos rápidos que caben y, al final, lo máximo posible si no es uno de ellos. */
export function depositOptions(max: number): number[] {
  const quick = QUICK_AMOUNTS.filter((amount) => amount < max);
  return max > 0 ? [...quick, max] : [];
}

/** Mensaje para un apartado que falló. Por `reason`/`code` y no por clase: sirve con cualquier SDK. */
export function savingsErrorMessage(error: unknown): string {
  const { code, reason, maxDeposit } = (error ?? {}) as {
    code?: unknown;
    reason?: unknown;
    maxDeposit?: number;
  };
  if (code === 'unavailable') {
    return 'Necesitas conexión a internet para apartar puntos. Vuelve a intentarlo cuando tengas señal.';
  }
  if (reason === 'over_limit') {
    return maxDeposit
      ? `Ahora puedes apartar hasta ${maxDeposit} pts.`
      : 'No te quedan puntos libres para apartar.';
  }
  if (reason === 'reward_archived') return 'Esta recompensa ya no está disponible.';
  if (reason === 'other_reward') return 'Ya tienes una alcancía para otra recompensa.';
  return 'No se pudo apartar. Tus puntos no cambiaron; vuelve a intentarlo.';
}
