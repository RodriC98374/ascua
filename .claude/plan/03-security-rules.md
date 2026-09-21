# 03 — Reglas de seguridad

**Objetivo:** `firestore.rules` completas según `data-model.md` §10. Sin servidor, **las reglas son la única barrera**: tienen que estar probadas antes de que la app escriba datos reales.

Método: **TDD** con `@firebase/rules-unit-testing` + Vitest contra el emulador. Por cada regla, al menos un caso permitido y uno denegado.

**Requisito previo:** Java 21+ para los emuladores. Sin permisos de administrador: JDK 21 portable (Eclipse Temurin, zip) en una carpeta de `D:\`, antepuesto al PATH como el Node portable. Documentar la ruta en CLAUDE.md (Entorno por máquina) y verificar que `npm run emulators` arranque.

## Casos a cubrir

**Acceso**
- Usuario A no lee ni escribe nada de B. Un usuario sin autenticar no accede a nada.
- Un `uid` fuera de la lista de permitidos es rechazado.

**Escrituras libres (forma validada)**
- `users/{uid}`: creación con valores iniciales; luego solo `displayName` y `reminderSettings`; `email` inmutable.
- `habits` y `rewards`: tipos, enums y longitudes; no se pueden borrar.

**`dailyLogs.entries`**
- Permitido sobre hoy; denegado sobre ayer y mañana, sobre todo en el borde de 23:59/00:00 Bolivia (fijando `request.time`).
- Al crear: `status == 'open'` y `summary == null`.

**Inicialización de la cuenta**
- `meta/gamification` solo se crea con los valores iniciales (saldo 0, racha 0, `lastClosedDateKey` = ayer).

**Cierre de un día**
- Permitido: cerrar `lastClosedDateKey + 1` si es anterior a hoy, con movimientos de ID y monto válidos.
- Denegado: cerrar hoy o un día futuro; saltarse un día; cerrar dos veces el mismo día; un movimiento con monto que no corresponde a su tipo; subir `streakFreezesAvailable`; saldo negativo.

**Compra de protector**
- Permitido: −150 exacto, protectores +1, saldo suficiente.
- Denegado: con 2 protectores; saldo insuficiente; monto distinto de −150; el mismo `requestId` dos veces.

**Canje**
- Permitido: −`cost` exacto de una recompensa activa, con el canje y el movimiento en la misma transacción.
- Denegado: recompensa archivada; saldo insuficiente; monto distinto del costo; el mismo `requestId` dos veces.

**Inmutabilidad**
- `pointTransactions` y `rewardRedemptions`: editar o borrar siempre denegado.

## Implementación

- Funciones auxiliares: `isOwner(uid)`, `isAllowedUser()`, `boliviaTodayKey()`, `nextDateKey(key)`, `onlyChanges(keys)`, `validPointAmount(type, amount)`.
- `boliviaTodayKey()` arma `'YYYY-MM-DD'` desde `request.time - duration.value(4, 'h')`, con un comentario que explica por qué aquí se acepta el offset fijo.
- Un test compara los montos de las reglas con las constantes de `packages/shared` para que nunca diverjan.

## Riesgo

- **Límite de 20 `get()`/`getAfter()` por transacción.** El cierre de un día escribe varios documentos, y cada regla que consulta otros documentos suma al límite. Diseñar las reglas para validar con `getAfter` sobre `meta/gamification` una sola vez por documento. Si no alcanza, cerrar en dos transacciones (movimientos primero, estado después) y documentarlo.

## Definición de terminado

- Todos los casos de arriba pasan en `npm test`.
- `npm run deploy:rules` hecho en el proyecto real.
