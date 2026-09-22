/**
 * ID de un intento de gasto: se genera al abrir la confirmación y se reutiliza si hay reintento,
 * así el mismo intento nunca cobra dos veces. Solo tiene que ser único para este usuario.
 */
export function newRequestId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
