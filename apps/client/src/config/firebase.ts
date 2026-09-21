import type { FirebaseOptions } from 'firebase/app';

// Configuración pública de la app web de Firebase: no es secreta (viaja dentro de la app).
// La protección de los datos la dan el login y las reglas de Firestore.
export const firebaseConfig: FirebaseOptions = {
  apiKey: 'AIzaSyCwwjvlfDaSgY82je21xvWw3mfMQfhOqvA',
  authDomain: 'ascua-a9e27.firebaseapp.com',
  projectId: 'ascua-a9e27',
  storageBucket: 'ascua-a9e27.firebasestorage.app',
  messagingSenderId: '252479229940',
  appId: '1:252479229940:web:ec43af2170b57ae338f3a1',
};

/**
 * En desarrollo, `EXPO_PUBLIC_USE_EMULATORS=true` conecta la app a los emuladores locales.
 * En un celular físico, `EXPO_PUBLIC_EMULATOR_HOST` debe ser la IP de la PC en la red local.
 */
export const emulatorConfig = {
  enabled: __DEV__ && process.env.EXPO_PUBLIC_USE_EMULATORS === 'true',
  host: process.env.EXPO_PUBLIC_EMULATOR_HOST ?? 'localhost',
  authPort: 9099,
  firestorePort: 8080,
} as const;
