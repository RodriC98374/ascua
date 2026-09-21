# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Habit tracker personal: un solo usuario, con login por privacidad. Una app **Expo** genera la APK de Android (uso principal, con notificaciones locales) y una versión web para la PC. Gamificación con rachas estilo Duolingo, puntos y recompensas. Todo opera en hora de Bolivia. **Costo cero:** Firebase Spark, sin servidor propio.

## Dónde está cada cosa

Toda la documentación vive en `.claude/` y **se versiona en git**: el trabajo continúa en varias máquinas (oficina y casa).

| Archivo | Contenido |
|---|---|
| [.claude/requirements.md](.claude/requirements.md) | Requerimientos originales del producto. Fuente de verdad del *qué* |
| [.claude/data-model.md](.claude/data-model.md) | Modelo de datos en Firestore, flujos del servidor, reglas de seguridad, rendimiento |
| [.claude/plan/README.md](.claude/plan/README.md) | Plan por fases, **decisiones confirmadas (no reabrirlas)**, estado y bitácora |
| [.claude/rules/](.claude/rules/) | Convenciones de código, invariantes de dominio, tests y frontend. Se cargan solas |
| [.claude/plan/01-design-system.md](.claude/plan/01-design-system.md) | Sistema de diseño aprobado ([Claude Design](https://claude.ai/artifact/R4ajRu7oMWUMzasdS317Fm)): resumen y pendientes |

## Al empezar una sesión

1. Leer **Estado** y **Bitácora** en `.claude/plan/README.md` para saber en qué fase y rama se está.
2. Leer el archivo de esa fase: tiene sus tareas y su **Definición de terminado**.
3. Al terminar la sesión, actualizar Estado y Bitácora (fecha, máquina, qué quedó a medias), commitear y hacer push.

En una máquina nueva, después de clonar: `git config user.email` con el correo **personal** del usuario, solo en este repo (no el del trabajo).

Cuentas del usuario (no son intercambiables; los correos no se escriben en el repo):
- **git / GitHub:** su cuenta personal de GitHub.
- **Firebase / Google Cloud:** una cuenta de Google **distinta** de la de git. `npx firebase login` con la cuenta que es dueña del proyecto `ascua-a9e27`.
- **Expo:** cuenta propia en expo.dev (`npx eas login`).

## Stack

Monorepo con npm workspaces:
- `apps/client`: Expo + TypeScript, Expo Router, NativeWind, React Native Web. APK con EAS Build (sin Play Store) y web en Firebase Hosting.
- `packages/shared`: tipos, constantes de negocio, helper de fechas de Bolivia y lógica pura (cierre del día, rachas, recordatorios).
- `packages/firestore-rules`: tests de `firestore.rules` (en la raíz) contra el emulador.

Firebase en plan **Spark**: Firestore (`southamerica-east1`), Auth por email y Hosting. **Sin Cloud Functions ni servidores**: la app ejecuta las operaciones y `firestore.rules` las valida. Node 22.

## Entorno por máquina

- **Oficina:** usar el Node portable `D:\node-portable-2` (v22). `C:\Program Files\nodejs` apunta a la instalación de otro usuario de Windows y `npm` falla con `EPERM`; no hay permisos de administrador. En cada comando de PowerShell, anteponerlo al PATH: `$env:Path = "D:\node-portable-2;" + $env:Path; npm ...`
  - Java portable (Temurin 25, sirve como 21+) en `D:\jdk-portable\jdk-25.0.4.1+1`, necesario para los emuladores y los tests de reglas: `$env:JAVA_HOME = "D:\jdk-portable\jdk-25.0.4.1+1"; $env:Path = "$env:JAVA_HOME\bin;D:\node-portable-2;" + $env:Path; npm ...`
- **Casa:** por documentar en la primera sesión allí.

## Comandos

Desde la raíz (en la oficina, con el Node portable antepuesto al PATH):

| Comando | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo de Expo (Android y web) |
| `npm run web` / `npm run android` | Abre directamente en el navegador / en el celular o emulador |
| `npm run lint` | ESLint + Prettier (config de Expo) |
| `npm run typecheck` | TypeScript en todos los paquetes |
| `npm test` | Vitest en `shared` y en las reglas (emulador, **requiere Java**) + Jest en `client` |
| `npm run emulators` | Emuladores de Auth y Firestore (requiere Java 21+) |
| `npm run build:web` | Exporta la web a `apps/client/dist` |
| `npm run deploy:web` / `npm run deploy:rules` | Publica la web en Hosting / las reglas de Firestore |
| `npm run build:apk` | APK con EAS Build (perfil `preview`) |

Cobertura de `shared` (mínimo 95%, hoy 100%): `npm run test:coverage -w @ascua/shared`.

Un solo test:
- `shared`: `npm test -w @ascua/shared -- src/day-evaluation.test.ts` o `-- -t "nombre del test"`.
- `client`: `npm test -w @ascua/client -- src/config/firebase.test.ts` o `-- -t "nombre del test"`.
- Reglas (levanta el emulador con el proyecto `demo-ascua`): `npm test -w @ascua/firestore-rules`. Para un solo archivo, desde `packages/firestore-rules`: `npx firebase emulators:exec --only firestore --project demo-ascua "npx vitest run src/close-day.test.ts"`.

`firestore.rules` tiene dos marcadores que usan los tests: la lista de `allowedUids()` (la reemplazan por usuarios de prueba) y `// ascua:test-probes`. No quitarlos.

Dependencias de la app: instalar con `npx expo install <paquete>` **desde `apps/client`** (elige versiones compatibles con el SDK). En este monorepo `expo install` ignora `--dev`: si el paquete es de desarrollo, moverlo a mano a `devDependencies`.

Expo cambia en cada SDK: antes de usar una API de Expo, leer `apps/client/AGENTS.md` y la documentación de la versión instalada (hoy SDK 57).

En desarrollo, la app usa los emuladores si `EXPO_PUBLIC_USE_EMULATORS=true` (y `EXPO_PUBLIC_EMULATOR_HOST=<IP de la PC>` si se prueba en un celular físico).
