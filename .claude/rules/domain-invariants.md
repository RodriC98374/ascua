# Invariantes de dominio

Fuente completa: [../data-model.md](../data-model.md). Decisiones con fecha: [../plan/README.md](../plan/README.md). Estas reglas no se cambian sin confirmación del usuario.

## Zona horaria

- Todo opera en `America/La_Paz` (UTC-4, sin horario de verano), sin importar la zona del dispositivo.
- Días de calendario = `DateKey` `'YYYY-MM-DD'`; instantes = `Timestamp`. Nunca mezclarlos.
- "Hoy" se obtiene **solo** con el helper de `packages/shared`. Prohibido `new Date().getDate()`, `toISOString().slice(0, 10)` o cualquier cálculo con la hora local del dispositivo.
- La única excepción es `firestore.rules`, que resta 4 h a `request.time` porque las reglas no tienen `Intl`.

## Datos

- Todo vive bajo `users/{userId}/…`. Las funcionalidades nuevas se agregan como subcolecciones nuevas, sin cambiar la forma de las existentes.
- **No hay servidor** (Firebase Spark, costo cero). La app ejecuta todas las operaciones y las reglas de Firestore validan cada escritura. No proponer Cloud Functions, GitHub Actions ni otros servidores sin que el usuario lo pida.
- `meta/gamification`, `pointTransactions`, `monthlySummaries`, `rewardRedemptions` y `dailyLogs.summary`/`status` solo se escriben dentro de las operaciones `initializeAccount`, `closePendingDays`, `purchaseStreakFreeze` y `redeemReward`.
- `dailyLogs/{dateKey}.entries` solo se escribe si `dateKey` es hoy en Bolivia según la hora del servidor. No hay margen de gracia.
- `pointTransactions` es append-only con IDs deterministas. Todo cambio de saldo va en la misma transacción que su movimiento.
- Hábitos y recompensas nunca se borran, se archivan. Las tareas sí se borran, salvo las cumplidas en un día ya pasado.

## Reglas de negocio

- Puntos: hábito principal 10, secundario 5, día perfecto +5, cada 7 días sin protector +20, cada 30 días sin protector +100 (recurrentes).
- Tareas (D19): pequeña 5, mediana 10, grande 20, con **tope de 30 por día** entre todas y en un solo movimiento `tasks_{dateKey}`. No tocan la racha ni el día perfecto; una vencida no se castiga. Se marcan solo hoy y una cumplida en un día pasado queda fija.
- Frecuencias (D20): un hábito de **días fijos** solo cuenta esos días. Uno de **N veces por semana** (lunes a domingo) no entra en la meta de racha ni en el día perfecto, y suma sus puntos hasta N marcas por semana; con todos los semanales cumplidos, la llama se ve morada hasta el domingo. Uno **con cantidad** se cumple al llegar a su meta del día. Frecuencia y meta no se cambian después de crear el hábito.
- La racha y los puntos de hoy se ven **al instante** al marcar. Pasan al saldo oficial cuando la app cierra el día (`closePendingDays`, al abrirse al día siguiente); desde ahí se pueden gastar.
- Meta de racha = todos los hábitos principales programados del día. Día perfecto = 100% de los programados.
- Protector: cuesta 150, máximo 2, se aplica automáticamente **solo si hay una racha activa**. Congela la racha sin sumarla.
- El canje de recompensas es manual. Los rangos de costo por nivel son una sugerencia, no un límite.
