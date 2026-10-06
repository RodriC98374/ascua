// Una línea por escala del check-in (1 a 5), dibujada a mano con SVG: la librería de gráficas no
// deja huecos en una misma línea ni superpone tres con toque propio. Une los días contestados
// seguidos con una curva suave (`smoothPath`); los puntos marcan lo que de verdad se contestó.
import { CHECK_IN_DIMENSIONS, CHECK_IN_MAX, CHECK_IN_MIN } from '@ascua/shared';
import { Pressable, Text, View } from 'react-native';
import Svg, { Circle, G, Line, Path } from 'react-native-svg';

import { useCheckInColors } from '@/features/check-in/check-in-colors';
import { useThemeColors } from '@/theme/colors';

import type { CheckInSlot } from './chart-data';
import { useChartStyle, useLayoutWidth } from './chart-parts';
import { smoothPath } from './smooth-path';

const HEIGHT = 120;
const Y_AXIS_WIDTH = 20;
const EDGE = 10;
const TOP = 8;
const BOTTOM = 8;
const LABEL_WIDTH = 32;

interface CheckInChartProps {
  slots: readonly CheckInSlot[];
  /** -1 si no hay ninguno elegido. */
  selectedIndex: number;
  onSelect: (index: number) => void;
  /** Texto de accesibilidad de cada punto del eje. */
  describeSlot: (index: number) => string;
}

export function CheckInChart({ slots, selectedIndex, onSelect, describeSlot }: CheckInChartProps) {
  const colors = useThemeColors();
  const scaleColors = useCheckInColors();
  const { axisTextStyle } = useChartStyle();
  const [width, onLayout] = useLayoutWidth();
  const plotWidth = Math.max(0, width - Y_AXIS_WIDTH);
  const spacing = slots.length > 1 ? (plotWidth - 2 * EDGE) / (slots.length - 1) : 0;
  const xOf = (index: number) => Y_AXIS_WIDTH + EDGE + spacing * index;
  const yOf = (value: number) =>
    TOP + ((CHECK_IN_MAX - value) / (CHECK_IN_MAX - CHECK_IN_MIN)) * (HEIGHT - TOP - BOTTOM);
  const levels = Array.from(
    { length: CHECK_IN_MAX - CHECK_IN_MIN + 1 },
    (_, index) => CHECK_IN_MIN + index,
  );

  return (
    <View onLayout={onLayout}>
      {width > 0 && (
        <>
          <View style={{ height: HEIGHT }}>
            <Svg width={width} height={HEIGHT} style={{ position: 'absolute' }}>
              {levels.map((level) => (
                <Line
                  key={level}
                  x1={Y_AXIS_WIDTH}
                  x2={width}
                  y1={yOf(level)}
                  y2={yOf(level)}
                  stroke={colors.border}
                  strokeWidth={1}
                />
              ))}
              {selectedIndex >= 0 && (
                <Line
                  x1={xOf(selectedIndex)}
                  x2={xOf(selectedIndex)}
                  y1={TOP}
                  y2={HEIGHT - BOTTOM}
                  stroke={colors.inkFaint}
                  strokeWidth={2}
                  strokeOpacity={0.5}
                />
              )}
              {CHECK_IN_DIMENSIONS.map((dimension) => {
                const points = slots.flatMap((slot, index) => {
                  const value = slot.values[dimension];
                  return value === undefined ? [] : [{ x: xOf(index), y: yOf(value), index }];
                });
                const path = smoothPath(points);
                return (
                  <G key={dimension}>
                    {points.length > 1 && (
                      <Path
                        d={path}
                        fill="none"
                        stroke={scaleColors[dimension]}
                        strokeWidth={2.5}
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    )}
                    {points.map((point) => (
                      <Circle
                        key={point.index}
                        cx={point.x}
                        cy={point.y}
                        r={point.index === selectedIndex ? 4.5 : 3}
                        fill={scaleColors[dimension]}
                      />
                    ))}
                  </G>
                );
              })}
            </Svg>
            {levels.map((level) => (
              <Text
                key={level}
                style={[
                  axisTextStyle,
                  { position: 'absolute', left: 0, width: Y_AXIS_WIDTH - 6, textAlign: 'right' },
                  { top: yOf(level) - 7 },
                ]}
              >
                {level}
              </Text>
            ))}
            {slots.map((slot, index) => (
              <Pressable
                key={slot.key}
                accessibilityRole="button"
                accessibilityState={{ selected: index === selectedIndex }}
                accessibilityLabel={describeSlot(index)}
                onPress={() => onSelect(index)}
                style={{
                  position: 'absolute',
                  top: 0,
                  height: HEIGHT,
                  left: xOf(index) - Math.max(spacing, 12) / 2,
                  width: Math.max(spacing, 12),
                }}
              />
            ))}
          </View>
          <View style={{ height: 18 }}>
            {slots.map((slot, index) =>
              slot.label ? (
                <Text
                  key={slot.key}
                  numberOfLines={1}
                  style={[
                    axisTextStyle,
                    {
                      position: 'absolute',
                      left: xOf(index) - LABEL_WIDTH / 2,
                      width: LABEL_WIDTH,
                      textAlign: 'center',
                    },
                  ]}
                >
                  {slot.label}
                </Text>
              ) : null,
            )}
          </View>
        </>
      )}
    </View>
  );
}
