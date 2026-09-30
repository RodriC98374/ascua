/**
 * Un respaldo de años pesa unos cientos de KB (el historial va día por día). Por encima de esto no
 * es un respaldo de Ascua y no vale la pena leerlo entero en memoria.
 */
export const BACKUP_MAX_BYTES = 10 * 1024 * 1024;

export interface PickedBackup {
  name: string;
  /** El contenido; null si el archivo pasa de `BACKUP_MAX_BYTES`. */
  text: string | null;
}
