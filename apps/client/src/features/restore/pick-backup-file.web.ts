// Web: el selector de archivos del navegador. El texto se lee del `File` que devuelve.
import * as DocumentPicker from 'expo-document-picker';

import { BACKUP_MAX_BYTES, type PickedBackup } from './picked-backup';

/** El archivo elegido, o null si el usuario cerró el selector. */
export async function pickBackupFile(): Promise<PickedBackup | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: 'application/json',
    base64: false,
  });
  if (result.canceled) return null;
  const [asset] = result.assets;
  if (!asset?.file) return null;
  if (asset.file.size > BACKUP_MAX_BYTES) return { name: asset.name, text: null };
  return { name: asset.name, text: await asset.file.text() };
}
