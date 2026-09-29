import {
  formatLongDate,
  formatMonthAbbrev,
  heatLevel,
  heatmapWeeks,
  type DateKey,
  type DayStats,
} from '@ascua/shared';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { useThemeColors, type ThemeColors } from '@/theme/colors';

import { describeDay } from './statistics-text';

const CELL = 12;
const GAP = 3;
const STEP = CELL + GAP;
const LABEL_HEIGHT = 16;
/** Opacidad del verde por nivel (1 a 4); el 0 va en rojo suave y sin datos, en gris. */
const LEVEL_OPACITY = [0, 0.3, 0.5, 0.75, 1] as const;
/** Etiquetas de las filas, como en GitHub: solo lunes, miércoles y viernes. */
const ROW_LABELS = ['L', '', 'X', '', 'V', '', ''];

function cellStyle(
  day: DayStats,
  colors: ThemeColors,
): { backgroundColor: string; opacity: number } {
  if (day.status === 'perfect') return { backgroundColor: colors.ember, opacity: 1 };
  if (day.status === 'frozen') return { backgroundColor: colors.protegido, opacity: 1 };
  const level = day.status === 'future' ? null : heatLevel(day.completionRate);
  if (level === null) return { backgroundColor: colors.surface300, opacity: 1 };
  if (level === 0) return { backgroundColor: colors.errorSoft, opacity: 1 };
  return { backgroundColor: colors.success, opacity: LEVEL_OPACITY[level] };
}

/** Columna en la que empieza cada mes: la semana de su día 1. */
function monthLabels(weeks: readonly (DayStats | null)[][]): { index: number; label: string }[] {
  return weeks.flatMap((week, index) => {
    const first = week.find((day) => day?.dateKey.endsWith('-01'));
    return first ? [{ index, label: formatMonthAbbrev(first.dateKey.slice(0, 7)) }] : [];
  });
}

/**
 * El año día por día, como el mapa de GitHub: una columna por semana (lunes arriba) y el color
 * según el % de hábitos cumplidos. En el celular se desplaza de lado y abre en la semana de hoy.
 */
export function YearHeatmap({ days }: { days: readonly DayStats[] }) {
  const colors = useThemeColors();
  const scrollRef = useRef<ScrollView>(null);
  const [selectedDateKey, setSelectedDateKey] = useState<DateKey | null>(null);
  const weeks = heatmapWeeks(days);
  const todayWeek = weeks.findIndex((week) => week.some((day) => day?.isToday));
  const selectedDay = days.find((day) => day.dateKey === selectedDateKey);

  function scrollToToday(viewportWidth: number) {
    if (todayWeek < 0) return;
    // La semana de hoy, con dos semanas de aire a la derecha si las hay.
    const x = (todayWeek + 3) * STEP - viewportWidth;
    if (x > 0) scrollRef.current?.scrollTo({ x, animated: false });
  }

  return (
    <Card className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Tu año, día por día</Text>
        <Text className="font-body text-caption text-ink-muted">
          Más intenso, más hábitos cumplidos. Toca un día para ver su detalle.
        </Text>
      </View>

      <View className="flex-row" style={{ gap: GAP * 2 }}>
        <View style={{ paddingTop: LABEL_HEIGHT, gap: GAP }}>
          {ROW_LABELS.map((label, index) => (
            <Text
              key={index}
              className="font-body-semibold text-ink-muted"
              style={{ height: CELL, fontSize: 9, lineHeight: CELL }}
            >
              {label}
            </Text>
          ))}
        </View>
        <ScrollView
          ref={scrollRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          onLayout={(event) => scrollToToday(event.nativeEvent.layout.width)}
          className="flex-1"
        >
          <View>
            <View style={{ height: LABEL_HEIGHT, width: weeks.length * STEP }}>
              {monthLabels(weeks).map(({ index, label }) => (
                <Text
                  key={label}
                  className="font-body-semibold text-ink-muted absolute"
                  style={{ left: index * STEP, fontSize: 10 }}
                >
                  {label}
                </Text>
              ))}
            </View>
            <View className="flex-row" style={{ gap: GAP }}>
              {weeks.map((week, weekIndex) => (
                <View key={weekIndex} style={{ gap: GAP }}>
                  {week.map((day, dayIndex) =>
                    day ? (
                      <Pressable
                        key={day.dateKey}
                        accessibilityRole="button"
                        accessibilityLabel={`${formatLongDate(day.dateKey)}: ${describeDay(day)}`}
                        accessibilityState={{ selected: day.dateKey === selectedDateKey }}
                        onPress={() =>
                          setSelectedDateKey((current) =>
                            current === day.dateKey ? null : day.dateKey,
                          )
                        }
                        hitSlop={2}
                        style={{
                          width: CELL,
                          height: CELL,
                          borderRadius: 3,
                          overflow: 'hidden',
                          borderWidth: day.isToday || day.dateKey === selectedDateKey ? 2 : 0,
                          borderColor:
                            day.dateKey === selectedDateKey ? colors.ink : colors.emberStrong,
                        }}
                      >
                        {/* El color va en una capa propia: su opacidad no apaga el anillo. */}
                        <View style={{ flex: 1, ...cellStyle(day, colors) }} />
                      </Pressable>
                    ) : (
                      <View key={dayIndex} style={{ width: CELL, height: CELL }} />
                    ),
                  )}
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>

      <HeatmapLegend />

      {selectedDay && (
        <View className="bg-surface-300 gap-0.5 rounded-md px-3 py-2">
          <Text className="font-body-bold text-body text-ink">
            {formatLongDate(selectedDay.dateKey)}
          </Text>
          <Text className="font-body text-caption text-ink-muted">{describeDay(selectedDay)}</Text>
        </View>
      )}
    </Card>
  );
}

function LegendCell({
  backgroundColor,
  opacity = 1,
}: {
  backgroundColor: string;
  opacity?: number;
}) {
  return <View style={{ width: CELL, height: CELL, borderRadius: 3, backgroundColor, opacity }} />;
}

function HeatmapLegend() {
  const colors = useThemeColors();
  return (
    <View className="flex-row flex-wrap items-center gap-x-4 gap-y-2">
      <View className="flex-row items-center" style={{ gap: GAP }}>
        <Text className="font-body-semibold text-caption text-ink-muted mr-1">Menos</Text>
        <LegendCell backgroundColor={colors.errorSoft} />
        {LEVEL_OPACITY.slice(1).map((opacity) => (
          <LegendCell key={opacity} backgroundColor={colors.success} opacity={opacity} />
        ))}
        <Text className="font-body-semibold text-caption text-ink-muted ml-1">Más</Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <LegendCell backgroundColor={colors.ember} />
        <Text className="font-body-semibold text-caption text-ink-muted">Perfecto</Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <LegendCell backgroundColor={colors.protegido} />
        <Text className="font-body-semibold text-caption text-ink-muted">Protegido</Text>
      </View>
    </View>
  );
}
