// Cómo se ve una opción elegida frente a una libre (chips, tarjetas de opción, círculos de días):
// el mismo lenguaje en toda la app, relleno brasa suave con borde brasa. Antes cada control lo
// resolvía a su manera (borde negro, gris, naranja) y costaba ver qué estaba elegido.

/** Fondo y borde; sumar la forma (`rounded-full`, `border-2`…) en cada control. */
export function choiceContainer(isSelected: boolean): string {
  return isSelected
    ? 'border-ember-strong bg-warning-soft'
    : 'border-border bg-surface-200 active:opacity-85';
}

/** Color del texto de la opción. */
export function choiceLabel(isSelected: boolean): string {
  return isSelected ? 'text-ember-strong' : 'text-ink-muted';
}
