import { APP_TIME_ZONE } from '@ascua/shared';
import { ScrollView, Text } from 'react-native';

import { ChartsSpike } from '@/components/charts-spike';
import { app } from '@/lib/firebase';

export default function Index() {
  return (
    <ScrollView
      className="flex-1 bg-violet-600"
      contentContainerClassName="items-center gap-2 px-4 py-16"
    >
      <Text className="text-3xl font-bold text-white">Ascua</Text>
      <Text className="text-base text-violet-100">Zona horaria: {APP_TIME_ZONE}</Text>
      <Text className="mb-4 text-base text-violet-100">Firebase: {app.options.projectId}</Text>
      <ChartsSpike />
    </ScrollView>
  );
}
