// Navegación principal del diseño: barra inferior en el celular y columna izquierda desde 768 px.
// Cuatro destinos (decisión D16): Hoy, Mes, Recompensas y Ajustes.
import { TabList, TabTrigger, type TabTriggerSlotProps } from 'expo-router/ui';
import type { ComponentType } from 'react';
import { Pressable, Text, View } from 'react-native';

import { CalendarIcon, GiftIcon, HomeIcon, SettingsIcon } from '@/components/ui/icons';
import { useThemeColors } from '@/theme/colors';

type IconComponent = ComponentType<{ size?: number; color: string }>;

const NAV_ITEMS = [
  { name: 'hoy', href: '/', label: 'Hoy', Icon: HomeIcon },
  { name: 'mes', href: '/mes', label: 'Mes', Icon: CalendarIcon },
  { name: 'recompensas', href: '/recompensas', label: 'Recompensas', Icon: GiftIcon },
  { name: 'ajustes', href: '/ajustes', label: 'Ajustes', Icon: SettingsIcon },
] as const satisfies readonly { name: string; href: string; label: string; Icon: IconComponent }[];

interface NavButtonProps extends TabTriggerSlotProps {
  label: string;
  Icon: IconComponent;
  isWide: boolean;
}

function NavButton({
  label,
  Icon,
  isWide,
  isFocused,
  style: _triggerStyle,
  ...props
}: NavButtonProps) {
  const colors = useThemeColors();
  const color = isFocused ? colors.emberStrong : colors.inkFaint;
  return (
    <Pressable
      {...props}
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      // Se descarta el estilo inline de TabTrigger (fila con space-between), que les gana a las clases.
      className={`min-h-12 items-center rounded-md ${isWide ? 'gap-3 px-3 py-2' : 'min-w-16 flex-1 justify-center gap-0.5'} ${isFocused && isWide ? 'bg-warning-soft' : ''}`}
      style={{
        flexDirection: isWide ? 'row' : 'column',
        justifyContent: isWide ? 'flex-start' : 'center',
      }}
    >
      <Icon size={20} color={color} />
      <Text
        className={`${isFocused ? 'font-body-extrabold' : 'font-body-semibold'} text-caption`}
        style={{ color }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Función y no componente: `Tabs` descubre las rutas leyendo sus hijos, así que la TabList y sus
 * TabTrigger tienen que quedar en el árbol del layout, no dentro de otro componente.
 * `asChild` con un `View` propio: la `View` interna de TabList no pasa por NativeWind (ignora
 * `className`). Además TabList le pasa al hijo su estilo por defecto (`flexDirection: 'row'`,
 * `justifyContent: 'space-between'`) como estilo inline, que le gana a las clases: por eso la
 * dirección y la alineación van en `style`.
 */
export function renderNavBar({ isWide, bottomInset }: { isWide: boolean; bottomInset: number }) {
  return (
    <TabList asChild>
      <View
        className={
          isWide
            ? 'border-border bg-surface-200 w-56 gap-1 border-r px-3 py-6'
            : 'border-border bg-surface-200 border-t pt-2'
        }
        style={
          isWide
            ? { flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'stretch' }
            : {
                flexDirection: 'row',
                justifyContent: 'space-around',
                paddingBottom: bottomInset + 8,
              }
        }
      >
        {isWide && (
          <Text className="font-heading-extrabold text-heading-lg text-ember-strong mb-4 px-3">
            Ascua
          </Text>
        )}
        {NAV_ITEMS.map(({ name, href, label, Icon }) => (
          <TabTrigger key={name} name={name} href={href} asChild>
            <NavButton label={label} Icon={Icon} isWide={isWide} />
          </TabTrigger>
        ))}
      </View>
    </TabList>
  );
}
