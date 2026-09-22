import type { ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const toneClasses = {
  neutral: { bar: 'bg-surface-300', action: 'text-ember-strong' },
  error: { bar: 'bg-error-soft', action: 'text-error' },
};

interface NoticeBarProps {
  tone?: keyof typeof toneClasses;
  /** Ícono o indicador a la izquierda. */
  leading?: ReactNode;
  children: ReactNode;
  action?: { label: string; onPress: () => void };
  isAlert?: boolean;
}

/**
 * Franja de aviso en lo alto del contenido (cierre de días, escrituras rechazadas). Respeta el
 * borde superior del celular porque va por encima de la pantalla.
 */
export function NoticeBar({
  tone = 'neutral',
  leading,
  children,
  action,
  isAlert = false,
}: NoticeBarProps) {
  const { top } = useSafeAreaInsets();
  const classes = toneClasses[tone];
  return (
    <View
      accessibilityRole={isAlert ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
      className={`border-border flex-row items-center gap-3 border-b px-4 py-2 ${classes.bar}`}
      style={{ paddingTop: top + 8 }}
    >
      {leading}
      <View className="flex-1 gap-0.5 py-1">{children}</View>
      {action && (
        <Pressable
          accessibilityRole="button"
          onPress={action.onPress}
          className="min-h-11 justify-center px-2 active:opacity-85"
        >
          <Text className={`font-body-extrabold text-caption ${classes.action}`}>
            {action.label}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
