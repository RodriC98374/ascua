import type { HabitTier } from '@ascua/shared';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import { CheckIcon } from '@/components/ui/icons';
import { colors, emberGradient } from '@/theme/colors';

interface HabitCheckProps {
  name: string;
  tier: HabitTier;
  isDone: boolean;
  onToggle: () => void;
}

/** Fila de un hábito del día: toda la fila marca y desmarca. */
export function HabitCheck({ name, tier, isDone, onToggle }: HabitCheckProps) {
  const isPrimary = tier === 'primary';
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityState={{ checked: isDone }}
      accessibilityLabel={`${name}, ${isPrimary ? 'principal' : 'secundario'}`}
      onPress={onToggle}
      className="min-h-11 flex-row items-center gap-3 py-2 active:opacity-85"
    >
      {isDone ? (
        <LinearGradient
          colors={emberGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{
            width: 28,
            height: 28,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CheckIcon size={14} color={colors.inkOnFill} />
        </LinearGradient>
      ) : (
        <View className="border-border bg-surface-300 h-7 w-7 rounded-sm border-[1.5px]" />
      )}
      <Text
        className={`flex-1 ${isPrimary ? 'font-heading text-heading-sm text-ink' : 'font-body text-body text-ink-muted'}`}
      >
        {name}
      </Text>
      <View
        className={`rounded-full px-2 py-[3px] ${isPrimary ? 'bg-warning-soft' : 'bg-surface-300'}`}
      >
        <Text
          className={`font-body-extrabold text-label uppercase ${isPrimary ? 'text-ember-strong' : 'text-ink-muted'}`}
        >
          {isPrimary ? 'Principal' : 'Secundario'}
        </Text>
      </View>
    </Pressable>
  );
}
