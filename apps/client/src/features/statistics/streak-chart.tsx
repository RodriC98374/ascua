import { formatShortDate, type DateKey, type DayStats } from '@ascua/shared';
import { Text } from 'react-native';

import { Card } from '@/components/ui/card';

import { axisMax, streakPoints } from './chart-data';
import { TouchLineChart } from './chart-parts';
import { plural } from './statistics-text';

const SECTIONS = 4;

/** La racha al cerrar cada día del periodo (`summary.streakAfterClose`). */
export function StreakChart({
  days,
  selectedDateKey,
  onSelectDay,
}: {
  days: readonly DayStats[];
  selectedDateKey: DateKey | null;
  onSelectDay: (dateKey: DateKey) => void;
}) {
  const points = streakPoints(days);
  const selectedIndex = points.findIndex((point) => point.dateKey === selectedDateKey);

  function describePoint(index: number) {
    const point = points[index];
    return point ? `${formatShortDate(point.dateKey)}: ${plural(point.value, 'día', 'días')}` : '';
  }

  return (
    <Card className="gap-1">
      <Text className="font-heading text-heading-md text-ink">Tu racha</Text>
      {points.length < 2 ? (
        <Text className="font-body text-body text-ink-muted">
          La gráfica aparece cuando haya al menos dos días cerrados.
        </Text>
      ) : (
        <>
          <Text className="font-body text-caption text-ink-muted">
            Cómo quedó al cerrar cada día. Toca la gráfica para ver uno.
          </Text>
          <TouchLineChart
            points={points}
            maxValue={axisMax(
              points.map((point) => point.value),
              SECTIONS,
            )}
            noOfSections={SECTIONS}
            selectedIndex={selectedIndex}
            onSelect={(index) => {
              const point = points[index];
              if (point) onSelectDay(point.dateKey);
            }}
            describePoint={describePoint}
          />
        </>
      )}
    </Card>
  );
}
