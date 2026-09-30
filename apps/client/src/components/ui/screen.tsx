import { createContext, useContext, useLayoutEffect, useState, type ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

interface ScreenProps {
  children: ReactNode;
  centered?: boolean;
  /** Dentro de las pestañas, la barra inferior ya respeta el borde de abajo. */
  edges?: Edge[];
}

type SetFooter = (footer: ReactNode) => void;

const FooterSlot = createContext<SetFooter | null>(null);

/** Pantalla con el fondo del sistema, margen de 16 px y ancho de tarjeta en escritorio. */
export function Screen({ children, centered = false, edges = ['top', 'bottom'] }: ScreenProps) {
  const [footer, setFooter] = useState<ReactNode>(null);

  return (
    <SafeAreaView edges={edges} className="bg-surface-100 flex-1">
      <FooterSlot.Provider value={setFooter}>
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
          {footer !== null && (
            <View className="border-border bg-surface-200 border-t px-4 py-3">
              <View className="w-full max-w-[480px] self-center">{footer}</View>
            </View>
          )}
        </KeyboardAvoidingView>
      </FooterSlot.Provider>
    </SafeAreaView>
  );
}

/**
 * Barra fija al pie de la `Screen`, fuera del scroll: el "Guardar" de un formulario largo queda
 * siempre a la vista. El formulario la declara donde tiene su estado y `Screen` la dibuja abajo.
 * Fuera de una `Screen`, se dibuja en su lugar.
 */
export function ScreenFooter({ children }: { children: ReactNode }) {
  const setFooter = useContext(FooterSlot);
  useLayoutEffect(() => {
    setFooter?.(children);
  }, [setFooter, children]);
  useLayoutEffect(() => () => setFooter?.(null), [setFooter]);
  return setFooter ? null : children;
}
