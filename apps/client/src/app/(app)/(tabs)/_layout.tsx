import { TabSlot, Tabs } from 'expo-router/ui';
import { useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { renderNavBar } from '@/components/nav-bar';
import { WriteErrorBanner } from '@/components/write-error-banner';

/** Ancho desde el que la navegación pasa a ser una columna a la izquierda (sistema de diseño). */
const WIDE_LAYOUT_MIN_WIDTH = 768;

export default function TabsLayout() {
  const { width } = useWindowDimensions();
  const { bottom } = useSafeAreaInsets();
  const isWide = width >= WIDE_LAYOUT_MIN_WIDTH;
  const navBar = renderNavBar({ isWide, bottomInset: bottom });

  return (
    <Tabs style={{ flex: 1, flexDirection: isWide ? 'row' : 'column' }}>
      {isWide && navBar}
      <View className="bg-surface-100 flex-1">
        <WriteErrorBanner />
        <TabSlot style={{ flex: 1 }} />
      </View>
      {!isWide && navBar}
    </Tabs>
  );
}
