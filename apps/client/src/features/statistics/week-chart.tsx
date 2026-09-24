import type { DateKey, DayStats, DayStatsStatus } from '@ascua/shared';
import { Text, View } from 'react-native';
import { BarChart } from 'react-native-gifted-charts';

import { useThemeColors, type ThemeColors } from '@/theme/colors';

import { weekBars } from './chart-data';
import { CHART_HEIGHT, useChartStyle, useLayoutWidth, Y_AXIS_WIDTH } from './chart-parts';

function barColors(colors: ThemeColors): Record<DayStatsStatus, string> {
  return {
    completed: colors.success,
    perfect: colors.ember,
    frozen: colors.protegido,
    missed: colors.error,
    inactive: colors.vacioSoft,
    open: colors.inkFaint,
    no_data: 'transparent',
    future: 'transparent',
  };
}
const SIDE_SPACING = 10;

/**
 * El % de cada día de la semana, con el color de su estado. Hoy lleva el anillo de brasa sin
 * relleno, como en el resto de la app. Tocar una barra abre el detalle del día.
 */
export function WeekChart({
  days,
  selectedDateKey,
  onSelectDay,
}: {
  days: readonly DayStats[];
  selectedDateKey: DateKey | null;
  onSelectDay: (dateKey: DateKey) => void;
}) {
  const colors = useThemeColors();
  const { axisTextStyle, chartStyle } = useChartStyle();
  const colorByStatus = barColors(colors);
  const [width, onLayout] = useLayoutWidth();
  const bars = weekBars(days);
  const plotWidth = Math.max(0, width - Y_AXIS_WIDTH - 8);
  const slot = (plotWidth - 2 * SIDE_SPACING) / bars.length;
  const barWidth = Math.min(28, Math.floor(slot * 0.62));

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <BarChart
          {...chartStyle}
          data={bars.map((bar) => {
            const isSelected = bar.dateKey === selectedDateKey;
            const isOpenToday = bar.isToday && bar.status === 'open';
            return {
              value: bar.value,
              label: bar.label,
              frontColor: isOpenToday ? 'transparent' : colorByStatus[bar.status],
              showGradient: bar.status === 'perfect',
              gradientColor: colors.emberGlow,
              barBorderWidth: isOpenToday ? 2 : 0,
              barBorderColor: colors.emberStrong,
              labelTextStyle: isSelected
                ? { ...axisTextStyle, color: colors.emberStrong, fontFamily: 'Nunito_800ExtraBold' }
                : axisTextStyle,
              topLabelComponent: () =>
                bar.isEmpty ? null : (
                  <Text
                    className={`font-body-bold text-label ${isSelected ? 'text-ember-strong' : 'text-ink-muted'}`}
                  >
                    {bar.value}
                  </Text>
                ),
              disablePress: bar.status === 'future',
              onPress: () => onSelectDay(bar.dateKey),
            };
          })}
          width={plotWidth}
          height={CHART_HEIGHT}
          barWidth={barWidth}
          spacing={slot - barWidth}
          initialSpacing={SIDE_SPACING + (slot - barWidth) / 2}
          endSpacing={SIDE_SPACING}
          barBorderRadius={6}
          maxValue={100}
          noOfSections={4}
          yAxisLabelSuffix="%"
          // Espacio arriba para que la cifra del 100 % no quede cortada.
          overflowTop={18}
        />
      )}
    </View>
  );
}
