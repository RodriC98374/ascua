import { canWriteReflection, type DateKey, type ReflectionQuestion } from '@ascua/shared';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useWeeklyReflection } from '@/data/hooks';
import { useUid } from '@/features/auth/session';

import { openReflection } from './reflection-section';

const ANSWERS: { key: ReflectionQuestion; label: string }[] = [
  { key: 'wentWell', label: 'Qué salió bien' },
  { key: 'wasHard', label: 'Qué costó' },
  { key: 'nextFocus', label: 'En qué enfocarse' },
];

/** La reflexión de la semana que se está viendo en Mes → Semana. */
export function WeekReflectionCard({
  weekStartDateKey,
  today,
}: {
  weekStartDateKey: DateKey;
  today: DateKey;
}) {
  const uid = useUid();
  const reflection = useWeeklyReflection(uid, weekStartDateKey);
  if (reflection.isLoading) return null;
  const isWritable = canWriteReflection(weekStartDateKey, today);
  const answered = ANSWERS.filter((answer) => reflection.data?.[answer.key]);

  return (
    <Card className="gap-3">
      <Text className="font-heading text-heading-md text-ink">Tu reflexión</Text>
      {reflection.data ? (
        <>
          {answered.map((answer) => (
            <View key={answer.key} className="gap-0.5">
              <Text className="font-body-bold text-caption text-ink-muted">{answer.label}</Text>
              <Text className="font-body text-body text-ink">{reflection.data?.[answer.key]}</Text>
            </View>
          ))}
          <Button
            label="Editar"
            variant="secondary"
            onPress={() => openReflection(weekStartDateKey)}
          />
        </>
      ) : isWritable ? (
        <>
          <Text className="font-body text-body text-ink-muted">
            Todavía no escribiste la de esta semana. Mirar atrás un rato ayuda a decidir qué sigue.
          </Text>
          <Button label="Escribir mi reflexión" onPress={() => openReflection(weekStartDateKey)} />
        </>
      ) : (
        <Text className="font-body text-body text-ink-muted">
          Se abre el domingo, cuando la semana termina.
        </Text>
      )}
    </Card>
  );
}
