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
] as const;

export type HabitColor = (typeof HABIT_COLORS)[number];

/** Versión oscura de cada pastel, para trazos finos y texto. Contraste ≥ 4:1 sobre blanco. */
const STRONG_BY_COLOR: Record<HabitColor, string> = {
  '#EFA98A': '#C2603A',
  '#E3CB8E': '#A8873E',
  '#9FCBAC': '#4F8A5B',
  '#96C7C0': '#3E8079',
  '#A3C4D9': '#4A8AA3',
  '#AEBBE2': '#5B7BB5',
  '#C4B2DE': '#7E6BA8',
  '#E5AEC2': '#B06A87',
};

/** El tono oscuro del color de un hábito. Acepta cualquier cosa: si no la conoce, devuelve gris. */
export function strongHabitColor(color: unknown): string {
  return isHabitColor(color) ? STRONG_BY_COLOR[color] : '#57534E';
}

export interface HabitCategoryInfo {
  id: HabitCategory;
  label: string;
  /** Color que propone el formulario al elegir la categoría. El usuario puede cambiarlo. */
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
