# 07 — Puntos, protectores y recompensas

**Objetivo:** gastar los puntos: comprar protectores y canjear recompensas del catálogo propio.

## Tareas

**Servidor**
- [ ] Callable `purchaseStreakFreeze({ requestId })`: transacción con `canPurchaseFreeze`, movimiento `freeze_{requestId}`, estado y `pointsSpent` del mes.
- [ ] Callable `redeemReward({ requestId, rewardId, note })`: transacción con `canRedeem`, movimiento `redemption_{requestId}`, canje con `rewardSnapshot` y `pointsSpent` del mes.
- [ ] Tests en el emulador: saldo insuficiente, máximo de protectores, recompensa archivada, **mismo `requestId` dos veces = un solo cobro**.

**UI**
- [ ] Saldo y protectores visibles (0–2).
- [ ] Compra de protector con confirmación.
- [ ] Catálogo de recompensas: crear, editar, archivar, agrupado por nivel, con el rango sugerido de `REWARD_TIER_COST_RANGES`.
- [ ] Canje con confirmación explícita (el momento consciente de "me lo gané") y nota opcional.
- [ ] Historial de movimientos de puntos y de canjes.
- [ ] Botones deshabilitados si el saldo no alcanza, mostrando cuánto falta.

## Definición de terminado

- Comprar un protector y canjear una recompensa descuentan exactamente una vez, incluso con doble toque o red lenta.
- El historial muestra cada movimiento con su origen.
