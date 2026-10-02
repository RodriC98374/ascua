// Categorías y colores de los hábitos. Es lo que da variedad de color a la app: el resto de la
// interfaz es neutra y la brasa queda solo como color de marca.

/** Orden en que se muestran en el formulario y en los resúmenes. */
export const HABIT_CATEGORY_IDS = ['health', 'physical', 'mental', 'academic', 'other'] as const;

export type HabitCategory = (typeof HABIT_CATEGORY_IDS)[number];

/** La reciben los hábitos guardados antes de que existieran las categorías. */
export const DEFAULT_HABIT_CATEGORY: HabitCategory = 'other';

/**
 * Colores que puede tener un hábito, en pastel. Se usan como **relleno de superficies grandes**:
 * casilla, barra, porción del donut, área de una gráfica. Sobre blanco tienen muy poco contraste,
 * así que todo trazo fino (el punto de la grilla, la línea de una gráfica, el check) usa en su
 * lugar el tono de `strongHabitColor`. Sin rojo, que en toda la app significa "día perdido".
 */
export const HABIT_COLORS = [
  '#EFA98A',
  '#E3CB8E',
  '#9FCBAC',
  '#96C7C0',
  '#A3C4D9',
  '#AEBBE2',
  '#C4B2DE',
  '#E5AEC2',
  // Desde la fase 21: lima, canela, pizarra y orquídea.
  '#C6D88F',
  '#D6B79C',
  '#B7C0CE',
  '#DDAEDC',
  // Y doce más: amarillo, pistacho, jade, cian, índigo, violeta, fucsia, salmón, cobalto, oliva,
  // topo y salvia. El formulario muestra ocho y el resto se abre con "Más colores".
  '#EBD97A',
  '#A6E09C',
  '#7CD8B2',
  '#8ED3DE',
  '#A7A2F0',
  '#C79CF2',
  '#F296D0',
  '#F2B3A6',
  '#92B4F0',
  '#C8C79A',
  '#C9BBB0',
  '#B4C8B0',
] as const;

export type HabitColor = (typeof HABIT_COLORS)[number];

/** Las tareas no eligen color: todas llevan este, cálido y distinto del de la brasa. */
export const TASK_COLOR: HabitColor = '#E3CB8E';

/** Versión oscura de cada pastel, para trazos finos y texto. Contraste ≥ 3:1 sobre blanco. */
const STRONG_BY_COLOR: Record<HabitColor, string> = {
  '#C6D88F': '#66822A',
  '#D6B79C': '#9A6A3C',
  '#B7C0CE': '#5C6B80',
  '#DDAEDC': '#9A589A',
  '#EFA98A': '#C2603A',
  '#E3CB8E': '#A8873E',
  '#9FCBAC': '#4F8A5B',
  '#96C7C0': '#3E8079',
  '#A3C4D9': '#4A8AA3',
  '#AEBBE2': '#5B7BB5',
  '#C4B2DE': '#7E6BA8',
  '#E5AEC2': '#B06A87',
  '#EBD97A': '#8F7B14',
  '#A6E09C': '#3F8A32',
  '#7CD8B2': '#2E8560',
  '#8ED3DE': '#2A8291',
  '#A7A2F0': '#5550B8',
  '#C79CF2': '#8A48B0',
  '#F296D0': '#B0448A',
  '#F2B3A6': '#BC5540',
  '#92B4F0': '#2F62BF',
  '#C8C79A': '#76752E',
  '#C9BBB0': '#7A6657',
  '#B4C8B0': '#56754F',
};

/**
 * Orden en que se proponen los colores a los hábitos nuevos: cada uno bien distinto del anterior,
 * para que dos hábitos seguidos no se confundan en las gráficas.
 */
export const HABIT_COLOR_ROTATION: readonly HabitColor[] = [
  '#A3C4D9',
  '#9FCBAC',
  '#EFA98A',
  '#C4B2DE',
  '#E3CB8E',
  '#96C7C0',
  '#E5AEC2',
  '#AEBBE2',
  '#C6D88F',
  '#DDAEDC',
  '#D6B79C',
  '#8ED3DE',
  '#F2B3A6',
  '#A7A2F0',
  '#EBD97A',
  '#7CD8B2',
  '#F296D0',
  '#92B4F0',
  '#A6E09C',
  '#C79CF2',
  '#C8C79A',
  '#B7C0CE',
  '#C9BBB0',
  '#B4C8B0',
];

