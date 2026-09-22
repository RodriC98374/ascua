import {
  buildCategoryStats,
  strongHabitColor,
  type CategoryStats,
  type HabitPeriodStats,
  type HabitRecord,
} from '@ascua/shared';
import { Text, View } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

import { Card } from '@/components/ui/card';
import { colors } from '@/theme/colors';

import { formatPercent } from './statistics-text';

// Más ancho que alto: los nombres de las categorías salen a los lados y no deben cortarse.
const WIDTH = 288;
const HEIGHT = 210;
const CX = WIDTH / 2;
const CY = HEIGHT / 2;
const RADIUS = 72;
/** Dónde va el nombre de cada eje, en múltiplos del radio. */
const LABEL_RATIO = 1.32;
const RINGS = [0.25, 0.5, 0.75, 1];
/** Un polígono necesita al menos tres ejes; con menos se muestran las cifras sin gráfica. */
const MIN_AXES = 3;

/** Punto del eje `index` a una distancia `ratio` (0..1) del centro. El primer eje va arriba. */
function pointAt(index: number, count: number, ratio: number) {
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: CX + Math.cos(angle) * RADIUS * ratio,
    y: CY + Math.sin(angle) * RADIUS * ratio,
  };
}

const toPolygon = (points: { x: number; y: number }[]) =>
  points.map((point) => `${point.x},${point.y}`).join(' ');

/**
 * Cumplimiento por categoría en el año. Cada eje es una categoría con hábitos; el área muestra
 * de un vistazo en qué estás flojo. Se dibuja a mano con SVG porque la librería de gráficas no
 * trae radar, y así funciona igual en Android y en web.
 */
export function CategoryRadar({ rows }: { rows: readonly HabitPeriodStats<HabitRecord>[] }) {
  const stats = buildCategoryStats(rows).filter((entry) => entry.completionRate !== null);

  return (
    <Card className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Por categoría</Text>
        <Text className="font-body text-caption text-ink-muted">
          Cuánto cumpliste en cada área del año. Solo cuenta los días ya cerrados.
        </Text>
      </View>
      {stats.length === 0 ? (
        <Text className="font-body text-body text-ink-muted">
          Aquí verás en qué áreas te va mejor cuando cierres algunos días.
        </Text>
      ) : (
        <>
          {stats.length >= MIN_AXES && <RadarShape stats={stats} />}
          <View className="gap-1">
            {stats.map((entry) => (
              <View key={entry.category.id} className="flex-row items-center gap-2">
                <View
                  className="h-2.5 w-2.5 rounded-full border"
                  style={{
                    backgroundColor: entry.category.color,
                    borderColor: strongHabitColor(entry.category.color),
                  }}
                />
                <Text className="font-body text-caption text-ink flex-1">
                  {entry.category.label}
                </Text>
                <Text className="font-body-bold text-caption text-ink-muted">
                  {formatPercent(entry.completionRate)}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Card>
  );
}

function RadarShape({ stats }: { stats: readonly CategoryStats[] }) {
  const count = stats.length;
  const shape = stats.map((entry, index) => pointAt(index, count, entry.completionRate ?? 0));

  return (
    <View className="items-center">
      {/* viewBox para que se achique solo en pantallas angostas sin cortar los nombres. */}
      <Svg
        width="100%"
        height={HEIGHT}
        viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
        accessibilityRole="image"
      >
        {RINGS.map((ring) => (
          <Polygon
            key={ring}
            points={toPolygon(stats.map((_, index) => pointAt(index, count, ring)))}
            fill="none"
            stroke={colors.border}
            strokeWidth={1}
          />
        ))}
        {stats.map((entry, index) => {
          const edge = pointAt(index, count, 1);
          return (
            <Line
              key={entry.category.id}
              x1={CX}
              y1={CY}
              x2={edge.x}
              y2={edge.y}
              stroke={colors.border}
              strokeWidth={1}
            />
          );
        })}
        {/* Gris, no brasa: el color de la tarjeta lo ponen los vértices de cada categoría. */}
        <Polygon
          points={toPolygon(shape)}
          fill={colors.inkMuted}
          fillOpacity={0.12}
          stroke={colors.inkMuted}
          strokeWidth={2}
        />
        {stats.map((entry, index) => {
          const point = shape[index]!;
          return (
            <Circle
              key={entry.category.id}
              cx={point.x}
              cy={point.y}
              r={5}
              fill={entry.category.color}
              stroke={strongHabitColor(entry.category.color)}
              strokeWidth={2}
            />
          );
        })}
        {stats.map((entry, index) => {
          const label = pointAt(index, count, LABEL_RATIO);
          return (
            <SvgText
              key={entry.category.id}
              x={label.x}
              y={label.y + 4}
              fill={colors.inkMuted}
              fontSize={11}
              fontFamily="Nunito_700Bold"
              textAnchor="middle"
            >
              {entry.category.label}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
