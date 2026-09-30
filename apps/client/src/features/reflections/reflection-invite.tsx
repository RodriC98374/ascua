import {
  formatDateRange,
  invitedReflectionWeek,
  reflectionWeekEnd,
  type DateKey,
} from '@ascua/shared';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { EditIcon } from '@/components/ui/icons';
import { useWeeklyReflection } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { useThemeColors } from '@/theme/colors';

import { latestReflectableWeek, openReflection } from './reflection-section';

/**
 * Invitación de Hoy a la reflexión semanal: el domingo (la semana que termina) y el lunes (la que
 * acaba de terminar), solo si todavía no está escrita. El resto de la semana, nada.
 */
export function ReflectionInvite({ today }: { today: DateKey }) {
  const colors = useThemeColors();
  const uid = useUid();
  const invited = invitedReflectionWeek(today);
  // El hook va siempre (mismo orden de hooks); fuera de domingo y lunes no se muestra.
  const reflection = useWeeklyReflection(uid, invited ?? latestReflectableWeek(today));
  if (!invited || reflection.isLoading || reflection.exists) return null;

  return (
    <Card className="gap-3">
      <View className="flex-row items-center gap-3">
        <View className="bg-week-morado-soft h-11 w-11 items-center justify-center rounded-full">
          <EditIcon size={20} color={colors.weekMorado} />
        </View>
        <View className="flex-1">
          <Text className="font-heading text-heading-sm text-ink">Cierra tu semana</Text>
          <Text className="font-body-semibold text-caption text-ink-muted">
            {formatDateRange(invited, reflectionWeekEnd(invited))} · tres preguntas, cinco minutos
          </Text>
        </View>
      </View>
      <Button
        label="Escribir mi reflexión"
        variant="secondary"
        onPress={() => openReflection(invited)}
      />
    </Card>
  );
}
