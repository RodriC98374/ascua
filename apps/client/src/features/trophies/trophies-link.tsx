import type { TrophyShelf } from '@ascua/shared';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { ChevronIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useThemeColors } from '@/theme/colors';

import { TrophyEmblem } from './trophy-emblem';
import { trophyCountText } from './trophy-text';

/** Acceso a la vitrina desde Premios: cuántos premios conseguidos faltan usar. */
export function TrophiesLink({ shelf }: { shelf: TrophyShelf }) {
  const colors = useThemeColors();
  const hasTrophies = shelf.trophies.length > 0;
  return (
    <PressableScale
      accessibilityRole="button"
      onPress={() => router.push('/recompensas/trofeos')}
      className="bg-surface-200 min-h-16 flex-row items-center gap-3 rounded-lg px-4 py-3"
      style={{
        shadowColor: colors.shadowNeutral,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
        elevation: 1,
      }}
    >
      <TrophyEmblem tier="large" size={40} />
      <View className="flex-1 gap-0.5">
        <Text className="font-heading text-heading-sm text-ink">Premios conseguidos</Text>
        <Text className="font-body-semibold text-caption text-ink-muted">
          {hasTrophies ? trophyCountText(shelf) : 'Lo que canjees queda aquí como trofeo.'}
        </Text>
      </View>
      {shelf.unusedCount > 0 && (
        <View className="bg-ember min-w-6 items-center rounded-full px-2 py-[3px]">
          <Text className="font-body-extrabold text-caption text-ink-on-fill">
            {shelf.unusedCount}
          </Text>
        </View>
      )}
      <ChevronIcon direction="right" size={20} color={colors.inkMuted} />
    </PressableScale>
  );
}
