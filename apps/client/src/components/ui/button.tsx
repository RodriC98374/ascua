import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { colors, emberGradient } from '@/theme/colors';

interface ButtonProps {
  label: string;
  onPress: () => void;
  /** primary: una por pantalla. secondary: alternativas. link: acciones de texto. */
  variant?: 'primary' | 'secondary' | 'link';
  isLoading?: boolean;
  isDisabled?: boolean;
}

const labelStyles = {
  primary: 'font-body-extrabold text-button text-ink-on-fill',
  secondary: 'font-body-extrabold text-button text-ember-strong',
  link: 'font-body-bold text-body text-ember-strong',
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  isLoading = false,
  isDisabled = false,
}: ButtonProps) {
  const isInactive = isDisabled || isLoading;
  const content = isLoading ? (
    <ActivityIndicator color={variant === 'primary' ? colors.inkOnFill : colors.emberStrong} />
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
          colors={emberGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 12 }}
        >
          <View className="min-h-12 items-center justify-center px-5">{content}</View>
        </LinearGradient>
      ) : (
        <View
          className={
            variant === 'secondary'
              ? 'border-border bg-surface-200 min-h-12 items-center justify-center rounded-md border-[1.5px] px-5'
              : 'min-h-11 items-center justify-center px-2'
          }
        >
          {content}
        </View>
      )}
    </Pressable>
  );
}
