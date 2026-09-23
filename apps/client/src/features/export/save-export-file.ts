// Android: escribe el archivo en la caché y abre la hoja de compartir del sistema, desde donde se
// guarda en el celular, en Drive o se envía. La web usa `save-export-file.web.ts`.
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

import type { ExportFile } from '@/data/export-files';

export const SAVE_ACTION_LABEL = 'Compartir';

export async function saveExportFile({ name, mimeType, content }: ExportFile): Promise<void> {
  const file = new File(Paths.cache, name);
  file.create({ overwrite: true });
  file.write(content);
  await Sharing.shareAsync(file.uri, { mimeType, dialogTitle: name });
}
