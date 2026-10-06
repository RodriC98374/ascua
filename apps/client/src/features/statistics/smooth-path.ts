// Curva suave por unos puntos para las gráficas dibujadas a mano con SVG (la de las líneas de la
// librería se configura con `curved`). Es una cúbica monótona (Fritsch–Carlson): pasa por cada punto
// y nunca se sale del rango entre dos vecinos, así que una escala de 1 a 5 no dibuja una panza por
// debajo del 1 ni por encima del 5, que es lo que hace un suavizado común.

export interface CurvePoint {
  x: number;
  y: number;
}

/** Los números del trazado con dos decimales: basta para la pantalla y mantiene el texto corto. */
const round = (value: number) => Math.round(value * 100) / 100;

/** Pendiente en cada punto; 0 donde la serie cambia de sentido, para no pasarse del punto. */
function tangents(points: readonly CurvePoint[]): number[] {
  const count = points.length;
  const slopes: number[] = [];
  for (let index = 0; index < count - 1; index++) {
    const from = points[index]!;
    const to = points[index + 1]!;
    slopes.push((to.y - from.y) / (to.x - from.x));
  }
  const result = [slopes[0]!];
  for (let index = 1; index < count - 1; index++) {
    const before = slopes[index - 1]!;
    const after = slopes[index]!;
    result.push(before * after <= 0 ? 0 : (before + after) / 2);
  }
  result.push(slopes[count - 2]!);

  // Limita cada tramo para que la curva no se salga entre sus dos puntos.
  for (let index = 0; index < count - 1; index++) {
    const slope = slopes[index]!;
    if (slope === 0) {
      result[index] = 0;
      result[index + 1] = 0;
      continue;
    }
    const a = result[index]! / slope;
    const b = result[index + 1]! / slope;
    const size = Math.hypot(a, b);
    if (size > 3) {
      result[index] = (3 * a * slope) / size;
      result[index + 1] = (3 * b * slope) / size;
    }
  }
  return result;
}

/**
 * El atributo `d` de un `<Path>` que une los puntos (con `x` creciente) con una curva suave.
 * Con un solo punto no hay trazo; con dos, una recta.
 */
export function smoothPath(points: readonly CurvePoint[]): string {
  if (points.length === 0) return '';
  const first = points[0]!;
  const start = `M ${round(first.x)} ${round(first.y)}`;
  if (points.length === 1) return start;
  if (points.length === 2) {
    const last = points[1]!;
    return `${start} L ${round(last.x)} ${round(last.y)}`;
  }

  const slopes = tangents(points);
  const segments: string[] = [];
  for (let index = 0; index < points.length - 1; index++) {
    const from = points[index]!;
    const to = points[index + 1]!;
    const reach = (to.x - from.x) / 3;
    const control1 = { x: from.x + reach, y: from.y + slopes[index]! * reach };
    const control2 = { x: to.x - reach, y: to.y - slopes[index + 1]! * reach };
    segments.push(
      `C ${round(control1.x)} ${round(control1.y)} ${round(control2.x)} ${round(control2.y)} ${round(to.x)} ${round(to.y)}`,
    );
  }
  return `${start} ${segments.join(' ')}`;
}

/**
 * Los valores de una serie con puntos a igual distancia, más `steps - 1` intermedios entre cada par
 * sobre la misma curva (Hermite con las pendientes de arriba). Sirve para una gráfica que solo
 * dibuja rectas entre puntos, como la de la librería: con suficientes puntos la línea se ve curva.
 * Los originales quedan en las posiciones 0, `steps`, `2 * steps`…
 */
export function smoothValues(values: readonly number[], steps: number): number[] {
  if (values.length < 3 || steps < 2) return [...values];
  const slopes = tangents(values.map((value, index) => ({ x: index, y: value })));
  const result: number[] = [];
  for (let index = 0; index < values.length - 1; index++) {
    const from = values[index]!;
    const to = values[index + 1]!;
    for (let step = 0; step < steps; step++) {
      const t = step / steps;
      const t2 = t * t;
      const t3 = t2 * t;
      result.push(
        (2 * t3 - 3 * t2 + 1) * from +
          (t3 - 2 * t2 + t) * slopes[index]! +
          (-2 * t3 + 3 * t2) * to +
          (t3 - t2) * slopes[index + 1]!,
      );
    }
  }
  result.push(values[values.length - 1]!);
  return result;
}
