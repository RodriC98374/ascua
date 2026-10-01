// Íconos que puede tener un hábito (fase 21, D27). El id es el nombre del ícono en Lucide, que
// usa el mismo trazo que los íconos del diseño; la app lo traduce a su componente. Solo íconos:
// un emoji puede ir en el nombre del hábito, nunca aquí.

/** Lo guardan los hábitos sin ícono elegido, incluidos los creados antes de la fase 21. */
export const DEFAULT_HABIT_ICON = 'check';

export const HABIT_ICON_GROUPS = [
  {
    label: 'Salud',
    icons: [
      'heart',
      'heart-pulse',
      'pill',
      'droplet',
      'glass-water',
      'apple',
      'salad',
      'utensils',
      'moon',
      'bed',
      'sun',
      'sunrise',
      'shower-head',
      'bath',
      'toothbrush',
      'stethoscope',
      'syringe',
      'bandage',
      'cigarette-off',
      'wine-off',
      'beer-off',
      'candy-off',
    ],
  },
  {
    label: 'Cuerpo',
    icons: [
      'dumbbell',
      'bike',
      'footprints',
      'activity',
      'timer',
      'trophy',
      'waves-ladder',
      'mountain',
      'person-standing',
      'volleyball',
      'flame',
      'weight',
      'stretch-horizontal',
    ],
  },
  {
    label: 'Mente',
    icons: [
      'brain',
      'leaf',
      'wind',
      'sparkles',
      'flower-2',
      'notebook-pen',
      'pen-line',
      'music',
      'headphones',
      'eye',
      'phone-off',
      'smartphone',
      'hourglass',
    ],
  },
  {
    label: 'Estudio y trabajo',
    icons: [
      'book-open',
      'graduation-cap',
      'pencil',
      'code',
      'laptop',
      'languages',
      'calculator',
      'library',
      'file-text',
      'lightbulb',
      'briefcase',
      'terminal',
      'microscope',
    ],
  },
  {
    label: 'Casa',
    icons: [
      'house',
      'brush-cleaning',
      'broom',
      'shirt',
      'washing-machine',
      'cooking-pot',
      'shopping-cart',
      'trash',
      'paw-print',
      'sprout',
      'bed-double',
      'sofa',
    ],
  },
  {
    label: 'Ocio y más',
    icons: [
      'gamepad-2',
      'tv',
      'camera',
      'palette',
      'guitar',
      'coffee',
      'wallet',
      'piggy-bank',
      'clock',
      'alarm-clock',
      'calendar-check',
      'target',
      'star',
      'users',
      'message-circle',
      'hand-heart',
      'church',
      'plane',
      'car',
      'scissors',
      'glasses',
      'ban',
      'rocket',
    ],
  },
] as const;

export type HabitIcon = (typeof HABIT_ICON_GROUPS)[number]['icons'][number];

export const HABIT_ICON_IDS: readonly HabitIcon[] = HABIT_ICON_GROUPS.flatMap(
  (group): readonly HabitIcon[] => group.icons,
);

export function isHabitIcon(value: unknown): value is HabitIcon {
  return HABIT_ICON_IDS.includes(value as HabitIcon);
}

/** El ícono elegido de un hábito, o `null` si no tiene (el valor por defecto o algo desconocido). */
export function habitIconOf(value: unknown): HabitIcon | null {
  return isHabitIcon(value) ? value : null;
}
