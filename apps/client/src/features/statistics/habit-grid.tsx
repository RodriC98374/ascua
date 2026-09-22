import {
  formatLongDate,
  formatWeekdayInitial,
  monthWeekIndex,
  strongHabitColor,
  type DateKey,
  type DayStats,
  type HabitDayStatus,
  type HabitPeriodStats,
  type HabitRecord,
} from '@ascua/shared';
import { useRef, type ReactNode } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { DayDot } from './day-dot';
import { DAY_STATUS_LABELS, formatPercent } from './statistics-text';

const LABEL_WIDTH = 112;
/** En el mes la grilla se desplaza de lado; en la semana las 7 columnas llenan el ancho. */
const MONTH_COLUMN_WIDTH = 28;
const BAND_HEIGHT = 20;
const ROW_HEIGHT = 30;
const SUMMARY_HEIGHT = 40;

// Una clase completa por bloque de 7 días (NativeWind solo genera las que aparecen escritas).
// Orden fijo del diseño: morado, azul, turquesa, rosa, verde.
const WEEK_BANDS = [
  'bg-week-morado-soft',
  'bg-week-azul-soft',
  'bg-week-turquesa-soft',
  'bg-week-rosa-soft',
  'bg-week-verde-soft',
] as const;

interface HabitGridProps {
  kind: 'week' | 'month';
  days: readonly DayStats[];
  rows: readonly HabitPeriodStats<HabitRecord>[];
  selectedDateKey: DateKey | null;
  onSelectDay: (dateKey: DateKey) => void;
  selectedHabitId: string | null;
  onSelectHabit: (habitId: string) => void;
}

/**
 * Grilla hábito × día: un check por hábito cumplido y, abajo, el estado y el % de cada día.
 * Tocar un día abre su detalle; tocar un hábito lo resalta y atenúa el resto.
 */
