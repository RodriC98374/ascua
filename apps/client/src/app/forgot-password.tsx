import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { passwordResetErrorMessage } from '@/features/auth/auth-errors';
import { sendPasswordReset } from '@/features/auth/session';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const [email, setEmail] = useState(params.email ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);
  const [isSent, setIsSent] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSending(true);
    try {
      await sendPasswordReset(email);
      setIsSent(true);
    } catch (resetError) {
      const message = passwordResetErrorMessage(resetError);
      if (message) setError(message);
      else setIsSent(true);
    } finally {
      setIsSending(false);
    }
  }

  function backToSignIn() {
    if (router.canGoBack()) router.back();
    else router.replace('/sign-in');
  }

  if (isSent) {
    return (
      <Screen centered>
        <View className="gap-8">
          <View className="gap-2">
            <Text className="font-heading text-heading-lg text-ink">Revisa tu correo</Text>
            <Text className="font-body text-body text-ink-muted">
              Si {email.trim()} es el correo de tu cuenta, en unos minutos te llegará un enlace para
              crear una contraseña nueva. Revisa también la carpeta de spam.
            </Text>
          </View>
          <Button label="Volver a iniciar sesión" onPress={backToSignIn} />
        </View>
      </Screen>
    );
  }

  return (
    <Screen centered>
      <View className="gap-8">
        <View className="gap-2">
          <Text className="font-heading text-heading-lg text-ink">Recupera tu contraseña</Text>
          <Text className="font-body text-body text-ink-muted">
            Te enviaremos un enlace a tu correo para que crees una nueva.
          </Text>
        </View>

        <View className="gap-4">
          <TextField
            label="Correo"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="username"
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />
          {error && (
            <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
              {error}
            </Text>
          )}
        </View>

        <View className="gap-2">
          <Button
            label="Enviar enlace"
            onPress={handleSubmit}
            isLoading={isSending}
            isDisabled={email.trim() === ''}
          />
          <Button label="Volver" variant="link" onPress={backToSignIn} />
        </View>
      </View>
    </Screen>
  );
}
