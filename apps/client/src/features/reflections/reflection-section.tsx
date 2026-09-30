import {
  addDays,
  formatDateRange,
  isoWeekday,
  reflectionWeekEnd,
  startOfWeek,
  type DateKey,
  type WeeklyReflection,
} from '@ascua/shared';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { useThemeColors } from '@/theme/colors';

/** Cuántas reflexiones anteriores muestra la lista. */
const RECENT_REFLECTIONS = 6;

/** La última semana que ya se puede reflexionar: la de hoy si es domingo; si no, la anterior. */
export function latestReflectableWeek(today: DateKey): DateKey {
  return isoWeekday(today) === 7 ? startOfWeek(today) : addDays(startOfWeek(today), -7);
}

export function openReflection(weekStartDateKey: DateKey) {
  router.push({ pathname: '/metas/reflexion/[weekStartDateKey]', params: { weekStartDateKey } });
}

/** La primera respuesta con texto, para la vista previa. */
function preview(reflection: WeeklyReflection): string {
  return [reflection.wentWell, reflection.nextFocus, reflection.wasHard].find(Boolean) ?? '';
}

/** Reflexión semanal en Metas: la de la última semana y las anteriores. */
export function ReflectionSection({
  reflections,
  today,
}: {
  reflections: readonly WeeklyReflection[];
  today: DateKey;
}) {
  const colors = useThemeColors();
  const week = latestReflectableWeek(today);
  const current = reflections.find((reflection) => reflection.weekStartDateKey === week);
  const previous = reflections
    .filter((reflection) => reflection.weekStartDateKey !== week)
    .slice(0, RECENT_REFLECTIONS);

  return (
    <View className="gap-2">
      <SectionHeader title="Reflexión semanal" />
      <Card className="gap-3">
        <View className="gap-0.5">
          <Text className="font-body-bold text-caption text-ink-muted">
            Semana del {formatDateRange(week, reflectionWeekEnd(week))}
          </Text>
          <Text className="font-heading text-heading-sm text-ink">
            {current ? 'Ya la escribiste' : '¿Cómo te fue esta semana?'}
          </Text>
          <Text className="font-body text-body text-ink-muted" numberOfLines={current ? 2 : 3}>
            {current
              ? preview(current)
              : 'Tres preguntas con el resumen de tu semana al lado. Cinco minutos para ver qué funcionó y en qué enfocarte.'}
          </Text>
        </View>
        <Button
          label={current ? 'Ver o editar' : 'Escribir mi reflexión'}
          variant={current ? 'secondary' : 'primary'}
          onPress={() => openReflection(week)}
        />
      </Card>

      {previous.length > 0 && (
        <Card className="py-1">
          {previous.map((reflection, index) => (
            <Pressable
              key={reflection.weekStartDateKey}
              accessibilityRole="button"
              onPress={() => openReflection(reflection.weekStartDateKey)}
              className={`min-h-14 flex-row items-center gap-3 py-2 active:opacity-85 ${index > 0 ? 'border-border border-t' : ''}`}
            >
              <View className="flex-1 gap-0.5">
                <Text className="font-body-bold text-body text-ink">
                  {formatDateRange(
                    reflection.weekStartDateKey,
                    reflectionWeekEnd(reflection.weekStartDateKey),
                  )}
                </Text>
                <Text numberOfLines={1} className="font-body text-caption text-ink-muted">
                  {preview(reflection)}
                </Text>
              </View>
              <ChevronIcon size={18} direction="right" color={colors.inkFaint} />
            </Pressable>
          ))}
        </Card>
      )}
    </View>
  );
}
