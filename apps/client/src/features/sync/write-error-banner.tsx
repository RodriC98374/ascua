import { Pressable, Text, View } from 'react-native';

import { dismissWriteError, useWriteError } from '@/features/sync/write-errors';

/** Aviso de una escritura rechazada. Queda visible hasta que el usuario lo cierra. */
export function WriteErrorBanner() {
  const error = useWriteError();
  if (!error) return null;
  return (
    <View
      accessibilityRole="alert"
      className="border-border bg-error-soft flex-row items-start gap-3 border-b px-4 py-3"
    >
      <Text className="font-body-bold text-caption text-error flex-1">{error}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={dismissWriteError}
        className="min-h-11 justify-center px-2"
      >
        <Text className="font-body-extrabold text-caption text-error">Entendido</Text>
      </Pressable>
    </View>
  );
}
