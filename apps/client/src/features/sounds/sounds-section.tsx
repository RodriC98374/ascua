import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Toggle } from '@/components/ui/toggle';

import { useSounds } from './sounds-provider';

/** Interruptor de sonidos. Se guarda en este dispositivo, como el tema. */
export function SoundsSection() {
  const { isEnabled, setIsEnabled } = useSounds();
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Sonidos</Text>
        <Text className="font-body text-body text-ink-muted">
          Un tic al marcar y una fanfarria al asegurar tu racha. Suenan con el volumen multimedia y
          cada dispositivo guarda su elección.
        </Text>
      </View>
      <Card className="py-1">
        <View className="min-h-12 flex-row items-center gap-3 py-2">
          <Text className="font-body-bold text-body text-ink flex-1">Sonidos de logro</Text>
          <Toggle
            accessibilityLabel="Sonidos de logro"
            value={isEnabled ?? false}
            onChange={setIsEnabled}
          />
        </View>
      </Card>
    </View>
  );
}
