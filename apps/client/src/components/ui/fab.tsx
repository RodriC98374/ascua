import { LinearGradient } from 'expo-linear-gradient';
import { View } from 'react-native';

import { PlusIcon } from '@/components/ui/icons';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useThemeColors } from '@/theme/colors';

/**
 * Botón flotante "+" abajo a la derecha, alineado a la columna de contenido (480 px en
 * escritorio). La pantalla debe dejar ~64 px libres al final para que no tape la última fila.
 */
export function Fab({ label, onPress }: { label: string; onPress: () => void }) {
  const colors = useThemeColors();
  return (
    <View
      pointerEvents="box-none"
      style={{ position: 'absolute', left: 0, right: 0, bottom: 20, alignItems: 'center' }}
    >
      <View pointerEvents="box-none" className="w-full max-w-[480px] items-end px-4">
        <PressableScale
          pressedScale={0.9}
          accessibilityRole="button"
          accessibilityLabel={label}
          onPress={onPress}
          className="rounded-full active:opacity-85"
          style={{
            shadowColor: colors.shadowWarm,
            shadowOffset: { width: 0, height: 12 },
            shadowOpacity: 0.35,
            shadowRadius: 20,
            elevation: 8,
          }}
        >
          <LinearGradient
            colors={colors.emberGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: 56,
              height: 56,
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <PlusIcon size={26} color={colors.inkOnFill} />
          </LinearGradient>
        </PressableScale>
      </View>
    </View>
  );
}
