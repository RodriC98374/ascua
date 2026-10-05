import { useState } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';

import { FieldError, FieldLabel, Hint } from '@/components/ui/form-parts';
import { useThemeColors } from '@/theme/colors';

interface TextFieldProps extends Omit<TextInputProps, 'className' | 'style'> {
  label: string;
  /** Mensaje de error bajo el campo; también pinta el borde en rojo. */
  error?: string | null;
  /** Ayuda bajo el campo, a la izquierda. Sigue a la vista aunque haya un error. */
  hint?: string;
  /** Contador de caracteres ("12/60"), a la derecha bajo el campo. */
  counter?: string;
}

export function TextField({
  label,
  error,
  hint,
  counter,
  multiline,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const colors = useThemeColors();
  const [isFocused, setIsFocused] = useState(false);
  const borderClass = error ? 'border-error' : isFocused ? 'border-focus-ring' : 'border-border';
  // Multilínea = área de texto: alto de ~4 líneas y el texto empieza arriba.
  const sizeClass = multiline ? 'min-h-28 py-3' : 'min-h-12';
  return (
    <View className="gap-1">
      <FieldLabel>{label}</FieldLabel>
      <TextInput
        accessibilityLabel={label}
        accessibilityHint={error ?? undefined}
        placeholderTextColor={colors.inkFaint}
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
      {(error || hint || counter) && (
        <View className="flex-row gap-2">
          <View className="flex-1 gap-0.5">
            {error && <FieldError>{error}</FieldError>}
            {hint && <Hint>{hint}</Hint>}
          </View>
          {counter && (
            <Text className="font-body-semibold text-caption text-ink-muted">{counter}</Text>
          )}
        </View>
      )}
    </View>
  );
}
