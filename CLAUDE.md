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
| [.claude/plan/01-design-system.md](.claude/plan/01-design-system.md) | Enlace al sistema de diseño aprobado (Claude Design), una vez hecho |

## Al empezar una sesión

1. Leer **Estado** y **Bitácora** en `.claude/plan/README.md` para saber en qué fase y rama se está.
2. Leer el archivo de esa fase: tiene sus tareas y su **Definición de terminado**.
3. Al terminar la sesión, actualizar Estado y Bitácora (fecha, máquina, qué quedó a medias), commitear y hacer push.

En una máquina nueva, después de clonar: `git config user.email` con el correo **personal** del usuario, solo en este repo (no el del trabajo).

## Stack

Monorepo con npm workspaces:
- `apps/client`: Expo + TypeScript, Expo Router, NativeWind, React Native Web. APK con EAS Build (sin Play Store) y web en Firebase Hosting.
- `packages/shared`: tipos, constantes de negocio, helper de fechas de Bolivia y lógica pura (cierre del día, rachas, recordatorios).

Firebase en plan **Spark**: Firestore (`southamerica-east1`), Auth por email y Hosting. **Sin Cloud Functions ni servidores**: la app ejecuta las operaciones y `firestore.rules` las valida. Node 22.

## Comandos

Todavía no hay código. La fase 00 crea los scripts `dev`, `build`, `lint`, `typecheck`, `test` y `emulators`, y los documenta aquí, incluido cómo correr un solo test.
