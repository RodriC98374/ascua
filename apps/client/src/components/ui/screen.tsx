import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  centered?: boolean;
  /** Dentro de las pestañas, la barra inferior ya respeta el borde de abajo. */
  edges?: Edge[];
}

/** Pantalla con el fondo del sistema, margen de 16 px y ancho de tarjeta en escritorio. */
export function Screen({ children, centered = false, edges = ['top', 'bottom'] }: ScreenProps) {
  return (
    <SafeAreaView edges={edges} className="bg-surface-100 flex-1">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerClassName={`grow px-4 py-6 ${centered ? 'justify-center' : ''}`}
        >
          <View className="w-full max-w-[480px] self-center">{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
