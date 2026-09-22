import { Text } from 'react-native';

import { NoticeBar } from '@/components/ui/notice-bar';
import { dismissWriteError, useWriteError } from '@/features/sync/write-errors';

/** Aviso de una escritura rechazada. Queda visible hasta que el usuario lo cierra. */
export function WriteErrorBanner() {
  const error = useWriteError();
  if (!error) return null;
  return (
    <NoticeBar tone="error" isAlert action={{ label: 'Entendido', onPress: dismissWriteError }}>
      <Text className="font-body-bold text-caption text-error">{error}</Text>
    </NoticeBar>
  );
}
