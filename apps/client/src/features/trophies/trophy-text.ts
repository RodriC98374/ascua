import type { TrophyShelf } from '@ascua/shared';

/** "2 por usar · 5 en total", "Todos utilizados · 3 en total" o "1 por usar". */
export function trophyCountText({ trophies, unusedCount }: TrophyShelf): string {
  const total = trophies.length;
  const unused = unusedCount === 0 ? 'Todos utilizados' : `${unusedCount} por usar`;
  if (unusedCount === total) return unused;
  return `${unused} · ${total} en total`;
}