export function HabitGrid(props: HabitGridProps) {
  const { kind, days, rows, selectedHabitId, onSelectHabit } = props;
  const headerHeight = kind === 'week' ? 44 : 28;
  const bandHeight = kind === 'month' ? BAND_HEIGHT : 0;

  const columns = days.map((day) => (
    <DayColumn
      key={day.dateKey}
      day={day}
      grid={props}
      headerHeight={headerHeight}
      width={kind === 'month' ? MONTH_COLUMN_WIDTH : undefined}
    />
  ));

  return (
    <View className="flex-row">
      <View style={{ width: LABEL_WIDTH }}>
        <View style={{ height: bandHeight + headerHeight }} />
        {rows.map((row, index) => {
          const isSelected = row.habit.id === selectedHabitId;
          return (
            <Pressable
              key={row.habit.id}
              accessibilityRole="button"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${row.habit.name}: ${formatPercent(row.completionRate)}`}
              onPress={() => onSelectHabit(row.habit.id)}
              style={{ height: ROW_HEIGHT }}
              className={`flex-row items-center gap-1.5 rounded-l-sm pl-2 pr-2 ${isSelected ? 'bg-warning-soft' : index % 2 === 1 ? 'bg-surface-300' : ''}`}
            >
              <View
                className="h-2.5 w-2.5 shrink-0 rounded-full border"
                style={{
                  backgroundColor: row.habit.color,
                  borderColor: strongHabitColor(row.habit.color),
                }}
              />
              <Text
                numberOfLines={1}
                className={`text-caption flex-1 ${row.habit.tier === 'primary' ? 'font-body-bold text-ink' : 'font-body text-ink-muted'}`}
              >
                {row.habit.name}
              </Text>
            </Pressable>
          );
        })}
        <View
          style={{ height: SUMMARY_HEIGHT }}
          className="border-border justify-center border-t pl-2"
        >
          <Text className="font-body-semibold text-caption text-ink-muted">% del día</Text>
        </View>
      </View>
      {kind === 'month' ? (
        <MonthScroll days={days}>
          <WeekBands days={days} />
          <View className="flex-row">{columns}</View>
        </MonthScroll>
      ) : (
        <View className="flex-1 flex-row">{columns}</View>
      )}
    </View>
  );
}

/** Desplazamiento lateral del mes, que arranca con hoy a la vista. */
function MonthScroll({ days, children }: { days: readonly DayStats[]; children: ReactNode }) {
  const scrollRef = useRef<ScrollView>(null);
  const viewportWidth = useRef(0);
  const todayIndex = days.findIndex((day) => day.isToday);

  function showToday() {
    if (todayIndex < 0 || viewportWidth.current === 0) return;
    // Hoy cerca del borde derecho, con dos días por venir a la vista.
    const x = (todayIndex + 3) * MONTH_COLUMN_WIDTH - viewportWidth.current;
    scrollRef.current?.scrollTo({ x: Math.max(0, x), animated: false });
  }

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      className="flex-1"
      onLayout={(event) => {
        viewportWidth.current = event.nativeEvent.layout.width;
        showToday();
      }}
      onContentSizeChange={showToday}
    >
      <View>{children}</View>
    </ScrollView>
  );
}

/** Franja de color por bloque de 7 días del mes (S1 a S5). */
function WeekBands({ days }: { days: readonly DayStats[] }) {
  const blocks: { index: number; count: number }[] = [];
  for (const day of days) {
    const index = monthWeekIndex(day.dateKey);
    const last = blocks[blocks.length - 1];
    if (last?.index === index) last.count += 1;
    else blocks.push({ index, count: 1 });
  }
  return (
    <View className="flex-row" style={{ height: BAND_HEIGHT }}>
      {blocks.map((block) => (
        <View
          key={block.index}
          style={{ width: block.count * MONTH_COLUMN_WIDTH }}
          className={`items-center justify-center rounded-t-sm ${WEEK_BANDS[block.index % WEEK_BANDS.length]}`}
        >
          <Text className="font-body-extrabold text-label text-ink">S{block.index + 1}</Text>
        </View>
      ))}
    </View>
  );
}

function DayColumn({
  day,
  grid,
  headerHeight,
  width,
}: {
  day: DayStats;
  grid: HabitGridProps;
  headerHeight: number;
  width: number | undefined;
}) {
  const isFuture = day.status === 'future';
  const isSelected = day.dateKey === grid.selectedDateKey;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: isSelected, disabled: isFuture }}
      accessibilityLabel={`${formatLongDate(day.dateKey)}: ${DAY_STATUS_LABELS[day.status]}, ${formatPercent(day.completionRate)}`}
      disabled={isFuture}
      onPress={() => grid.onSelectDay(day.dateKey)}
      style={width === undefined ? { flex: 1 } : { width }}
      className={`rounded-sm ${isSelected ? 'bg-warning-soft' : ''}`}
    >
      <View style={{ height: headerHeight }} className="items-center justify-center gap-0.5">
        {grid.kind === 'week' && (
          <Text className="font-body-bold text-label text-ink-muted">
            {formatWeekdayInitial(day.dateKey)}
          </Text>
        )}
        <View
          className={`min-w-[22px] items-center rounded-sm ${day.isToday ? 'border-ember-strong border-2' : 'border-2 border-transparent'}`}
        >
          <Text className={`font-body-bold text-label ${isFuture ? 'text-ink-faint' : 'text-ink'}`}>
            {Number(day.dateKey.slice(8, 10))}
          </Text>
        </View>
      </View>
      {grid.rows.map((row, index) => (
        <View
          key={row.habit.id}
          style={{ height: ROW_HEIGHT }}
          className={`items-center justify-center ${!isSelected && index % 2 === 1 ? 'bg-surface-300' : ''}`}
        >
          <HabitMark
            status={day.habits[row.habit.id]}
            color={row.habit.color}
            isDimmed={grid.selectedHabitId !== null && grid.selectedHabitId !== row.habit.id}
          />
        </View>
      ))}
      <View
        style={{ height: SUMMARY_HEIGHT }}
        className="border-border items-center justify-center gap-1 border-t"
      >
        {!isFuture && <DayDot status={day.status} isToday={day.isToday} />}
        {day.completionRate !== null && (
          <Text className="font-body-bold text-label text-ink-muted">
            {Math.round(day.completionRate * 100)}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

/**
 * Check si se cumplió; si no, un círculo vacío tenue (la ausencia de check ya es la señal,
 * pero tiene que distinguirse de "no contaba"); nada si el hábito no contaba ese día.
 */
function HabitMark({
  status,
  color,
  isDimmed,
}: {
  status: HabitDayStatus | undefined;
  color: string;
  isDimmed: boolean;
}) {
  if (!status) return null;
  return (
    <View style={{ opacity: isDimmed ? 0.25 : 1 }}>
      {status === 'done' ? (
        // Relleno pastel con aro oscuro: el pastel solo no se distingue del fondo blanco.
        <View
          className="h-3.5 w-3.5 rounded-full border-2"
          style={{ backgroundColor: color, borderColor: strongHabitColor(color) }}
        />
      ) : (
        <View className="border-ink-faint h-2 w-2 rounded-full border-[1.5px] opacity-50" />
      )}
    </View>
  );
}
