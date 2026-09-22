import type { HabitRecord } from '@ascua/shared';
import { router } from 'expo-router';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArchiveIcon, EditIcon } from '@/components/ui/icons';
import { PopoverMenu } from '@/components/ui/popover-menu';
import { useUid } from '@/features/auth/session';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { archiveHabit } from '@/operations/habits';

/** Menú de un hábito activo: editar o archivar (con confirmación). */
export function HabitActions({ habit }: { habit: HabitRecord }) {
  const uid = useUid();
  const [isConfirmingArchive, setIsConfirmingArchive] = useState(false);

  function archive() {
    setIsConfirmingArchive(false);
    // Sin esperar la escritura: sin conexión queda en cola.
    trackWrite(archiveHabit(db, uid, habit.id));
  }

  return (
    <>
      <PopoverMenu
        label={`Opciones de ${habit.name}`}
        items={[
          {
            label: 'Editar',
            Icon: EditIcon,
            onPress: () =>
              router.push({ pathname: '/habits/[habitId]', params: { habitId: habit.id } }),
          },
          {
            label: 'Archivar',
            Icon: ArchiveIcon,
            isDestructive: true,
            onPress: () => setIsConfirmingArchive(true),
          },
        ]}
      />
      <ConfirmDialog
        isVisible={isConfirmingArchive}
        title={`¿Archivar “${habit.name}”?`}
        message="Hoy todavía cuenta; desde mañana deja de aparecer. No se puede reactivar: si quieres retomarlo, crea uno nuevo. Tu historial se conserva."
        confirmLabel="Archivar"
        onConfirm={archive}
        onCancel={() => setIsConfirmingArchive(false)}
      />
    </>
  );
}
