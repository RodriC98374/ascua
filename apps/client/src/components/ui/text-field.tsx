import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

interface TextFieldProps extends Omit<TextInputProps, 'className' | 'style'> {
  label: string;
  /** Mensaje de error bajo el campo; también pinta el borde en rojo. */
  error?: string | null;
  /** Ayuda a la derecha bajo el campo, por ejemplo el contador de caracteres. */
  hint?: string;
}

export function TextField({
  label,
  error,
  hint,
  multiline,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const borderClass = error ? 'border-error' : isFocused ? 'border-focus-ring' : 'border-border';
  // Multilínea = área de texto: alto de ~4 líneas y el texto empieza arriba.
  const sizeClass = multiline ? 'min-h-28 py-3' : 'min-h-12';
  return (
    <View className="gap-1">
      <Text className="font-body-bold text-caption text-ink-muted">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? undefined}
        placeholderTextColor="#8A7862"
        multiline={multiline}
        numberOfLines={multiline ? 4 : undefined}
        textAlignVertical={multiline ? 'top' : 'center'}
        className={`bg-surface-200 font-body text-body text-ink rounded-sm border-2 px-4 ${sizeClass} ${borderClass}`}
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
      {(error || hint) && (
        <View className="flex-row gap-2">
          <Text
            accessibilityLiveRegion="polite"
            className="font-body-bold text-caption text-error flex-1"
          >
            {error}
          </Text>
          {hint && <Text className="font-body-semibold text-caption text-ink-faint">{hint}</Text>}
        </View>
      )}
    </View>
  );
}
