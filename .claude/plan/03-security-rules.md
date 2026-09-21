# 03 — Reglas de seguridad

**Objetivo:** `firestore.rules` completas según `data-model.md` §10, probadas contra el emulador **antes** de que la UI escriba datos reales.

Método: **TDD** con `@firebase/rules-unit-testing` + Vitest. Por cada regla, al menos un caso permitido y uno denegado.

## Casos a cubrir

**Acceso**
- Usuario A no lee ni escribe nada de B. Un usuario sin autenticar no accede a nada.
- Un `uid` fuera de la lista de permitidos es rechazado (fase 04 define la lista; aquí se prueba el mecanismo).

**Escrituras del cliente permitidas**
- `users/{uid}`: solo `displayName` y `reminderSettings`; `email` inmutable.
- `habits`, `rewards`, `devices`: forma válida (tipos, enums, longitudes máximas).
- `habits`: no se puede borrar (solo archivar).
- `dailyLogs/{hoy}`: crear con `status: 'open'` y actualizar `entries`.

**Escrituras del cliente denegadas**
- `dailyLogs/{ayer}` y `dailyLogs/{mañana}`, sobre todo en el borde de 23:59/00:00 Bolivia (fijando `request.time`).
- Tocar `dailyLogs.summary` o poner `status` distinto de `'open'`.
- Cualquier escritura en `serverState/*`, `pointTransactions`, `monthlySummaries`, `rewardRedemptions`.
- Borrar `rewards`.

## Implementación

- Funciones auxiliares en las reglas: `isOwner(uid)`, `isAllowedUser()`, `boliviaTodayKey()`, `onlyChanges(keys)`.
- `boliviaTodayKey()` arma `'YYYY-MM-DD'` desde `request.time - duration.value(4, 'h')`, con un comentario que explica por qué aquí se acepta el offset fijo.

## Definición de terminado

- Todos los casos de arriba pasan en `npm test`.
- `firebase deploy --only firestore:rules` hecho en el proyecto real.
