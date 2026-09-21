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

- [ ] Root: `package.json` con npm workspaces (`apps/*`, `packages/*`), `.nvmrc` (22), `engines`.
- [ ] `packages/shared`: paquete TypeScript que compila y se importa desde la app.
- [ ] `apps/client`: Expo (TypeScript strict) con Expo Router y soporte web. Una pantalla "hola" que muestra un valor importado de `shared`.
- [ ] NativeWind configurado y funcionando en Android y web.
- [ ] **Prueba de la librería de gráficas:** una barra y una línea con datos falsos, en Android y en web. Candidata inicial: `react-native-gifted-charts`. Registrar la elección como decisión en el README.
- [ ] Firebase JS SDK: Auth con persistencia (`AsyncStorage` en Android, la del navegador en web) y Firestore conectado al emulador en desarrollo.
- [ ] ESLint + Prettier compartidos en la raíz.
- [ ] Vitest en `packages/shared`; Jest (`jest-expo`) en `apps/client`. Un test trivial en cada uno.
- [ ] `firebase-tools` como devDependency; `firebase.json`, `.firebaserc`, `firestore.rules` (todo denegado), `firestore.indexes.json`, Hosting apuntando a la exportación web de Expo.
- [ ] Emulator Suite (Auth, Firestore) con `npm run emulators`.
- [ ] `eas-cli` como devDependency; `eas.json` con un perfil `preview` que genera **APK** (no AAB).
- [ ] Scripts raíz: `dev`, `android`, `web`, `build:web`, `build:apk`, `lint`, `typecheck`, `test`, `emulators`, `deploy:web`, `deploy:rules`.
- [ ] Primer APK instalado en el celular y primer deploy web en Firebase Hosting.
- [ ] `CLAUDE.md`: sección de comandos con los reales, incluido cómo correr un solo test.

## Definición de terminado

- `npm install && npm test` en verde desde un clon limpio (probarlo en la otra máquina).
- La pantalla "hola" se ve en el celular (APK instalada) y en la URL de Firebase Hosting.
- `npm run emulators` levanta todo y la app en desarrollo habla con el emulador.
- La librería de gráficas elegida funciona en ambas plataformas.

## Riesgos

- **Región equivocada:** es irreversible. Verificar `southamerica-east1` antes de confirmar la creación de Firestore.
- Los emuladores requieren **Java 21+** en cada máquina (`firebase-tools` 15 ya no acepta versiones anteriores).
- El plan gratuito de EAS Build tiene un límite mensual de builds y una cola de espera. Alternativa: compilar la APK localmente con Android Studio.
