// Íconos propios del sistema de diseño (24×24, trazo 2 px o relleno, un solo color).
// Los de Check a Gift y Snowflake son los del diseño aprobado; el resto sigue el mismo estilo.
import Svg, { Circle, G, Line, Path, Rect } from 'react-native-svg';

interface IconProps {
  size?: number;
  color: string;
}

const stroke = (color: string) => ({
  fill: 'none',
  stroke: color,
  strokeWidth: 2,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
});

export function CheckIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M5 12.5l4.5 4.5L19 7" {...stroke(color)} strokeWidth={2.5} />
    </Svg>
  );
}

export function EmberIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2.4c.5 2.3-1 3.6-2.1 5-1.2 1.5-1.9 2.9-1.9 4.9a4 4 0 008 0c0-1-.3-1.9-.8-2.6.2.8 0 1.7-.9 2-.9.3-1.5-.5-1.2-1.3.7-1.7 1.9-2.2 1.9-4.3 0-1.6-1.2-3-3-3.7z"
        fill={color}
      />
    </Svg>
  );
}

export function StarIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 3l1.9 5.6L19.4 10.4l-5.5 1.9L12 18l-1.9-5.7-5.5-1.9 5.5-1.8z" fill={color} />
    </Svg>
  );
}

/** Día protegido: el frío contrasta con la brasa ("se apagó un momento, pero sigue ahí"). */
export function SnowflakeIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G {...stroke(color)}>
        <Line x1={12} y1={3} x2={12} y2={21} />
        <Line x1={5.5} y1={7} x2={18.5} y2={17} />
        <Line x1={18.5} y1={7} x2={5.5} y2={17} />
      </G>
    </Svg>
  );
}

export function ShieldIcon({ size = 16, color, filled = false }: IconProps & { filled?: boolean }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 3l7 3v5c0 4.6-3 7.6-7 9-4-1.4-7-4.4-7-9V6l7-3z"
        {...stroke(color)}
        fill={filled ? color : 'none'}
      />
    </Svg>
  );
}

export function HomeIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 11.2L12 4l8 7.2M6.3 10v9.5h4.7V15h2v4.5h4.7V10" {...stroke(color)} />
    </Svg>
  );
}

export function CalendarIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G {...stroke(color)}>
        <Rect x={4} y={5.5} width={16} height={14} rx={2} />
        <Line x1={4} y1={9.5} x2={20} y2={9.5} />
        <Line x1={8.3} y1={3} x2={8.3} y2={7} />
        <Line x1={15.7} y1={3} x2={15.7} y2={7} />
      </G>
    </Svg>
  );
}

export function GiftIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G {...stroke(color)}>
        <Rect x={4} y={9} width={16} height={11} rx={1.5} />
        <Line x1={12} y1={9} x2={12} y2={20} />
        <Path d="M4 9h16v3H4z" />
        <Path d="M12 9c-1.6 0-3-1-3-2.5S10 4 11 4c1.2 0 1.5 1.4 1 2M12 9c1.6 0 3-1 3-2.5S13 4 12 4c-1.2 0-1.5 1.4-1 2" />
      </G>
    </Svg>
  );
}

export function SettingsIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G {...stroke(color)}>
        <Circle cx={12} cy={12} r={3} />
        <Path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8" />
      </G>
    </Svg>
  );
}

export function PlusIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5v14M5 12h14" {...stroke(color)} />
    </Svg>
  );
}

export function ArrowIcon({
  size = 20,
  color,
  direction,
}: IconProps & { direction: 'up' | 'down' | 'left' | 'right' }) {
  const paths = {
    up: 'M12 19V5M6 11l6-6 6 6',
    down: 'M12 5v14M6 13l6 6 6-6',
    left: 'M19 12H5M11 6l-6 6 6 6',
    right: 'M5 12h14M13 6l6 6-6 6',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={paths[direction]} {...stroke(color)} />
    </Svg>
  );
}

export function ChevronIcon({
  size = 20,
  color,
  direction,
}: IconProps & { direction: 'left' | 'right' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={direction === 'left' ? 'M15 5l-7 7 7 7' : 'M9 5l7 7-7 7'} {...stroke(color)} />
    </Svg>
  );
}

export function CloseIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" {...stroke(color)} />
    </Svg>
  );
}

export function MoreVerticalIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={5} r={1.8} fill={color} />
      <Circle cx={12} cy={12} r={1.8} fill={color} />
      <Circle cx={12} cy={19} r={1.8} fill={color} />
    </Svg>
  );
}

export function EditIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 20h4L19 9a2.8 2.8 0 00-4-4L4 16v4zM13.5 6.5l4 4" {...stroke(color)} />
    </Svg>
  );
}

export function ArchiveIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G {...stroke(color)}>
        <Rect x={3.5} y={4.5} width={17} height={4.5} rx={1} />
        <Path d="M5 9v9.5a1.5 1.5 0 001.5 1.5h11a1.5 1.5 0 001.5-1.5V9M10 13h4" />
      </G>
    </Svg>
  );
}

export function TrashIcon({ size = 20, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M4.5 7h15M9.5 7V5a1 1 0 011-1h3a1 1 0 011 1v2M6.5 7l.8 11.6A1.5 1.5 0 008.8 20h6.4a1.5 1.5 0 001.5-1.4L17.5 7M10 11v5M14 11v5"
        {...stroke(color)}
      />
    </Svg>
  );
}

export function CloudIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 18h10a4 4 0 00.5-8A6 6 0 006 9.5 4.3 4.3 0 007 18z" {...stroke(color)} />
    </Svg>
  );
}

export function ClockIcon({ size = 16, color }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <G {...stroke(color)}>
        <Circle cx={12} cy={12} r={8.5} />
        <Path d="M12 7.5V12l3 2" />
      </G>
    </Svg>
  );
}
