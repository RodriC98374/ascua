// Piezas comunes de las gráficas (react-native-gifted-charts): medida del ancho, estilo de los
// ejes con los tokens del diseño y la línea con toque. El toque lo maneja una capa propia de
// columnas `Pressable` sobre la gráfica: funciona igual en Android y en web, sin depender de los
// eventos de los elementos SVG de la librería.
import { useState } from 'react';
import {
  Platform,
  Pressable,
  Text,
  View,
  type LayoutChangeEvent,
  type TextStyle,
} from 'react-native';
import { LineChart } from 'react-native-gifted-charts';

import { useThemeColors, type ThemeColors } from '@/theme/colors';

/** Ancho disponible para la gráfica: se mide al montar y al cambiar el tamaño de la pantalla. */
export function useLayoutWidth(): [number, (event: LayoutChangeEvent) => void] {
  const [width, setWidth] = useState(0);
  return [width, (event) => setWidth(Math.floor(event.nativeEvent.layout.width))];
}

/** Ancho reservado a las etiquetas del eje vertical. */
export const Y_AXIS_WIDTH = 36;
export const CHART_HEIGHT = 140;
/** Espacio sobre la gráfica para el globo del punto elegido. */
const TOOLTIP_HEIGHT = 28;
const TOOLTIP_WIDTH = 112;
const EDGE_SPACING = 12;

function buildChartStyle(colors: ThemeColors) {
  const axisTextStyle: TextStyle = {
    color: colors.inkMuted,
    fontSize: 11,
    fontFamily: 'Nunito_600SemiBold',
  };
  return {
    axisTextStyle,
    /** Props de estilo compartidas por las gráficas de línea y de barras. */
    chartStyle: {
      yAxisLabelWidth: Y_AXIS_WIDTH,
      yAxisTextStyle: axisTextStyle,
      xAxisLabelTextStyle: axisTextStyle,
      yAxisThickness: 0,
      xAxisThickness: 1,
      xAxisColor: colors.border,
      rulesColor: colors.border,
      rulesType: 'solid',
      disableScroll: true,
      // En web la animación de gifted-charts usa un Rect SVG animado que rompe (decisión E8).
      isAnimated: Platform.OS !== 'web',
    } as const,
  };
}

/** Estilo de los ejes con los colores del tema que se ve. */
export function useChartStyle() {
  return buildChartStyle(useThemeColors());
}

const AXIS_LABEL_WIDTH = 36;

/** Etiqueta del eje horizontal centrada bajo su punto, más ancha que el espacio entre puntos. */
function AxisLabel({ text, spacing }: { text: string; spacing: number }) {
  const { axisTextStyle } = useChartStyle();
  return (
    <View style={{ width: AXIS_LABEL_WIDTH, marginLeft: (spacing - AXIS_LABEL_WIDTH) / 2 }}>
      <Text numberOfLines={1} style={[axisTextStyle, { textAlign: 'center' }]}>
        {text}
      </Text>
    </View>
  );
}

export interface LinePoint {
  value: number;
  /** Etiqueta del eje horizontal; puede ir vacía. */
  label: string;
}

interface TouchLineChartProps {
  points: readonly LinePoint[];
  maxValue: number;
  noOfSections: number;
  yAxisLabelSuffix?: string;
  /** -1 si no hay ninguno elegido. */
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Texto del globo y de accesibilidad de cada punto. */
  describePoint: (index: number) => string;
  /** Trazo de la línea; por defecto la brasa. Al filtrar por hábito, su color. */
  color?: string;
  /** Relleno del área bajo la línea; por defecto el mismo trazo. */
  areaColor?: string;
}

/** Línea con área en degradado; tocar cerca de un punto lo elige y muestra su cifra. */
export function TouchLineChart({
  points,
  maxValue,
  noOfSections,
  yAxisLabelSuffix,
  selectedIndex,
  onSelect,
  describePoint,
  color: lineColor,
  areaColor,
}: TouchLineChartProps) {
  const colors = useThemeColors();
  const { chartStyle } = useChartStyle();
  const color = lineColor ?? colors.ember;
  const [width, onLayout] = useLayoutWidth();
  const plotWidth = Math.max(0, width - Y_AXIS_WIDTH - 8);
  const spacing =
    points.length > 1 ? (plotWidth - 2 * EDGE_SPACING) / (points.length - 1) : plotWidth / 2;
  const xOf = (index: number) => Y_AXIS_WIDTH + EDGE_SPACING + spacing * index;
  const tooltipLeft =
    selectedIndex >= 0
      ? Math.min(Math.max(0, xOf(selectedIndex) - TOOLTIP_WIDTH / 2), width - TOOLTIP_WIDTH)
      : 0;

  return (
    <View onLayout={onLayout} style={{ paddingTop: TOOLTIP_HEIGHT }}>
      {width > 0 && (
        <>
          <LineChart
            {...chartStyle}
            data={points.map((point) => ({
              value: point.value,
              // La librería recorta la etiqueta al ancho entre puntos ("1…"): va una propia.
              labelComponent: point.label
                ? () => <AxisLabel text={point.label} spacing={spacing} />
                : undefined,
            }))}
            width={plotWidth}
            height={CHART_HEIGHT}
            spacing={spacing}
            initialSpacing={EDGE_SPACING}
            endSpacing={EDGE_SPACING}
            maxValue={maxValue}
            noOfSections={noOfSections}
            yAxisLabelSuffix={yAxisLabelSuffix}
            color={color}
            thickness={3}
            areaChart
            startFillColor={areaColor ?? color}
            endFillColor={areaColor ?? color}
            startOpacity={0.45}
            endOpacity={0.06}
            dataPointsColor={color}
            dataPointsRadius={2.5}
            focusedDataPointIndex={selectedIndex}
            focusedDataPointColor={color}
            focusedDataPointRadius={5}
          />
          {selectedIndex >= 0 && (
            <>
              <View
                pointerEvents="none"
                className="absolute"
                style={{
                  left: xOf(selectedIndex) - 1,
                  top: TOOLTIP_HEIGHT,
                  width: 2,
                  height: CHART_HEIGHT,
                  opacity: 0.35,
                  backgroundColor: color,
                }}
              />
              <View
                pointerEvents="none"
                className="absolute"
                style={{ left: tooltipLeft, top: 0, width: TOOLTIP_WIDTH }}
              >
                <View className="bg-ink items-center self-center rounded-sm px-2 py-1">
                  <Text numberOfLines={1} className="font-body-bold text-caption text-surface-200">
                    {describePoint(selectedIndex)}
                  </Text>
                </View>
              </View>
            </>
          )}
          {points.map((point, index) => (
            <Pressable
              key={index}
              accessibilityRole="button"
              accessibilityState={{ selected: index === selectedIndex }}
              accessibilityLabel={describePoint(index)}
              onPress={() => onSelect(index)}
              className="absolute"
              style={{
                left: xOf(index) - Math.max(spacing, 12) / 2,
                top: TOOLTIP_HEIGHT,
                width: Math.max(spacing, 12),
                height: CHART_HEIGHT,
              }}
            />
          ))}
        </>
      )}
    </View>
  );
}
