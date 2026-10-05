import type { ExportKind } from '@ascua/shared';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ChevronIcon } from '@/components/ui/icons';
import { buildExportFile } from '@/data/export-files';
import { useUid } from '@/features/auth/session';
import { db } from '@/lib/firebase';
import { useThemeColors } from '@/theme/colors';

import { SAVE_ACTION_LABEL, saveExportFile } from './save-export-file';

const OPTIONS: readonly { kind: ExportKind; title: string; hint: string }[] = [
  { kind: 'backup', title: 'Respaldo completo', hint: 'Todos tus datos en un archivo JSON' },
  {
    kind: 'habit_days',
    title: 'Hábitos por día',
    hint: 'CSV con una fila por día y una columna por hábito',
  },
  {
    kind: 'point_transactions',
    title: 'Movimientos de puntos',
    hint: 'CSV con cada punto ganado y gastado',
  },
];

/** Exportación de los datos del usuario (fase 10): respaldo JSON y CSV para hojas de cálculo. */
export function ExportSection() {
  const colors = useThemeColors();
  const uid = useUid();
  const [busyKind, setBusyKind] = useState<ExportKind | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function exportKind(kind: ExportKind) {
    setBusyKind(kind);
    setError(null);
    try {
      await saveExportFile(await buildExportFile(db, uid, kind));
    } catch (exportError) {
      console.error('No se pudo exportar', exportError);
      setError('No se pudo exportar. Revisa tu conexión y vuelve a intentarlo.');
    } finally {
      setBusyKind(null);
    }
  }

  return (
    <View className="gap-3">
      <View className="gap-1">
        <Text className="font-heading text-heading-md text-ink">Tus datos</Text>
        <Text className="font-body text-body text-ink-muted">
          Guarda una copia cuando quieras y recupérala desde aquí. Los CSV se abren en Excel o
          Google Sheets.
        </Text>
      </View>
      <Card className="py-1">
        {OPTIONS.map((option, index) => {
          const isBusy = busyKind === option.kind;
          return (
            <View
              key={option.kind}
              className={`min-h-12 flex-row items-center gap-3 py-2 ${index > 0 ? 'border-border border-t' : ''}`}
            >
              <View className="flex-1 gap-0.5">
                <Text className="font-body-bold text-body text-ink">{option.title}</Text>
                <Text className="font-body text-caption text-ink-muted">{option.hint}</Text>
              </View>
              <Button
                label={SAVE_ACTION_LABEL}
                variant="secondary"
                accessibilityLabel={`${SAVE_ACTION_LABEL} ${option.title.toLowerCase()}`}
                isLoading={isBusy}
                isDisabled={busyKind !== null}
                onPress={() => exportKind(option.kind)}
              />
            </View>
          );
        })}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/ajustes/restaurar')}
          className="border-border min-h-12 flex-row items-center gap-3 border-t py-2 active:opacity-85"
        >
          <View className="flex-1 gap-0.5">
            <Text className="font-body-bold text-body text-ink">Restaurar desde un respaldo</Text>
            <Text className="font-body text-caption text-ink-muted">
              Recupera hábitos, recompensas, tareas y metas de un archivo JSON
            </Text>
          </View>
          <ChevronIcon direction="right" size={18} color={colors.inkMuted} />
        </Pressable>
      </Card>
      {error && (
        <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
          {error}
        </Text>
      )}
    </View>
  );
}
