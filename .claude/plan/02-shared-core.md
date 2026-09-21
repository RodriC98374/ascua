# 02 — Núcleo compartido (`packages/shared`)

**Estado: hecha (21-09-2026).** 63 tests, cobertura 100% (líneas, ramas y funciones). Rama `feat/02-shared-core`.

**Objetivo:** que toda la lógica de negocio exista como código puro y probado **antes** de tocar Firestore. Es la principal defensa contra incoherencias: cada regla del `data-model.md` es un test.

Método: **TDD**. Se escribieron los tests primero, se verificó que fallaran y después se escribió el código.

## Qué quedó (API pública de `@ascua/shared`)

| Archivo | Exporta | Para qué |
|---|---|---|
| `types.ts` | `DateKey`, `MonthKey`, `Habit`, `DailyEntries`, `GamificationState`, `PointTransaction`, `Reward`, enums | Tipos de dominio **sin Firebase** |
| `constants.ts` | `APP_TIME_ZONE`, `HABIT_POINTS`, `MAX_PRIMARY_HABITS`, `PERFECT_DAY_BONUS`, `STREAK_BONUSES`, `STREAK_FREEZE_COST`, `MAX_STREAK_FREEZES`, `REWARD_TIER_COST_RANGES` | Reglas de puntos en un solo lugar |
| `dates.ts` | `toDateKey`, `todayDateKey`, `toMonthKey`, `addDays`, `daysBetween`, `startOfWeek`, `isValidDateKey`, `dateKeyRange`, `pendingDateKeysToClose` | Fechas de Bolivia; aritmética de calendario en UTC puro |
| `habit-schedule.ts` | `isHabitScheduledOn`, `getScheduledHabits` | Qué hábitos cuentan cada día (archivar hoy no saca de hoy) |
| `day-evaluation.ts` | `evaluateDay` → `{ status, isGoalMet, freezeUsed, summary, transactions, nextState }` | Cierre de un día. Lo usan `closePendingDays` y la vista previa de "Hoy" |
| `points.ts` | `canPurchaseFreeze`, `canRedeemReward` (con `missingPoints`), `planFreezePurchase`, `planRewardRedemption` | Gasto de puntos |
| `transaction-ids.ts` | `transactionIds` | IDs deterministas de los movimientos |

## Decisiones tomadas durante la fase

- **Los converters de Firestore van en la app, no en `shared`.** Si estuvieran aquí, `shared` dependería de Firebase y dejaría de ser lógica pura. Los converters (fases 04/05) traducen documentos de Firestore (con `Timestamp`) a los tipos de dominio de `shared`.
- **`evaluateDay` se niega a cerrar un día que no sea `lastClosedDateKey + 1`** (lanza un error). Protege el orden del cierre aunque falle la orquestación.
- **Los hábitos cumplidos suman puntos aunque no se cumpla la meta de racha** (ej.: día perdido con el secundario hecho → +5). Coincide con `data-model.md` §7.
- **Un día `inactive` no toca la racha ni `daysWithoutFreeze`.**
- **Orden de los movimientos al cerrar:** hábitos (en el orden recibido), día perfecto, bono de 7 y bono de 30, con `balanceAfter` acumulado.
- **Textos de los movimientos** (voz del sistema de diseño): "Hábito cumplido: {nombre}", "Día perfecto", "Racha de 7 días sin protector", "Protector de racha", "Canje: {nombre}".
- **Pantalla "Hoy":** para la vista previa, llamar a `evaluateDay` con el día de hoy (requiere haber cerrado antes los días pendientes). Usar `isGoalMet` y `summary`; **ignorar `status` y `freezeUsed`**, que solo tienen sentido al cierre (durante el día nunca se muestra "protector usado").
- Los tests de zona horaria usan `vi.stubEnv('TZ', …)`: `shared` no incluye los tipos de Node a propósito, porque también corre en el celular.

## Definición de terminado

- [x] Cobertura ≥ 95% en `packages/shared` (`npm run test:coverage -w @ascua/shared`): **100%**.
- [x] Todos los casos de la tabla (principales/secundarios, día perfecto, sin principales, sin hábitos, protector con y sin racha, sin protector, bonos 7/14/30/210, racha más larga, IDs inválidos o archivados) existen como tests con nombre descriptivo.
- [x] Cero dependencias de Firestore en todo `packages/shared`.
- [x] Ninguna regla del negocio cambió; `data-model.md` sigue vigente.
