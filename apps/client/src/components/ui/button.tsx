import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  /**
   * primary: una por pantalla. secondary: alternativas. link: acciones de texto.
   * danger: confirma una acción que no se puede deshacer (archivar).
   */
  variant?: 'primary' | 'secondary' | 'link' | 'danger';
  isLoading?: boolean;
  isDisabled?: boolean;
}

const labelStyles = {
  primary: 'font-body-extrabold text-button text-ink-on-fill',
  secondary: 'font-body-extrabold text-button text-ember-strong',
  link: 'font-body-bold text-body text-ember-strong',
  danger: 'font-body-extrabold text-button text-on-error',
};

const containerStyles = {
  secondary:
    'border-border bg-surface-200 min-h-12 items-center justify-center rounded-md border-[1.5px] px-5',
  link: 'min-h-11 items-center justify-center px-2',
  danger: 'bg-error-fill min-h-12 items-center justify-center rounded-md px-5',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  isDisabled = false,
}: ButtonProps) {
  const colors = useThemeColors();
  const isInactive = isDisabled || isLoading;
  const content = isLoading ? (
    <ActivityIndicator
      color={
        variant === 'primary'
          ? colors.inkOnFill
          : variant === 'danger'
            ? colors.onError
            : colors.emberStrong
      }
    />
  ) : (
    <Text className={labelStyles[variant]}>{label}</Text>
  );

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: isLoading }}
      disabled={isInactive}
      onPress={onPress}
      className={isInactive ? 'opacity-40' : 'active:opacity-85'}
    >
      {variant === 'primary' ? (
        <LinearGradient
          colors={colors.emberGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <View className="min-h-12 items-center justify-center px-5">{content}</View>
        </LinearGradient>
      ) : (
        <View className={containerStyles[variant]}>{content}</View>
      )}
    </Pressable>
  );
}
