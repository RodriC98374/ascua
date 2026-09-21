import { ActivityIndicator, Pressable, Text } from 'react-native';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'link';
  isLoading?: boolean;
  isDisabled?: boolean;
}

const containerStyles = {
  primary: 'min-h-12 rounded-md bg-ember px-6',
  link: 'min-h-11 px-2',
};

const labelStyles = {
  primary: 'font-body-extrabold text-button text-ink-on-fill',
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
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: isInactive, busy: isLoading }}
      disabled={isInactive}
      onPress={onPress}
      className={`items-center justify-center ${containerStyles[variant]} ${isInactive ? 'opacity-40' : 'active:opacity-85'}`}
    >
      {isLoading ? (
        <ActivityIndicator color="#2B1B12" />
      ) : (
        <Text className={labelStyles[variant]}>{label}</Text>
      )}
    </Pressable>
  );
}
