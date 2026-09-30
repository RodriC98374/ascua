// Piezas de los formularios (D24): grupos con título en una tarjeta, etiquetas, ayudas y errores.
import type { ReactNode } from 'react';
import { Text, View } from 'react-native';

import { Card } from '@/components/ui/card';

/** Un grupo del formulario: título y una tarjeta con sus campos. */
export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="font-heading text-heading-md text-ink">
        {title}
      </Text>
      <Card className="gap-5">{children}</Card>
    </View>
  );
}

export function FieldLabel({ children }: { children: ReactNode }) {
  return <Text className="font-body-bold text-body text-ink">{children}</Text>;
}

export function Hint({ children }: { children: ReactNode }) {
  return <Text className="font-body-semibold text-caption text-ink-muted">{children}</Text>;
}

export function FieldError({ children }: { children: ReactNode }) {
  return (
    <Text accessibilityLiveRegion="polite" className="font-body-bold text-caption text-error">
      {children}
    </Text>
  );
}
