import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { Screen } from '@/components/ui/screen';

/** Pestaña cuya funcionalidad llega en una fase posterior. */
export function ComingSoon({ title, message }: { title: string; message: string }) {
  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <Text className="font-heading text-heading-lg text-ink">{title}</Text>
        <Card>
          <Text className="font-body text-body text-ink-muted">{message}</Text>
        </Card>
      </View>
    </Screen>
  );
}
