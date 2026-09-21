# 02 — Núcleo compartido (`packages/shared`)

**Objetivo:** que toda la lógica de negocio exista como código puro y probado **antes** de tocar Firestore. Es la principal defensa contra incoherencias: si una regla del `data-model.md` es ambigua, aparece aquí como un test que no se puede escribir.

Método: **TDD**. Por cada módulo, primero la tabla de casos (test en rojo), luego el código.

## Módulos

### `dates.ts`
- `toDateKey(instant: Date): DateKey` y `toMonthKey(...)` con `Intl` en `America/La_Paz`.
- `todayDateKey(now?: Date)`, `addDays(dateKey, n)`, `daysBetween(a, b)`, `startOfWeek(dateKey)` (lunes), `monthOf(dateKey)`.
- Casos obligatorios: 23:59 y 00:00 Bolivia (03:59 y 04:00 UTC), fin de mes, fin de año, año bisiesto, máquina de test con otra zona horaria (`TZ=Asia/Tokyo`).

### `constants.ts` y `types.ts`
- Las constantes y tipos de `data-model.md` §2–3, tal cual.

### `habit-schedule.ts`
- `isHabitScheduledOn(habit, dateKey)`: aplica `startDateKey <= D <= archivedDateKey`.
- Casos: creado hoy, archivado hoy (sigue contando), archivado ayer, sin archivar.

### `day-evaluation.ts` (el corazón)
- `evaluateDay(input): DayEvaluation`, función pura.
  - Entrada: `dateKey`, hábitos, `entries`, estado de gamificación anterior.
  - Salida: `status`, `summary`, lista de movimientos de puntos (con ID determinista) y nuevo estado de gamificación.
- Tabla de casos mínima:
  - Principales completos y secundarios incompletos → `completed`, sin bono de día perfecto.
  - Todo completo → `completed` + `isPerfectDay` + bono.
  - Sin principales → la meta pasa a ser todos los hábitos.
  - Sin hábitos → `inactive`, no cambia nada.
  - Falla con protector y racha > 0 → `frozen`, `daysWithoutFreeze = 0`, racha igual.
  - Falla con protector y racha = 0 → `missed`, **el protector no se gasta**.
  - Falla sin protector → `missed`, racha 0.
  - `daysWithoutFreeze` llega a 7, 14, 30 y 210 → bonos correctos (210 da los dos).
  - `longestStreak` se actualiza solo al superarlo.
  - `entries` con un ID de hábito inexistente o archivado → se ignora.
  - Puntos provisionales de hoy = puntos que acreditará el cierre (la UI y `closeDay` usan la misma función).

### `points.ts`
- `applyTransaction(state, transaction)` → nuevo saldo y totales; saldo negativo imposible.
- `canPurchaseFreeze(state)` y `canRedeem(state, reward)`.

### `converters.ts`
- Un `FirestoreDataConverter` por colección, compartido. Valida la forma al leer.

## Definición de terminado

- Cobertura ≥ 95% en `packages/shared` (`vitest --coverage`).
- Todos los casos de arriba existen como tests con nombre descriptivo.
- Cero dependencias de Firestore en `day-evaluation.ts` y `dates.ts`.
- Si algún caso obligó a cambiar una regla, `data-model.md` quedó actualizado en el mismo commit.
