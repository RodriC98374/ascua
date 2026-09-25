import { addDays, type DateKey, type TaskRecord } from '@ascua/shared';
import { router } from 'expo-router';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { ArrowIcon, EditIcon, TrashIcon } from '@/components/ui/icons';
import { PopoverMenu, type MenuItem } from '@/components/ui/popover-menu';
import { useUid } from '@/features/auth/session';
import { trackWrite } from '@/features/sync/write-errors';
import { db } from '@/lib/firebase';
import { deleteTask, moveTask } from '@/operations/tasks';

function ArrowRightIcon(props: { size?: number; color: string }) {
  return <ArrowIcon {...props} direction="right" />;
}

/** Menú de una tarea de Hoy: editar, pasarla a mañana (si está pendiente) o borrarla. */
export function TaskActions({ task, today }: { task: TaskRecord; today: DateKey }) {
  const uid = useUid();
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const isPending = task.completedDateKey === null;

  function remove() {
    setIsConfirmingDelete(false);
    // Sin esperar la escritura: sin conexión queda en cola.
    trackWrite(deleteTask(db, uid, task.id));
  }

  const items: MenuItem[] = [
    {
      label: 'Editar',
      Icon: EditIcon,
      onPress: () => router.push({ pathname: '/tasks/[taskId]', params: { taskId: task.id } }),
    },
    ...(isPending
      ? [
          {
            label: 'Mover a mañana',
            Icon: ArrowRightIcon,
            onPress: () => trackWrite(moveTask(db, uid, task.id, addDays(today, 1))),
          },
        ]
      : []),
    {
      label: 'Borrar',
      Icon: TrashIcon,
      isDestructive: true,
      onPress: () => setIsConfirmingDelete(true),
    },
  ];

  return (
    <>
      <PopoverMenu label={`Opciones de ${task.title}`} items={items} />
      <ConfirmDialog
        isVisible={isConfirmingDelete}
        title={`¿Borrar “${task.title}”?`}
        message={
          isPending
            ? 'Desaparece de tus tareas. No se puede deshacer.'
            : 'La cumpliste hoy: al borrarla, sus puntos ya no se suman al cerrar el día.'
        }
        confirmLabel="Borrar"
        onConfirm={remove}
        onCancel={() => setIsConfirmingDelete(false)}
      />
    </>
  );
}
