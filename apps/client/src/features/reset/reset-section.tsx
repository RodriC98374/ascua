import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { BottomSheet } from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TextField } from '@/components/ui/text-field';
import { useSession, useUid } from '@/features/auth/session';
import { db } from '@/lib/firebase';
import { resetAccount } from '@/operations/reset-account';

import { isResetConfirmed, RESET_CONFIRMATION_WORD } from './reset-confirmation';

/**
 * Reiniciar la cuenta (fase 22, D30): borra todo lo guardado y la deja como nueva. Sirve para
 * empezar de cero sin pasar por la consola. Va al final de Ajustes, lejos de lo que se toca a diario.
 */
export function ResetSection() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Empezar de cero</Text>
        <Text className="font-body text-body text-ink-muted">
          Borra tus hábitos, recompensas, tareas, metas, puntos, racha e historial, y deja la cuenta
          como nueva. No se puede deshacer.
        </Text>
      </View>
      <Card className="gap-3">
        <Text className="font-body text-caption text-ink-muted">
          Antes de reiniciar, guarda un respaldo completo en “Tus datos”, más arriba.
        </Text>
        <Button label="Reiniciar mi cuenta" variant="danger" onPress={() => setIsOpen(true)} />
      </Card>
      {isOpen && <ResetSheet onClose={() => setIsOpen(false)} />}
    </View>
  );
}

/** Se monta al abrirse: cada apertura empieza con el campo vacío. */
function ResetSheet({ onClose }: { onClose: () => void }) {
  const uid = useUid();
  const { user } = useSession();
  const [text, setText] = useState('');
  const [isResetting, setIsResetting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function reset() {
    if (!user?.email) return;
    setIsResetting(true);
    setError(null);
    try {
      await resetAccount(db, { uid, email: user.email });
      onClose();
      router.replace('/');
    } catch (resetError) {
      console.error('No se pudo reiniciar la cuenta', resetError);
      setError(
        'No se pudo reiniciar. Revisa tu conexión y vuelve a intentarlo; si quedó algo a medias, toca el botón otra vez.',
      );
    } finally {
      setIsResetting(false);
    }
  }

  return (
    <BottomSheet
      isOpen
      title="Reiniciar mi cuenta"
      subtitle="Se borran todos tus datos y la cuenta vuelve a empezar en cero. Tu correo y tu contraseña no cambian."
      onClose={() => {
        if (!isResetting) onClose();
      }}
    >
      <View className="gap-4">
        <Text className="font-body text-body text-ink-muted">
          Se van los hábitos, recompensas, tareas, metas, puntos, protectores, racha e historial.
          Los avisos y el presupuesto vuelven a sus valores de fábrica.
        </Text>
        <TextField
          label={`Escribe ${RESET_CONFIRMATION_WORD} para confirmar`}
          value={text}
          onChangeText={setText}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={RESET_CONFIRMATION_WORD}
          error={error}
        />
        <Button
          label="Borrar todo y empezar de cero"
          variant="danger"
          isLoading={isResetting}
          isDisabled={!isResetConfirmed(text)}
          onPress={reset}
        />
        <Button label="Cancelar" variant="secondary" isDisabled={isResetting} onPress={onClose} />
      </View>
    </BottomSheet>
  );
}
