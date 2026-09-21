# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Qué es

Habit Tracker PWA personal: un solo usuario, desplegado públicamente con login por privacidad. Mobile-first (Android), instalable, también usable en escritorio. Gamificación con rachas estilo Duolingo, puntos y recompensas. Todo opera en hora de Bolivia.

## Dónde está cada cosa

Toda la documentación vive en `.claude/` y **se versiona en git**: el trabajo continúa en varias máquinas (oficina y casa).

| Archivo | Contenido |
|---|---|
| [.claude/requirements.md](.claude/requirements.md) | Requerimientos originales del producto. Fuente de verdad del *qué* |
| [.claude/data-model.md](.claude/data-model.md) | Modelo de datos en Firestore, flujos del servidor, reglas de seguridad, rendimiento |
| [.claude/plan/README.md](.claude/plan/README.md) | Plan por fases, **decisiones confirmadas (no reabrirlas)**, estado y bitácora |
| [.claude/rules/](.claude/rules/) | Convenciones de código, invariantes de dominio, tests y frontend. Se cargan solas |
| `.claude/mockups/` | Referencia visual aprobada (se crea en la fase 01) |

## Al empezar una sesión

1. Leer **Estado** y **Bitácora** en `.claude/plan/README.md` para saber en qué fase y rama se está.
2. Leer el archivo de esa fase: tiene sus tareas y su **Definición de terminado**.
3. Al terminar la sesión, actualizar Estado y Bitácora (fecha, máquina, qué quedó a medias) y commitear.

## Stack

Monorepo con npm workspaces:
- `apps/web`: React + Vite + TypeScript, Tailwind, Recharts, `vite-plugin-pwa`.
- `functions`: Cloud Functions v2 en TypeScript, región `southamerica-east1`.
- `packages/shared`: tipos, constantes de negocio, helper de fechas de Bolivia y lógica pura del cierre del día.

Firebase: Firestore, Auth por email, Hosting, Cloud Functions y FCM (plan Blaze). Node 22.

## Comandos

Todavía no hay código. La fase 00 crea los scripts `dev`, `build`, `lint`, `typecheck`, `test` y `emulators`, y los documenta aquí, incluido cómo correr un solo test.
