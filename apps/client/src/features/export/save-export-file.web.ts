// Web: descarga el archivo con un enlace temporal. Misma API que la versión de Android.
import type { ExportFile } from '@/data/export-files';

export const SAVE_ACTION_LABEL = 'Descargar';

export async function saveExportFile({ name, mimeType, content }: ExportFile): Promise<void> {
  const url = URL.createObjectURL(new Blob([content], { type: `${mimeType};charset=utf-8` }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  // El navegador necesita un momento para empezar la descarga antes de liberar el enlace.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