/**
 * La paleta ordenada por tono, para la hoja de "Más colores": da la vuelta a la rueda de color
 * (del salmón al rosa) y deja los tres apagados (topo, salvia y pizarra) al final.
 */
export const HABIT_COLORS_BY_HUE: readonly HabitColor[] = [
  '#F2B3A6',
  '#EFA98A',
  '#D6B79C',
  '#E3CB8E',
  '#EBD97A',
  '#C8C79A',
  '#C6D88F',
  '#A6E09C',
  '#9FCBAC',
  '#7CD8B2',
  '#96C7C0',
  '#8ED3DE',
  '#A3C4D9',
  '#92B4F0',
  '#AEBBE2',
  '#A7A2F0',
  '#C4B2DE',
  '#C79CF2',
  '#DDAEDC',
  '#F296D0',
  '#E5AEC2',
  '#C9BBB0',
  '#B4C8B0',
  '#B7C0CE',
];

/** Cuántos colores muestra el formulario antes de "Más colores". */
export const VISIBLE_HABIT_COLORS = 8;

/**
 * Color que se propone a un hábito nuevo: el primero de la rotación que ningún hábito activo usa.
 * Si ya se usan todos, el menos repetido. El usuario puede cambiarlo.
 */
export function nextHabitColor(
  habits: readonly { color: unknown; status: 'active' | 'archived' }[],
): HabitColor {
  const uses = new Map<HabitColor, number>(HABIT_COLOR_ROTATION.map((color) => [color, 0]));
  for (const habit of habits) {
    if (habit.status === 'active' && isHabitColor(habit.color)) {
      uses.set(habit.color, (uses.get(habit.color) as number) + 1);
    }
  }
  const fewest = Math.min(...uses.values());
  return HABIT_COLOR_ROTATION.find((color) => uses.get(color) === fewest) as HabitColor;
}

/**
 * Los colores que el formulario muestra sin abrir "Más colores": los primeros de la paleta y, si
 * el elegido es de los otros, también ese (en el último lugar).
 */
export function visibleHabitColors(selected: HabitColor): HabitColor[] {
  const visible = HABIT_COLORS.slice(0, VISIBLE_HABIT_COLORS);
  return visible.includes(selected) ? visible : [...visible.slice(0, -1), selected];
}

/** El tono oscuro del color de un hábito. Acepta cualquier cosa: si no la conoce, devuelve gris. */
export function strongHabitColor(color: unknown): string {
  return isHabitColor(color) ? STRONG_BY_COLOR[color] : '#57534E';
}

export interface HabitCategoryInfo {
  id: HabitCategory;
  label: string;
  /**
   * Color de la categoría: el radar del año y el respaldo de un hábito guardado con un color fuera
   * de la paleta. Desde la fase 21 ya no es el color que se propone al
   * hábito nuevo (eso lo hace `nextHabitColor`).
   */
  color: HabitColor;
}

export const HABIT_CATEGORIES: readonly HabitCategoryInfo[] = [
  { id: 'health', label: 'Salud', color: '#9FCBAC' },
  { id: 'physical', label: 'Físico', color: '#EFA98A' },
  { id: 'mental', label: 'Mental', color: '#C4B2DE' },
  { id: 'academic', label: 'Académico', color: '#A3C4D9' },
  { id: 'other', label: 'Otro', color: '#96C7C0' },
];

export function isHabitCategory(value: unknown): value is HabitCategory {
  return HABIT_CATEGORY_IDS.includes(value as HabitCategory);
}

export function isHabitColor(value: unknown): value is HabitColor {
  return HABIT_COLORS.includes(value as HabitColor);
}

/** La categoría de un hábito, o "Otro" si se guardó antes de que existieran o trae algo raro. */
export function categoryOf(value: unknown): HabitCategoryInfo {
  const id = isHabitCategory(value) ? value : DEFAULT_HABIT_CATEGORY;
  return HABIT_CATEGORIES.find((category) => category.id === id) as HabitCategoryInfo;
}
