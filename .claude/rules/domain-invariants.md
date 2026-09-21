# Invariantes de dominio

Fuente completa: [../data-model.md](../data-model.md). Decisiones con fecha: [../plan/README.md](../plan/README.md). Estas reglas no se cambian sin confirmación del usuario.

## Zona horaria

- Todo opera en `America/La_Paz` (UTC-4, sin horario de verano), sin importar la zona del dispositivo.
- Días de calendario = `DateKey` `'YYYY-MM-DD'`; instantes = `Timestamp`. Nunca mezclarlos.
- "Hoy" se obtiene **solo** con el helper de `packages/shared`. Prohibido `new Date().getDate()`, `toISOString().slice(0, 10)` o cualquier cálculo con la hora local del dispositivo.
- La única excepción es `firestore.rules`, que resta 4 h a `request.time` porque las reglas no tienen `Intl`.

## Datos

- Todo vive bajo `users/{userId}/…`. Las funcionalidades nuevas se agregan como subcolecciones nuevas, sin cambiar la forma de las existentes.
- Solo el servidor (Cloud Functions) escribe: `serverState/*`, `pointTransactions`, `monthlySummaries`, `rewardRedemptions` y `dailyLogs.summary`/`status` al cierre.
- El cliente solo puede escribir `dailyLogs/{dateKey}.entries` si `dateKey` es hoy en Bolivia. No hay margen de gracia.
- `pointTransactions` es append-only con IDs deterministas. Todo cambio de saldo va en la misma transacción que su movimiento.
- Hábitos y recompensas nunca se borran, se archivan.

## Reglas de negocio

- Puntos: hábito principal 10, secundario 5, día perfecto +5, cada 7 días sin protector +20, cada 30 días sin protector +100 (recurrentes).
- Los puntos se acreditan al **cierre del día** (`closeDay`, 00:05 Bolivia). Durante el día la UI los muestra como provisionales.
- Meta de racha = todos los hábitos principales programados del día. Día perfecto = 100% de los programados.
- Protector: cuesta 150, máximo 2, se aplica automáticamente **solo si hay una racha activa**. Congela la racha sin sumarla.
- El canje de recompensas es manual. Los rangos de costo por nivel son una sugerencia, no un límite.
