import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { SegmentedControl } from '@/components/ui/segmented-control';

import { THEME_OPTIONS } from './theme-preference';
import { useThemePreference } from './theme-provider';

/** Tema de la app (decisión D17). Se guarda en este dispositivo. */
export function AppearanceSection() {
  const { preference, setPreference } = useThemePreference();
  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Apariencia</Text>
        <Text className="font-body text-body text-ink-muted">
          Automático sigue el tema de tu celular o computadora. Cada uno guarda su elección.
        </Text>
      </View>
      <Card>
        <SegmentedControl
          accessibilityLabel="Tema"
          options={THEME_OPTIONS}
          value={preference ?? 'system'}
          onChange={setPreference}
        />
      </Card>
    </View>
  );
}
