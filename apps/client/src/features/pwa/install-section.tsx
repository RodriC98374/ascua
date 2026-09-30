import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

import { useInstallPrompt } from './pwa';

/**
 * Instalar la web como app en la PC (fase 19). Solo aparece cuando el navegador lo ofrece: en
 * Chrome o Edge, y mientras no esté instalada. En Android nunca (ya es una app).
 */
export function InstallSection() {
  const installPrompt = useInstallPrompt();
  if (!installPrompt) return null;

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Ascua en esta PC</Text>
        <Text className="font-body text-body text-ink-muted">
          Instálala como app: se abre en su propia ventana, con su ícono, y también sin internet.
        </Text>
      </View>
      <Card>
        <Button label="Instalar" onPress={installPrompt.install} />
      </Card>
    </View>
  );
}
