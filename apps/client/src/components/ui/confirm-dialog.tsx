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
  /** danger: acciones que no se deshacen (archivar). primary: acciones positivas (comprar). */
  confirmVariant?: 'danger' | 'primary';
  isConfirming?: boolean;
  /** Error del último intento, bajo el mensaje. */
  error?: string | null;
}

/** Modal centrado para confirmar una acción. Tocar fuera cancela (salvo mientras confirma). */
export function ConfirmDialog({
  isVisible,
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
  confirmVariant = 'danger',
  isConfirming = false,
  error,
}: ConfirmDialogProps) {
  const cancel = () => {
    if (!isConfirming) onCancel();
  };
  return (
    <Modal
      transparent
      visible={isVisible}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={cancel}
    >
      <View className="flex-1 items-center justify-center px-4">
        <Pressable
          accessibilityLabel="Cancelar"
          onPress={cancel}
          style={{ position: 'absolute', inset: 0, backgroundColor: colors.scrim }}
        />
        <View accessibilityViewIsModal className="w-full max-w-sm">
          <Card className="gap-4">
            <View className="gap-2">
              <Text accessibilityRole="header" className="font-heading text-heading-md text-ink">
                {title}
              </Text>
              <Text className="font-body text-body text-ink-muted">{message}</Text>
              {error && (
                <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
                  {error}
                </Text>
              )}
            </View>
            <View className="flex-row gap-2">
              <View className="flex-1">
                <Button
                  label="Cancelar"
                  variant="secondary"
                  isDisabled={isConfirming}
                  onPress={cancel}
                />
              </View>
              <View className="flex-1">
                <Button
                  label={confirmLabel}
                  variant={confirmVariant}
                  isLoading={isConfirming}
                  onPress={onConfirm}
                />
              </View>
            </View>
          </Card>
        </View>
      </View>
    </Modal>
  );
}
