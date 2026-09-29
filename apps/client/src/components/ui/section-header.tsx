import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { CheckIcon } from '@/components/ui/icons';
import { useThemeColors } from '@/theme/colors';

interface SectionHeaderProps {
  title: string;
  /** Avance de la sección: "2 de 3", en verde con un check cuando está completa. */
  progress?: { done: number; total: number };
  /** Acción de texto a la derecha ("Ordenar", "Agregar"). */
  action?: ReactNode;
  isMuted?: boolean;
}

/** Título de una sección de lista, con su avance en una pastilla y una acción opcional. */
export function SectionHeader({ title, progress, action, isMuted = false }: SectionHeaderProps) {
  const colors = useThemeColors();
  const isComplete =
    progress !== undefined && progress.total > 0 && progress.done >= progress.total;
  return (
    <View className="min-h-11 flex-row items-center gap-2">
      <Text
        accessibilityRole="header"
        className={`font-heading text-heading-md ${isMuted ? 'text-ink-muted' : 'text-ink'}`}
      >
        {title}
      </Text>
      <View className="flex-1 flex-row">
        {progress && progress.total > 0 && (
          <View
            accessibilityLabel={`${progress.done} de ${progress.total}`}
            className={`flex-row items-center gap-1 rounded-full px-2 py-0.5 ${isComplete ? 'bg-success-soft' : 'bg-surface-300'}`}
          >
            {isComplete && <CheckIcon size={12} color={colors.success} />}
            <Text
              className={`font-body-bold text-caption ${isComplete ? 'text-success' : 'text-ink-muted'}`}
            >
              {progress.done} de {progress.total}
            </Text>
          </View>
        )}
      </View>
      {action}
    </View>
  );
}
