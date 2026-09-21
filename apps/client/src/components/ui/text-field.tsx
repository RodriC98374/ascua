import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface TextFieldProps extends Omit<TextInputProps, 'className' | 'style'> {
  label: string;
}

export function TextField({ label, onFocus, onBlur, ...inputProps }: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <View className="gap-1">
      <Text className="font-body-bold text-caption text-ink-muted">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8A7862"
        className={`bg-surface-200 font-body text-body text-ink min-h-12 rounded-sm border-2 px-4 ${isFocused ? 'border-focus-ring' : 'border-border'}`}
        onFocus={(event) => {
          setIsFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setIsFocused(false);
          onBlur?.(event);
        }}
        {...inputProps}
      />
    </View>
  );
}
