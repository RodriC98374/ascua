# 07 — Puntos, protectores y recompensas

**Objetivo:** gastar los puntos: comprar protectores y canjear recompensas del catálogo propio.

## Avance (22-09-2026, oficina) — rama `feat/07-points-rewards` (sale de `feat/06-close-day`)

- `shared`: tipos `RewardRecord` y `RewardRedemption`; límites `REWARD_*` y `REDEMPTION_NOTE_MAX_LENGTH`.
- Operaciones con tests contra el emulador: `operations/rewards.ts` (crear, editar, archivar) y `operations/spending.ts` (`purchaseStreakFreeze`, `redeemReward`). Un mismo `requestId` cobra una sola vez en reintento **y en doble toque simultáneo** (el segundo recibe `permission-denied`; se reconoce porque el movimiento ya existe en el servidor). Errores de negocio como `SpendNotAllowedError` con el `SpendCheck` (cuánto falta, máximo, archivada).
- UI en `features/rewards/` (lógica con tests: catálogo por nivel, textos de botones, validación, historial por día) y rutas en `app/(app)/(tabs)/recompensas/` (pila propia): saldo, `FreezeCard` (compra con confirmación), catálogo por nivel con `RewardChip`, hoja de canje (`RedeemSheet`: confirmar con nota → "¡Te lo ganaste!"), formulario con rango sugerido, menú ⋮ editar/archivar, historial con la nota de cada canje. Primitiva nueva `components/ui/fab.tsx` (la usan Hoy y Recompensas).
- Falta: prueba del usuario en web (el gasto real necesita puntos: llegan al cerrar los días) y deploy.

## Tareas

**Operaciones** (transacciones de la app, validadas por las reglas de la fase 03)
- [x] `purchaseStreakFreeze(requestId)`: comprueba con `canPurchaseFreeze`; escribe el movimiento `freeze_{requestId}`, el estado y `pointsSpent` del mes.
- [x] `redeemReward(requestId, rewardId, note)`: comprueba con `canRedeem`; escribe el movimiento `redemption_{requestId}`, el canje con `rewardSnapshot` y `pointsSpent` del mes.
- [x] El `requestId` se genera **una vez al abrir la confirmación** y se reutiliza si hay reintento.
- [x] Tests contra el emulador: saldo insuficiente, máximo de protectores, recompensa archivada, **mismo `requestId` dos veces = un solo cobro**.

**UI**
- [x] Saldo y protectores visibles (0–2).
- [x] Compra de protector con confirmación.
- [x] Catálogo de recompensas: crear, editar, archivar, agrupado por nivel, con el rango sugerido de `REWARD_TIER_COST_RANGES`.
- [x] Canje con confirmación explícita (el momento consciente de "me lo gané") y nota opcional.
- [x] Historial de movimientos de puntos y de canjes.
- [x] Botones deshabilitados si el saldo no alcanza, mostrando cuánto falta.

## Definición de terminado

- Comprar un protector y canjear una recompensa descuentan exactamente una vez, incluso con doble toque o red lenta.
- El historial muestra cada movimiento con su origen.
