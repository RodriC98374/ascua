import { ActivityIndicator, Text } from 'react-native';

import { EmberIcon } from '@/components/ui/icons';
import { NoticeBar } from '@/components/ui/notice-bar';
import { useThemeColors } from '@/theme/colors';

import { useClosePendingDays } from './use-close-pending-days';

const ERROR_MESSAGES = {
  rejected:
    'No pudimos cerrar tus días: la fecha u hora de tu dispositivo no coincide con la real. Corrígela y vuelve a intentarlo.',
  unknown: 'No pudimos actualizar tus días. Vuelve a intentarlo.',
};

/** Estado del cierre de días pendientes: mientras cierra, qué se acreditó, o el error. */
export function DayClosingBanner() {
  const colors = useThemeColors();
  const { state, retry, dismiss } = useClosePendingDays();

  switch (state.status) {
    case 'idle':
      return null;
    case 'closing':
      return (
        <NoticeBar leading={<ActivityIndicator size="small" color={colors.emberStrong} />}>
          <Text className="font-body-bold text-caption text-ink-muted">Actualizando tus días…</Text>
        </NoticeBar>
      );
    case 'done':
      return (
        <NoticeBar
          leading={<EmberIcon size={22} color={colors.emberStrong} />}
          action={{ label: 'Entendido', onPress: dismiss }}
        >
          <Text className="font-heading text-heading-sm text-ink">{state.summary.title}</Text>
          {state.summary.details.map((detail) => (
            <Text key={detail} className="font-body-semibold text-caption text-ink-muted">
              {detail}
            </Text>
          ))}
        </NoticeBar>
      );
    case 'error':
      return (
        <NoticeBar tone="error" isAlert action={{ label: 'Reintentar', onPress: retry }}>
          <Text className="font-body-bold text-caption text-error">
            {ERROR_MESSAGES[state.kind]}
          </Text>
        </NoticeBar>
      );
  }
}
