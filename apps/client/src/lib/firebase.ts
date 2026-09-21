// Inicialización de Firebase para Android. La versión web está en firebase.web.ts.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp } from 'firebase/app';
import { connectAuthEmulator, getReactNativePersistence, initializeAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  memoryLocalCache,
} from 'firebase/firestore';

import { emulatorConfig, firebaseConfig } from '@/config/firebase';

export const app = initializeApp(firebaseConfig);

// La sesión se guarda en AsyncStorage para sobrevivir al cierre de la app.
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage),
});
// Correos de Firebase (recuperación de contraseña) en español.
auth.languageCode = 'es';

// En React Native el SDK JS no tiene caché en disco: solo memoria (limitación aceptada, data-model §9).
export const db = initializeFirestore(app, { localCache: memoryLocalCache() });

if (emulatorConfig.enabled) {
  connectAuthEmulator(auth, `http://${emulatorConfig.host}:${emulatorConfig.authPort}`);
  connectFirestoreEmulator(db, emulatorConfig.host, emulatorConfig.firestorePort);
}
