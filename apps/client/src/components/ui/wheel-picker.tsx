import { useEffect, useRef } from 'react';
import { Platform, Pressable, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  type SharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { selectionFeedback } from '@/features/celebration/haptics';

/** Alto de cada opción: el mínimo táctil de 44 px. */
export const WHEEL_ITEM_HEIGHT = 44;
/** Opciones a la vista; la del medio es la elegida. */
export const WHEEL_VISIBLE_ITEMS = 5;
const SIDE_PADDING = ((WHEEL_VISIBLE_ITEMS - 1) / 2) * WHEEL_ITEM_HEIGHT;

// En web el ajuste a cada opción lo hace el navegador con scroll-snap (React Native Web no conoce
// `snapToInterval`). No están en los tipos de React Native, de ahí la conversión.
const WEB_SNAP_CONTAINER = { scrollSnapType: 'y mandatory' } as unknown as ViewStyle;
const WEB_SNAP_ITEM = { scrollSnapAlign: 'center' } as unknown as ViewStyle;
const isWeb = Platform.OS === 'web';

interface WheelPickerProps {
  /** Nombre para el lector de pantalla ("Hora", "Minutos"). */
  label: string;
  options: readonly number[];
  value: number;
  onChange: (value: number) => void;
  format: (value: number) => string;
  width?: number;
}

/**
 * Rueda que se desliza, como la alarma del celular: la opción que queda en el centro es la
 * elegida y cambia mientras gira, con un tic al pasar cada una. Tocar una opción la lleva al
 * centro. Las de los bordes se achican, se apagan y se inclinan, como en un cilindro.
 */
export function WheelPicker({
  label,
  options,
  value,
  onChange,
  format,
  width = 72,
}: WheelPickerProps) {
  const scrollRef = useRef<Animated.ScrollView>(null);
  const index = Math.max(0, options.indexOf(value));
  const scrollY = useSharedValue(index * WHEEL_ITEM_HEIGHT);
  // La última opción que pasó por el centro; el tic y el cambio salen de aquí.
  const centered = useSharedValue(index);
  const lastIndex = options.length - 1;

  function select(nextIndex: number) {
    const option = options[nextIndex];
    if (option === undefined) return;
    selectionFeedback();
    onChange(option);
  }

  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
    const next = Math.min(
      lastIndex,
      Math.max(0, Math.round(event.contentOffset.y / WHEEL_ITEM_HEIGHT)),
    );
    if (next !== centered.get()) {
      centered.set(next);
      scheduleOnRN(select, next);
    }
  });

  function scrollToIndex(target: number, animated: boolean) {
    scrollRef.current?.scrollTo({ y: target * WHEEL_ITEM_HEIGHT, animated });
  }

  // Un cambio que no vino de girar la rueda (una hora rápida) la lleva a su lugar.
  useEffect(() => {
    if (index !== centered.get()) scrollToIndex(index, true);
  }, [index, centered]);

  return (
    <View
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={label}
      accessibilityValue={{ text: format(value) }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={(event) => {
        const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;
        const target = Math.min(lastIndex, Math.max(0, index + step));
        scrollToIndex(target, true);
      }}
      style={{ width, height: WHEEL_ITEM_HEIGHT * WHEEL_VISIBLE_ITEMS }}
    >
      <Animated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_HEIGHT}
        decelerationRate="fast"
        onLayout={() => scrollToIndex(index, false)}
        style={isWeb ? WEB_SNAP_CONTAINER : undefined}
        contentContainerStyle={{ paddingVertical: SIDE_PADDING }}
      >
        {options.map((option, optionIndex) => (
          <WheelItem
            key={option}
            label={format(option)}
            index={optionIndex}
            scrollY={scrollY}
            onPress={() => scrollToIndex(optionIndex, true)}
          />
        ))}
      </Animated.ScrollView>
    </View>
  );
}

function WheelItem({
  label,
  index,
  scrollY,
  onPress,
}: {
  label: string;
  index: number;
  scrollY: SharedValue<number>;
  onPress: () => void;
}) {
  const style = useAnimatedStyle(() => {
    // Distancia al centro, en opciones: 0 en el medio, 2 en el borde.
    const distance = (index * WHEEL_ITEM_HEIGHT - scrollY.get()) / WHEEL_ITEM_HEIGHT;
    const away = Math.abs(distance);
    return {
      opacity: interpolate(away, [0, 1, 2.5], [1, 0.45, 0.15], 'clamp'),
      transform: [
        { perspective: 400 },
        { rotateX: `${interpolate(distance, [-2.5, 0, 2.5], [50, 0, -50], 'clamp')}deg` },
        { scale: interpolate(away, [0, 2], [1, 0.82], 'clamp') },
      ],
    };
  });

  return (
    <Pressable
      importantForAccessibility="no"
      accessibilityElementsHidden
      tabIndex={-1}
      onPress={onPress}
      style={[{ height: WHEEL_ITEM_HEIGHT }, isWeb ? WEB_SNAP_ITEM : undefined]}
    >
      <Animated.View style={[{ flex: 1, alignItems: 'center', justifyContent: 'center' }, style]}>
        <Text className="font-heading text-heading-lg text-ink">{label}</Text>
      </Animated.View>
    </Pressable>
  );
}
