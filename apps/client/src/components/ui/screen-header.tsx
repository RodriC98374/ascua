import { router, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { ArrowIcon } from '@/components/ui/icons';
import { colors } from '@/theme/colors';

/** Encabezado de una pantalla apilada, con botón para volver. */
export function ScreenHeader({ title, fallbackHref }: { title: string; fallbackHref: Href }) {
  function goBack() {
    if (router.canGoBack()) router.back();
    else router.replace(fallbackHref);
  }

  return (
    <View className="flex-row items-center gap-2">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Volver"
        onPress={goBack}
        className="h-11 w-11 items-center justify-center rounded-md active:opacity-85"
      >
        <ArrowIcon direction="left" size={22} color={colors.ink} />
      </Pressable>
      <Text className="font-heading text-heading-lg text-ink">{title}</Text>
    </View>
  );
}
