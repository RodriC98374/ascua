import type { ReminderSettings } from '@ascua/shared';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { TimeField } from '@/components/ui/time-field';
import { Toggle } from '@/components/ui/toggle';
import { useUserProfile } from '@/data/hooks';
import { useUid } from '@/features/auth/session';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { updateReminderSettings } from '@/operations/profile';

import { useReminders } from './reminders-provider';

/**
 * Horarios de los recordatorios (se guardan en el perfil, editables desde cualquier dispositivo) y,
 * en Android, el permiso de notificaciones: se pide aquí, explicado, y no al abrir la app.
 */
export function ReminderSettingsSection() {
  const uid = useUid();
  const profile = useUserProfile(uid);
  const { permission } = useReminders();
  const settings = profile.data?.reminderSettings;
  if (!settings) return null;

  const save = (changes: Partial<ReminderSettings>) =>
    trackWrite(updateReminderSettings(db, uid, { ...settings, ...changes }));
  const isWeb = permission === 'unsupported';

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Recordatorios</Text>
        <Text className="font-body text-body text-ink-muted">
          {isWeb
            ? 'Los avisos llegan a tu celular Android. Desde aquí puedes cambiar los horarios.'
            : 'Te avisamos en este celular a la hora de Bolivia, aunque la app esté cerrada.'}
        </Text>
      </View>
      <Card className="py-1">
        <View className="min-h-12 flex-row items-center gap-3 py-2">
          <Text className="font-body-bold text-body text-ink flex-1">Recordatorios activos</Text>
          <Toggle
            accessibilityLabel="Recordatorios activos"
            value={settings.enabled}
            onChange={(enabled) => save({ enabled })}
          />
        </View>
        <View className="border-border border-t">
          <TimeField
            label="Recordatorio diario"
            hint="Todos los días"
            value={settings.dailyReminderTime}
            onChange={(dailyReminderTime) => save({ dailyReminderTime })}
            isDisabled={!settings.enabled}
          />
        </View>
        <View className="border-border border-t">
          <TimeField
            label="Racha en riesgo"
            hint="Solo si aún no cumpliste la meta del día"
            value={settings.streakRiskReminderTime}
            onChange={(streakRiskReminderTime) => save({ streakRiskReminderTime })}
            isDisabled={!settings.enabled}
          />
        </View>
      </Card>
      {settings.enabled && !isWeb && <PermissionNotice />}
    </View>
  );
}

function PermissionNotice() {
  const { permission, requestPermission, openDeviceSettings } = useReminders();
  const [isRequesting, setIsRequesting] = useState(false);

  if (permission === 'granted') {
    return (
      <Text className="font-body text-caption text-ink-muted">
        Si algún aviso llega tarde, quita a Ascua del ahorro de batería en los ajustes del celular.
      </Text>
    );
  }
  if (permission === null) return null;

  const isBlocked = permission === 'blocked';
  async function request() {
    setIsRequesting(true);
    try {
      await requestPermission();
    } catch (error) {
      console.error('No se pudo pedir el permiso de avisos', error);
    } finally {
      setIsRequesting(false);
    }
  }

  return (
    <Card className="gap-3">
      <Text className="font-body text-body text-ink">
        {isBlocked
          ? 'Las notificaciones de Ascua están bloqueadas en este celular. Actívalas en los ajustes del sistema para recibir tus recordatorios.'
          : 'Para que tus recordatorios lleguen, permite que Ascua te envíe notificaciones.'}
      </Text>
      <Button
        label={isBlocked ? 'Abrir ajustes del celular' : 'Permitir notificaciones'}
        variant="secondary"
        isLoading={isRequesting}
        onPress={isBlocked ? openDeviceSettings : request}
      />
    </Card>
  );
}
