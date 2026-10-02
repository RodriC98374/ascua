import { trophyShelf } from '@ascua/shared';
import { useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Screen } from '@/components/ui/screen';
import { useTrophies } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { TrophyCard } from '@/features/trophies/trophy-card';
import { TrophyGrid } from '@/features/trophies/trophy-grid';
import { trophyCountText } from '@/features/trophies/trophy-text';
import { useThemeColors } from '@/theme/colors';

/** Premios conseguidos (fase 21): todo lo canjeado, como trofeos. Aparte del historial de puntos. */
export default function TrophiesScreen() {
  const colors = useThemeColors();
  const uid = useUid();
  const redemptions = useTrophies(uid);
  // Se guarda el ID: la tarjeta abierta lee el canje en vivo y ve llegar "Utilizado".
  const [openId, setOpenId] = useState<string | null>(null);

  const shelf = trophyShelf(redemptions.data);
  const open = shelf.trophies.find((trophy) => trophy.id === openId);

  return (
    <View className="flex-1">
      <Screen edges={['top']}>
        <View className="gap-6">
          <ScreenHeader title="Premios conseguidos" fallbackHref="/recompensas" />
          {redemptions.isLoading ? (
            <ActivityIndicator color={colors.emberStrong} />
          ) : shelf.trophies.length === 0 ? (
            <Card>
              <Text className="font-body text-body text-ink-muted">
                Cada recompensa que canjees queda aquí como un trofeo. Cuando la disfrutes, márcala
                como utilizada.
              </Text>
            </Card>
          ) : (
            <>
              <Text className="font-body-semibold text-body text-ink-muted">
                {trophyCountText(shelf)}
              </Text>
              <TrophyGrid trophies={shelf.trophies} onOpen={(trophy) => setOpenId(trophy.id)} />
            </>
          )}
        </View>
      </Screen>
      {open && <TrophyCard trophy={open} onClose={() => setOpenId(null)} />}
    </View>
  );
}
