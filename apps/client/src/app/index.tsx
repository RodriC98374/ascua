import { APP_TIME_ZONE } from '@ascua/shared';
import { Text, View } from 'react-native';

import { app } from '@/lib/firebase';

export default function Index() {
  return (
    <View className="flex-1 items-center justify-center gap-2 bg-violet-600 px-4">
      <Text className="text-3xl font-bold text-white">Ascua</Text>
      <Text className="text-base text-violet-100">Zona horaria: {APP_TIME_ZONE}</Text>
      <Text className="text-base text-violet-100">Firebase: {app.options.projectId}</Text>
    </View>
  );
}
