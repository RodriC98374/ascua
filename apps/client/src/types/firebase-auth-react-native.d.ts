// Firebase exporta getReactNativePersistence en su bundle de React Native (el que usa Metro en Android),
// pero los tipos públicos de 'firebase/auth' no lo declaran. Firma copiada de
// @firebase/auth/dist/rn/src/platform_react_native/persistence/react_native.d.ts.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  interface ReactNativeAsyncStorage {
    setItem(key: string, value: string): Promise<void>;
    getItem(key: string): Promise<string | null>;
    removeItem(key: string): Promise<void>;
  }

  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
