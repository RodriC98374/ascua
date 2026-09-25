// Preferencia de sonidos de Ajustes. Se guarda en cada dispositivo (no en Firestore), como el tema:
// el celular puede sonar y la PC de la oficina quedarse en silencio.

/** Clave en el almacenamiento del dispositivo (AsyncStorage; en web, localStorage). */
export const SOUNDS_STORAGE_KEY = 'ascua.sounds';

type StoredSounds = 'on' | 'off';

/**
 * Lo guardado, o el valor por defecto de la plataforma si no hay nada o trae algo raro:
 * encendidos en el celular y apagados en web.
 */
export function parseSoundsEnabled(value: unknown, platform: string): boolean {
  if (value === 'on') return true;
  if (value === 'off') return false;
  return platform !== 'web';
}

export function serializeSoundsEnabled(isEnabled: boolean): StoredSounds {
  return isEnabled ? 'on' : 'off';
}
