import { View } from 'react-native';

import { Screen } from '@/components/ui/screen';
import { ScreenHeader } from '@/components/ui/screen-header';
import { RestoreFlow } from '@/features/restore/restore-flow';

/** Restaurar la configuración desde un respaldo JSON (fase 19). */
export default function RestoreScreen() {
  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Restaurar respaldo" fallbackHref="/ajustes" />
        <RestoreFlow />
      </View>
    </Screen>
  );
}
