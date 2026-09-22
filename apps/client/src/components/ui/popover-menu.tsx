import { useRef, useState, type ComponentType } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';

import { MoreVerticalIcon } from '@/components/ui/icons';
import { colors } from '@/theme/colors';

export interface MenuItem {
  label: string;
  Icon: ComponentType<{ size?: number; color: string }>;
  onPress: () => void;
  isDestructive?: boolean;
}

const MENU_WIDTH = 184;
const ITEM_HEIGHT = 48;
const EDGE_GAP = 8;

interface Anchor {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** Botón de tres puntos que abre un menú junto a él. Tocar fuera lo cierra. */
export function PopoverMenu({ label, items }: { label: string; items: MenuItem[] }) {
  const triggerRef = useRef<View>(null);
  const [anchor, setAnchor] = useState<Anchor | null>(null);
  const window = useWindowDimensions();

  function open() {
    triggerRef.current?.measureInWindow((x, y, width, height) =>
      setAnchor({ x, y, width, height }),
    );
  }

  function close() {
    setAnchor(null);
  }

  function select(item: MenuItem) {
    close();
    item.onPress();
  }

  const menuHeight = items.length * ITEM_HEIGHT + 8;
  const position = anchor && {
    // Alineado al borde derecho del botón; arriba si no cabe abajo.
    left: Math.max(
      EDGE_GAP,
      Math.min(anchor.x + anchor.width - MENU_WIDTH, window.width - MENU_WIDTH - EDGE_GAP),
    ),
    top:
      anchor.y + anchor.height + menuHeight + EDGE_GAP > window.height
        ? Math.max(EDGE_GAP, anchor.y - menuHeight - 4)
        : anchor.y + anchor.height + 4,
  };

  return (
    <>
      <Pressable
        ref={triggerRef}
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ expanded: anchor !== null }}
        onPress={open}
        className="h-11 w-11 items-center justify-center rounded-md active:opacity-85"
      >
        <MoreVerticalIcon size={20} color={colors.inkMuted} />
      </Pressable>
      <Modal
        transparent
        visible={anchor !== null}
        animationType="fade"
        statusBarTranslucent
        navigationBarTranslucent
        onRequestClose={close}
      >
        <Pressable
          accessibilityLabel="Cerrar menú"
          onPress={close}
          style={{ position: 'absolute', inset: 0 }}
        />
        {position && (
          <View
            accessibilityRole="menu"
            className="bg-surface-200 border-border rounded-md border py-1"
            style={{
              position: 'absolute',
              width: MENU_WIDTH,
              ...position,
              shadowColor: colors.ember,
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.18,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            {items.map((item) => {
              const color = item.isDestructive ? colors.error : colors.ink;
              return (
                <Pressable
                  key={item.label}
                  accessibilityRole="menuitem"
                  onPress={() => select(item)}
                  className="hover:bg-surface-300 active:bg-surface-300 flex-row items-center gap-3 px-4"
                  style={{ height: ITEM_HEIGHT }}
                >
                  <item.Icon size={18} color={color} />
                  <Text className="font-body-bold text-body" style={{ color }}>
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}
      </Modal>
    </>
  );
}
