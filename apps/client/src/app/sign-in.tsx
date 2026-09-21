import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Screen } from '@/components/ui/screen';
import { TextField } from '@/components/ui/text-field';
import { signInErrorMessage } from '@/features/auth/auth-errors';
import { signIn } from '@/features/auth/session';

export default function SignInScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    setError(null);
    setIsSubmitting(true);
    try {
      // Al iniciar sesión, las rutas protegidas del layout llevan solas a la app.
      await signIn(email, password);
    } catch (signInError) {
      setError(signInErrorMessage(signInError));
      setIsSubmitting(false);
    }
  }

  return (
    <Screen centered>
      <View className="gap-8">
        <View className="gap-1">
          <Text className="font-heading-extrabold text-display-md text-ember-strong">Ascua</Text>
          <Text className="font-body text-body text-ink-muted">
            Entra para seguir con tu racha.
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
            returnKeyType="next"
          />
          <TextField
            label="Contraseña"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete="current-password"
            textContentType="password"
            returnKeyType="go"
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
            label="Entrar"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            isDisabled={email.trim() === '' || password === ''}
          />
          <Button
            label="¿Olvidaste tu contraseña?"
            variant="link"
            onPress={() => router.push({ pathname: '/forgot-password', params: { email } })}
          />
        </View>
      </View>
    </Screen>
  );
}
