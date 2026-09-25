// Genera los sonidos de Ascua sintetizándolos (sin muestras de terceros, así que no hay licencias
// que revisar) como WAV mono de 16 bits en assets/sounds. El resultado es siempre el mismo: no usa
// azar. Uso, desde apps/client:
//   node scripts/generate-sounds.mjs            todos
//   ONLY=tick node scripts/generate-sounds.mjs
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), '../assets/sounds');
const SAMPLE_RATE = 44100;
/** Fundido al final para que el corte no haga clic. */
const FADE_OUT_SECONDS = 0.02;

// Notas en Hz (afinación de 440).
const C4 = 261.63;
const C5 = 523.25;
const E5 = 659.25;
const G5 = 783.99;
const C6 = 1046.5;
const E6 = 1318.51;
const G6 = 1567.98;
const B6 = 1975.53;
const C7 = 2093.0;
const E7 = 2637.02;

function silence(seconds) {
  return new Float32Array(Math.round(seconds * SAMPLE_RATE));
}

/**
 * Una nota de campanita suave (tipo celesta): fundamental y dos armónicos que se apagan antes,
 * con un ataque corto. `decay` es la constante de tiempo del apagado, en segundos.
 */
function bell(buffer, { at, freq, gain = 1, decay = 0.4, attack = 0.004, vibrato = 0 }) {
  const partials = [
    { ratio: 1, gain: 1, decay: 1 },
    { ratio: 2, gain: 0.22, decay: 0.55 },
    { ratio: 3, gain: 0.07, decay: 0.35 },
  ];
  const start = Math.round(at * SAMPLE_RATE);
  const length = Math.min(buffer.length - start, Math.round(decay * 7 * SAMPLE_RATE));
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const attackEnvelope = Math.min(1, t / attack);
    // Un leve temblor en las notas largas les da vida sin que se note como efecto.
    const wobble = 1 + vibrato * Math.sin(2 * Math.PI * 5.5 * t);
    let sample = 0;
    for (const partial of partials) {
      const envelope = Math.exp(-t / (decay * partial.decay));
      sample += partial.gain * envelope * Math.sin(2 * Math.PI * freq * partial.ratio * wobble * t);
    }
    buffer[start + i] += gain * attackEnvelope * sample;
  }
}

/** Deja el pico en `peak` (0–1) y funde el final. */
function finish(buffer, peak) {
  const max = buffer.reduce((current, sample) => Math.max(current, Math.abs(sample)), 0);
  const scale = max === 0 ? 0 : peak / max;
  const fadeSamples = Math.round(FADE_OUT_SECONDS * SAMPLE_RATE);
  return buffer.map((sample, index) => {
    const fromEnd = buffer.length - 1 - index;
    return sample * scale * Math.min(1, fromEnd / fadeSamples);
  });
}

const SOUNDS = {
  /** Marcar un hábito: un "tic" corto y cálido que no cansa aunque se marquen diez seguidos. */
  tick() {
    const buffer = silence(0.14);
    for (let i = 0; i < buffer.length; i++) {
      const t = i / SAMPLE_RATE;
      const attack = Math.min(1, t / 0.0015);
      // El cuerpo baja un poco de tono al sonar, como un golpecito sobre madera.
      const bodyFreq = 1250 * (1 + 0.35 * Math.exp(-t / 0.012));
      const body = Math.exp(-t / 0.028) * Math.sin(2 * Math.PI * bodyFreq * t);
      const click = 0.35 * Math.exp(-t / 0.005) * Math.sin(2 * Math.PI * 3400 * t);
      buffer[i] = attack * (body + click);
    }
    return finish(buffer, 0.5);
  },

  /** Racha asegurada: un arpegio que sube y se queda sonando sobre el acorde. */
  streak() {
    const buffer = silence(1.5);
    const step = 0.085;
    [G5, C6, E6].forEach((freq, index) => bell(buffer, { at: index * step, freq, decay: 0.3 }));
    const last = 3 * step;
    bell(buffer, { at: last, freq: G6, decay: 0.55, vibrato: 0.002 });
    for (const freq of [C5, E5, G5]) bell(buffer, { at: last, freq, gain: 0.35, decay: 0.6 });
    return finish(buffer, 0.7);
  },

  /** Insignia de hito: una escalera más larga y un acorde más lleno, con un bajo cálido. */
  milestone() {
    const buffer = silence(2.4);
    const step = 0.065;
    [C5, E5, G5, C6, E6, G6].forEach((freq, index) =>
      bell(buffer, { at: index * step, freq, gain: 0.85, decay: 0.28 }),
    );
    const last = 6 * step;
    bell(buffer, { at: last, freq: C7, decay: 0.8, vibrato: 0.003 });
    for (const freq of [C6, E6, G6]) {
      bell(buffer, { at: last, freq, gain: 0.45, decay: 0.85, vibrato: 0.002 });
    }
    bell(buffer, { at: last, freq: C4, gain: 0.55, decay: 1, attack: 0.02 });
    return finish(buffer, 0.72);
  },

  /** Día perfecto y canje: dos notas brillantes y un destello. */
  chime() {
    const buffer = silence(0.9);
    bell(buffer, { at: 0, freq: E6, decay: 0.25 });
    bell(buffer, { at: 0.1, freq: B6, decay: 0.32 });
    bell(buffer, { at: 0.1, freq: E7, gain: 0.25, decay: 0.12 });
    return finish(buffer, 0.6);
  },
};

function toWav(samples) {
  const dataBytes = samples.length * 2;
  const wav = Buffer.alloc(44 + dataBytes);
  wav.write('RIFF', 0);
  wav.writeUInt32LE(36 + dataBytes, 4);
  wav.write('WAVE', 8);
  wav.write('fmt ', 12);
  wav.writeUInt32LE(16, 16); // tamaño del bloque fmt
  wav.writeUInt16LE(1, 20); // PCM
  wav.writeUInt16LE(1, 22); // mono
  wav.writeUInt32LE(SAMPLE_RATE, 24);
  wav.writeUInt32LE(SAMPLE_RATE * 2, 28); // bytes por segundo
  wav.writeUInt16LE(2, 32); // bytes por muestra
  wav.writeUInt16LE(16, 34); // bits por muestra
  wav.write('data', 36);
  wav.writeUInt32LE(dataBytes, 40);
  samples.forEach((sample, index) => {
    const clamped = Math.max(-1, Math.min(1, sample));
    wav.writeInt16LE(Math.round(clamped * 32767), 44 + index * 2);
  });
  return wav;
}

mkdirSync(OUT, { recursive: true });
const only = process.env.ONLY;
for (const [name, render] of Object.entries(SOUNDS)) {
  if (only && only !== name) continue;
  const wav = toWav(render());
  writeFileSync(join(OUT, `${name}.wav`), wav);
  console.log(`${name}.wav · ${(wav.length / 1024).toFixed(0)} KB`);
}
