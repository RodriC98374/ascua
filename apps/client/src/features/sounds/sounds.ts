// Sonidos que acompañan a las vibraciones en los momentos de logro (generados con
// `scripts/generate-sounds.mjs`). Un reproductor por sonido, creado una vez y vivo mientras dure la
// app: son cuatro y pesan poco. Suenan con el volumen multimedia y se mezclan con la música de
// otras apps. Nunca bloquean ni fallan: si algo sale mal, la app sigue en silencio.
import { createAudioPlayer, type AudioPlayer, type AudioSource } from 'expo-audio';

export type SoundName = 'tick' | 'streak' | 'milestone' | 'chime';

const SOURCES: Record<SoundName, AudioSource> = {
  /** Marcar un hábito. */
  tick: require('@/assets/sounds/tick.wav'),
  /** Racha asegurada. */
  streak: require('@/assets/sounds/streak.wav'),
  /** Insignia de hito (7, 30, 100, 365 días). */
  milestone: require('@/assets/sounds/milestone.wav'),
  /** Día perfecto y recompensa canjeada. */
  chime: require('@/assets/sounds/chime.wav'),
};

const players = new Map<SoundName, AudioPlayer>();
/** Lo decide la preferencia de Ajustes (`SoundsProvider`); hasta leerla, silencio. */
let isEnabled = false;

function playerFor(name: SoundName): AudioPlayer | null {
  const existing = players.get(name);
  if (existing) return existing;
  try {
    const player = createAudioPlayer(SOURCES[name]);
    players.set(name, player);
    return player;
  } catch {
    return null;
  }
}

/** Al encenderlos se cargan todos, para que el primer "tic" no llegue tarde. */
export function setSoundsEnabled(enabled: boolean) {
  isEnabled = enabled;
  if (!enabled) return;
  for (const name of Object.keys(SOURCES) as SoundName[]) playerFor(name);
}

/** Suena desde el principio, aunque el mismo sonido siga sonando (marcar varios seguidos). */
export function playSound(name: SoundName) {
  if (!isEnabled) return;
  const player = playerFor(name);
  if (!player) return;
  player
    .seekTo(0)
    .then(() => player.play())
    .catch(() => {});
}
