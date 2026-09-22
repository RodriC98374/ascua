import { ActivityIndicator, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { ScreenHeader } from '@/components/ui/screen-header';
import { Screen } from '@/components/ui/screen';
import { usePointTransactions, useRedemptions } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { historyByDay } from '@/features/rewards/points-history';
import { colors } from '@/theme/colors';

/** Movimientos de puntos (lo ganado al cerrar cada día y lo gastado), del más reciente. */
export default function HistoryScreen() {
  const uid = useUid();
  const movements = usePointTransactions(uid);
  const redemptions = useRedemptions(uid);
  const days = historyByDay(movements.data, redemptions.data);

  return (
    <Screen edges={['top']}>
      <View className="gap-6">
        <ScreenHeader title="Historial de puntos" fallbackHref="/recompensas" />
        {movements.isLoading ? (
          <ActivityIndicator color={colors.emberStrong} />
        ) : days.length === 0 ? (
          <Card>
            <Text className="font-body text-body text-ink-muted">
              Aquí verás tus puntos ganados y gastados. Los de cada día llegan al cerrarlo, al abrir
              la app al día siguiente.
            </Text>
          </Card>
        ) : (
          days.map((day) => (
            <View key={day.dateKey} className="gap-2">
              <Text className="font-heading text-heading-sm text-ink">{day.title}</Text>
              <Card className="py-1">
                {day.items.map((item, index) => (
                  <View
                    key={item.id}
                    className={`min-h-12 flex-row items-center gap-3 py-2 ${index > 0 ? 'border-border border-t' : ''}`}
                  >
                    <View className="flex-1">
                      <Text className="font-body-semibold text-body text-ink">
                        {item.description}
                      </Text>
                      {item.note && (
                        <Text className="font-body text-caption text-ink-muted">{item.note}</Text>
                      )}
                    </View>
                    <Text
                      className={`font-body-extrabold text-body ${item.isGain ? 'text-success' : 'text-ink'}`}
                    >
                      {item.amount} pts
                    </Text>
                  </View>
                ))}
              </Card>
            </View>
          ))
        )}
      </View>
    </Screen>
  );
}
