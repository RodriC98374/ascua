import type { ExportKind } from '@ascua/shared';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';

import { Card } from '@/components/ui/card';
import { buildExportFile } from '@/data/export-files';
import { useUid } from '@/features/auth/session';
import { db } from '@/lib/firebase';
import { colors } from '@/theme/colors';

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
          Guarda una copia cuando quieras. Los CSV se abren en Excel o Google Sheets.
        </Text>
      </View>
      <Card className="py-1">
        {OPTIONS.map((option, index) => {
          const isBusy = busyKind === option.kind;
          return (
            <Pressable
              key={option.kind}
              accessibilityRole="button"
              accessibilityLabel={`${SAVE_ACTION_LABEL} ${option.title.toLowerCase()}`}
              accessibilityState={{ busy: isBusy, disabled: busyKind !== null }}
              disabled={busyKind !== null}
              onPress={() => exportKind(option.kind)}
              className={`min-h-12 flex-row items-center gap-3 py-2 ${index > 0 ? 'border-border border-t' : ''}`}
            >
              <View className="flex-1 gap-0.5">
                <Text className="font-body-bold text-body text-ink">{option.title}</Text>
                <Text className="font-body text-caption text-ink-muted">{option.hint}</Text>
              </View>
              <View className="bg-surface-300 min-w-24 items-center rounded-sm px-3 py-2">
                {isBusy ? (
                  <ActivityIndicator size="small" color={colors.emberStrong} />
                ) : (
                  <Text className="font-body-bold text-caption text-ember-strong">
                    {SAVE_ACTION_LABEL}
                  </Text>
                )}
              </View>
            </Pressable>
          );
        })}
      </Card>
      {error && (
        <Text accessibilityRole="alert" className="font-body-bold text-caption text-error">
          {error}
        </Text>
      )}
    </View>
  );
}
