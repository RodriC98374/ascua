import { Modal, Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { colors } from '@/theme/colors';

interface ConfirmDialogProps {
  isVisible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Modal centrado para confirmar una acción que no se puede deshacer. Tocar fuera cancela. */
export function ConfirmDialog({
  isVisible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
    >
      <View className="flex-1 items-center justify-center px-4">
        <Pressable
          accessibilityLabel="Cancelar"
          onPress={onCancel}
          style={{ position: 'absolute', inset: 0, backgroundColor: colors.scrim }}
        />
        <View accessibilityViewIsModal className="w-full max-w-sm">
          <Card className="gap-4">
            <View className="gap-2">
              <Text accessibilityRole="header" className="font-heading text-heading-md text-ink">
                {title}
              </Text>
              <Text className="font-body text-body text-ink-muted">{message}</Text>
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button label="Cancelar" variant="secondary" onPress={onCancel} />
              </View>
              <View className="flex-1">
                <Button label={confirmLabel} variant="danger" onPress={onConfirm} />
              </View>
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  );
}
