import type { PlannedRestoreItem } from '@ascua/shared';
import { Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { choiceContainer } from '@/components/ui/choice-styles';
import { CheckIcon } from '@/components/ui/icons';
import { SectionHeader } from '@/components/ui/section-header';
import { useThemeColors } from '@/theme/colors';

import { restoreNoteText } from './restore-text';

interface RestoreSectionProps<T> {
  title: string;
  items: readonly PlannedRestoreItem<T>[];
  titleOf: (value: T) => string;
  detailOf: (value: T) => string;
  onToggle: (keys: readonly string[], isSelected: boolean) => void;
}

/**
 * Una sección de la vista previa: lo nuevo del respaldo, cada cosa con su casilla. Lo que ya está
 * en la cuenta no aparece aquí (no se duplica); se resume arriba con `restoreRepeatsText`.
 */
export function RestoreSection<T>({
  title,
  items,
  titleOf,
  detailOf,
  onToggle,
}: RestoreSectionProps<T>) {
  const colors = useThemeColors();
  const choosable = items.filter((item) => item.existingId === null);
  if (choosable.length === 0) return null;
  const selectedCount = choosable.filter((item) => item.isSelected).length;
  const isAllSelected = selectedCount === choosable.length;

  return (
    <View className="gap-2">
      <SectionHeader
        title={title}
        progress={{ done: selectedCount, total: choosable.length }}
        action={
          choosable.length > 1 && (
            <Pressable
              accessibilityRole="button"
              onPress={() =>
                onToggle(
                  choosable.map((item) => item.key),
                  !isAllSelected,
                )
              }
              className="min-h-11 justify-center px-2 active:opacity-85"
            >
              <Text className="font-body-bold text-caption text-ember-strong">
                {isAllSelected ? 'Quitar todas' : 'Elegir todas'}
              </Text>
            </Pressable>
          )
        }
      />
      <Card className="py-1">
        {choosable.map((item, index) => (
          <Pressable
            key={item.key}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: item.isSelected }}
            onPress={() => onToggle([item.key], !item.isSelected)}
            className={`min-h-12 flex-row items-center gap-3 py-2 active:opacity-85 ${index > 0 ? 'border-border border-t' : ''}`}
          >
            <View
              className={`h-6 w-6 items-center justify-center rounded-sm border-2 ${choiceContainer(item.isSelected)}`}
            >
              {item.isSelected && <CheckIcon size={14} color={colors.emberStrong} />}
            </View>
            <View className="flex-1 gap-0.5">
              <Text className="font-body-bold text-body text-ink">{titleOf(item.value)}</Text>
              <Text className="font-body text-caption text-ink-muted" numberOfLines={2}>
                {detailOf(item.value)}
              </Text>
              {item.isSelected &&
                item.notes.map((note) => (
                  <Text key={note} className="font-body-semibold text-caption text-ember-strong">
                    {restoreNoteText(note)}
                  </Text>
                ))}
            </View>
          </Pressable>
        ))}
      </Card>
    </View>
  );
}
