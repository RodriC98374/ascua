# 00 — Fundaciones

**Objetivo:** que exista el esqueleto completo y que el ciclo "cambio → test → APK en el celular / web desplegada" funcione de punta a punta antes de escribir lógica de negocio.

## A. Pasos manuales del usuario (consola web)

Claude no puede hacerlos; los guía paso a paso en el chat. Todo en el plan **Spark** (gratis): si la consola ofrece Blaze o pide tarjeta, **rechazarlo**.

1. **Firebase:** crear el proyecto (sin Google Analytics) y pasar el `projectId`.
2. **Firestore:** crear la base en modo producción, región **`southamerica-east1`**. La región no se puede cambiar después.
3. **Authentication:** habilitar el proveedor Correo/contraseña. El registro se cierra en la fase 04.
4. **Web app:** registrar una app web en el proyecto y pasar el objeto `firebaseConfig`. No es secreto (viaja dentro de la app), así que va **versionado en el código** (`apps/client/src/config/firebase.ts`) para que funcione en cualquier máquina sin copiar archivos.
5. **Expo:** crear una cuenta gratuita en expo.dev (para EAS Build y EAS Update).

## B. Tareas

- [x] Root: `package.json` con npm workspaces (`apps/*`, `packages/*`), `.nvmrc` (22), `engines`.
- [x] `packages/shared`: paquete TypeScript que compila y se importa desde la app (Metro lo consume como código fuente, sin compilar).
- [x] `apps/client`: Expo SDK 57 (TypeScript strict) con Expo Router y soporte web. Pantalla "hola" que muestra un valor importado de `shared`.
- [x] NativeWind 4.2.7 configurado; verificado en el bundle web (clases generadas en el CSS).
- [~] **Prueba de gráficas:** `react-native-gifted-charts` compila para Android y web, y la web pre-renderizada incluye los SVG. Falta verla en el celular (APK) para registrarla como decisión.
- [x] Firebase JS SDK: persistencia por plataforma (`firebase.ts` con `AsyncStorage` para Android, `firebase.web.ts` con `browserLocalPersistence` + IndexedDB para web), verificada en ambos bundles. Conexión a emuladores con `EXPO_PUBLIC_USE_EMULATORS`.
- [x] ESLint (config de Expo) + Prettier (config en la raíz, con plugin de Tailwind).
- [x] Vitest en `packages/shared`; Jest (`jest-expo`) en `apps/client`. Un test en cada uno.
- [x] `firebase-tools` como devDependency; `firebase.json`, `.firebaserc`, `firestore.rules` (todo denegado), `firestore.indexes.json`, Hosting apuntando a `apps/client/dist`.
- [ ] Emulator Suite (Auth, Firestore) con `npm run emulators`. **Bloqueado:** requiere Java 21+ (la oficina tiene Java 11).
- [x] `eas-cli` como devDependency; `eas.json` con perfiles `development`, `preview` y `production`, todos APK.
- [x] Scripts raíz: `dev`, `android`, `web`, `build:web`, `build:apk`, `lint`, `typecheck`, `test`, `emulators`, `deploy:web`, `deploy:rules`.
- [x] Sesiones iniciadas en Firebase CLI y EAS; proyecto vinculado a EAS (`@rodric983748/ascua`, `extra.eas.projectId` en `app.json`). Firma de Android generada y guardada en los servidores de Expo.
- [x] Ver la app en desarrollo en el navegador (`npm run web`): fondo, textos y gráficas correctos (21-09-2026).
- Ver la app en el celular con **Expo Go** se movió a la fase 05: la red de la PC de la oficina no lo permitió.
- La primera APK de uso real y el primer deploy web se **movieron al hito de uso diario** (fase 06): antes no hay nada que usar. Se lanzó un build de prueba el 21-09-2026, opcional.
- [x] `CLAUDE.md`: sección de comandos con los reales, incluido cómo correr un solo test.

Notas de la implementación:
- `expo install` ignora `--dev` dentro de un workspace: los paquetes de desarrollo se mueven a mano a `devDependencies`.
- TypeScript 6 exige declarar los imports de CSS (`apps/client/css-modules.d.ts`).
- Los tipos públicos de `firebase/auth` no declaran `getReactNativePersistence`, aunque el bundle de React Native sí lo exporta: se declara en `apps/client/src/types/firebase-auth-react-native.d.ts`.

## Definición de terminado

- `npm install && npm test` en verde desde un clon limpio (probarlo en la otra máquina).
- La pantalla "hola" se ve en el celular (Expo Go) y en el navegador (`npm run web`).
- La librería de gráficas elegida se ve bien en ambas plataformas.
- Los emuladores (`npm run emulators`) se movieron a la fase 03, que es la primera que los necesita (requieren Java 21).

## Riesgos

- **Región equivocada:** es irreversible. Verificar `southamerica-east1` antes de confirmar la creación de Firestore.
- Los emuladores requieren **Java 21+** en cada máquina (`firebase-tools` 15 ya no acepta versiones anteriores).
- El plan gratuito de EAS Build tiene un límite mensual de builds y una cola de espera. Alternativa: compilar la APK localmente con Android Studio.
