// Android: elige el archivo con el selector del sistema y lo lee desde la caché de la app. La web
// usa `pick-backup-file.web.ts`.
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';

import { BACKUP_MAX_BYTES, type PickedBackup } from './picked-backup';

/** El archivo elegido, o null si el usuario cerró el selector. */
export async function pickBackupFile(): Promise<PickedBackup | null> {
  // Los administradores de archivos de Android no siempre reconocen el JSON: se acepta cualquiera
  // y `readBackup` decide si es un respaldo.
  const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
  if (result.canceled) return null;
  const [asset] = result.assets;
  if (!asset) return null;
  if ((asset.size ?? 0) > BACKUP_MAX_BYTES) return { name: asset.name, text: null };
  return { name: asset.name, text: await new File(asset.uri).text() };
}
