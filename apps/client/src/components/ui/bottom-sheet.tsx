import { useEffect, type ReactNode } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/theme/colors';
import { SPRING_SOFT } from '@/theme/motion';

interface BottomSheetProps {
  isOpen: boolean;
  title: string;
  /** Línea bajo el título. */
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * Hoja que sube desde abajo, al alcance del pulgar: el patrón de los selectores en el celular. El
 * fondo aparece de a poco y la hoja entra deslizándose; tocar fuera o "atrás" la cierra.
 */
export function BottomSheet({ isOpen, title, subtitle, onClose, children }: BottomSheetProps) {
  const colors = useThemeColors();
  const { bottom } = useSafeAreaInsets();
  const enter = useSharedValue(0);

  useEffect(() => {
    if (!isOpen) return;
    enter.set(0);
    enter.set(withSpring(1, SPRING_SOFT));
  }, [isOpen, enter]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(enter.get(), [0, 1], [48, 0]) }],
    opacity: interpolate(enter.get(), [0, 0.3], [0, 1], 'clamp'),
  }));

  return (
    <Modal
      transparent
      visible={isOpen}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View className="flex-1 items-center justify-end">
        <Pressable
          accessibilityLabel="Cerrar"
          onPress={onClose}
          style={{ position: 'absolute', inset: 0, backgroundColor: colors.scrim }}
        />
        <Animated.View style={[{ width: '100%', maxWidth: 480 }, sheetStyle]}>
          <View
            accessibilityViewIsModal
            className="bg-surface-200 gap-5 rounded-t-xl px-5 pt-3"
            style={{
              paddingBottom: bottom + 20,
              shadowColor: colors.shadowNeutral,
              shadowOffset: { width: 0, height: -4 },
              shadowOpacity: 0.12,
              shadowRadius: 16,
              elevation: 12,
            }}
          >
            <View className="bg-border h-1 w-10 self-center rounded-full" />
            <View className="gap-0.5">
              <Text accessibilityRole="header" className="font-heading text-heading-lg text-ink">
                {title}
              </Text>
              {subtitle && <Text className="font-body text-body text-ink-muted">{subtitle}</Text>}
            </View>
            {children}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}
