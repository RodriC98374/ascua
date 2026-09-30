import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Fab } from '@/components/ui/fab';
import { ChevronIcon } from '@/components/ui/icons';
import { Screen } from '@/components/ui/screen';
import { SectionHeader } from '@/components/ui/section-header';
import { useGoals, useHabits, useTasksByIds, useWeeklyReflections } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { GoalCard } from '@/features/goals/goal-card';
import { ReflectionSection } from '@/features/reflections/reflection-section';
import { useToday } from '@/features/today/use-today';
import { useThemeColors } from '@/theme/colors';

/** Metas (fase 18, D25): las activas con su avance, la reflexión semanal y lo ya logrado. */
export default function GoalsScreen() {
  const colors = useThemeColors();
  const uid = useUid();
  const today = useToday();
  const goals = useGoals(uid);
  const habits = useHabits(uid);
  const reflections = useWeeklyReflections(uid);
  const active = goals.data.filter((goal) => goal.status === 'active');
  const achieved = goals.data.filter((goal) => goal.status === 'achieved');
  const archived = goals.data.filter((goal) => goal.status === 'archived');
  const tasks = useTasksByIds(
    uid,
    active.flatMap((goal) => goal.taskIds),
  );
  const [isShowingArchived, setIsShowingArchived] = useState(false);

  if (goals.isLoading || habits.isLoading) {
    return (
      <View className="bg-surface-100 flex-1 items-center justify-center">
        <ActivityIndicator color={colors.emberStrong} size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1">
      <Screen edges={['top']}>
        <View className="gap-6">
          <Text className="font-heading-extrabold text-display-md text-ink">Metas</Text>

          {active.length === 0 ? (
            <Card className="gap-4">
              <View className="gap-1">
                <Text className="font-heading text-heading-md text-ink">¿Qué quieres lograr?</Text>
                <Text className="font-body text-body text-ink-muted">
                  Una meta junta las tareas y los hábitos que te acercan a algo grande: aprobar una
                  materia, correr 10 km, terminar un proyecto.
                </Text>
              </View>
              <Button label="Crear meta" onPress={() => router.push('/metas/new')} />
            </Card>
          ) : (
            <View className="gap-2">
              <SectionHeader title="En curso" />
              <View className="gap-3">
                {active.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    tasks={tasks.data}
                    habits={habits.data}
                    today={today}
                  />
                ))}
              </View>
            </View>
          )}

          <ReflectionSection reflections={reflections.data} today={today} />

          {achieved.length > 0 && (
            <View className="gap-2">
              <SectionHeader title="Logradas" />
              <View className="gap-3">
                {achieved.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    tasks={[]}
                    habits={habits.data}
                    today={today}
                  />
                ))}
              </View>
            </View>
          )}

          {archived.length > 0 && (
            <View className="gap-2">
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: isShowingArchived }}
                onPress={() => setIsShowingArchived((current) => !current)}
                className="min-h-11 flex-row items-center gap-1 self-start active:opacity-85"
              >
                <Text className="font-body-bold text-body text-ink-muted">
                  Archivadas · {archived.length}
                </Text>
                <View style={{ transform: [{ rotate: isShowingArchived ? '90deg' : '0deg' }] }}>
                  <ChevronIcon size={18} direction="right" color={colors.inkMuted} />
                </View>
              </Pressable>
              {isShowingArchived &&
                archived.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    tasks={[]}
                    habits={habits.data}
                    today={today}
                  />
                ))}
            </View>
          )}
          {/* Espacio para que el botón flotante no tape la última tarjeta. */}
          <View className="h-16" />
        </View>
      </Screen>
      <Fab label="Crear meta" onPress={() => router.push('/metas/new')} />
    </View>
  );
}
