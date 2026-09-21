# Convenciones de código

## Idioma

- **En inglés:** identificadores, nombres de archivos y carpetas, colecciones y campos de Firestore, valores de enums y nombres de ramas.
- **En español:** comentarios de código (incluido JSDoc), mensajes de commit, documentación en `.claude/` y textos visibles para el usuario en la UI.

## Nombres

- Firestore: colecciones en `camelCase` plural (`dailyLogs`, `pointTransactions`), campos en `camelCase`, valores de enums en `snake_case` minúscula (`habit_completion`).
- Booleanos con prefijo `is`/`has` (`isPerfectDay`).
- Días de calendario con sufijo `DateKey` y meses con `MonthKey` (`startDateKey`, `monthKey`); instantes con sufijo `At` (`createdAt`, `redeemedAt`).
- Componentes React en `PascalCase`, hooks con prefijo `use`, resto de archivos en `kebab-case`.

## TypeScript

- Modo `strict` en todos los paquetes. Prohibido `any`; si hace falta, `unknown` y estrechar el tipo.
- Tipos, constantes de negocio y helpers de fecha viven **solo** en `packages/shared`. La app los importa de ahí; nunca se copian.
- Constantes de negocio (puntos, costos, límites) nunca como literales sueltos: siempre desde `packages/shared`.
- Cada colección se lee y escribe con un `FirestoreDataConverter` tipado (`withConverter`).

## Git

- Conventional Commits: el prefijo en inglés (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`) y la descripción en español, en imperativo. Ejemplo: `feat: agrega el cálculo de racha al cierre del día`.
- **Sin atribución a Claude ni a ninguna IA** en commits, PRs, código o documentación: nada de `Co-Authored-By: Claude`, "Generated with Claude Code" ni similares. El autor es solo el usuario.
- `main` siempre en verde. Trabajo por fase en ramas `feat/<fase>-<tema>`, por ejemplo `feat/02-shared-core`.
- Nunca commitear `.env*`, cuentas de servicio ni `.claude/settings.local.json`.
