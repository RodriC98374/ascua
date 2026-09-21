// Inicialización de Firebase para la web. La versión Android está en firebase.ts.
import { initializeApp } from 'firebase/app';
import { browserLocalPersistence, connectAuthEmulator, initializeAuth } from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

import { emulatorConfig, firebaseConfig } from '@/config/firebase';

export const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, { persistence: browserLocalPersistence });

// Caché persistente en IndexedDB: la app abre rápido y funciona sin conexión, incluso con varias pestañas.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (emulatorConfig.enabled) {
  connectAuthEmulator(auth, `http://${emulatorConfig.host}:${emulatorConfig.authPort}`);
  connectFirestoreEmulator(db, emulatorConfig.host, emulatorConfig.firestorePort);
}
