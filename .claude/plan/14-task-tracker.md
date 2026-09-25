# 14 — Task tracker

**Rama:** `feat/14-task-tracker` (sale de `main`, con la fase 13 ya unida). Elegida por el usuario
el 25-09-2026. **Toca datos:** colección nueva, tipo de movimiento nuevo y reglas. Economía de
puntos decidida por el usuario tras un análisis (D19 en el README).

## Decisiones (D19)

- **Puntos por tamaño:** pequeña 5, mediana 10, grande 20 (`TASK_POINTS`).
- **Tope de 30 pts por día** entre todas las tareas (`DAILY_TASK_POINTS_CAP`), lo mismo que valen
  los 3 principales: las tareas nunca pesan más que los hábitos. Las que pasan el tope se cumplen
  igual, pero ya no suman ese día.
- **Un solo movimiento por día** para las tareas: `task_completion` con ID `tasks_{dateKey}`,
  `sourceType: 'daily_log'`, monto de 1 a 30. Las reglas lo validan sin leer cada tarea.
- **No tocan la racha ni el día perfecto.** Una tarea vencida sigue en Hoy como "Vencida", sin
  castigo y con los mismos puntos.
- **Se pueden borrar**, salvo las cumplidas en un día ya cerrado (sus puntos ya están en el
  historial). Una tarea solo se marca o desmarca **hoy**, como los hábitos.
- **Los puntos de los hábitos no cambian ahora:** se revisan en la calibración del ~13-10 con datos
  reales, incluida la idea de que un hábito valga menos después de sus primeros ~66 días.

## Modelo: `users/{userId}/tasks/{taskId}`

```ts
type TaskSize = 'small' | 'medium' | 'large';
interface Task {
  title: string;                  // 1..80
  size: TaskSize;
  dueDateKey: DateKey;            // para cuándo es; al crearla, hoy o después
  completedDateKey: DateKey | null; // día en que se cumplió; solo puede ser hoy
  completedAt: Timestamp | null;
}
```

- **Reglas:** crear con `dueDateKey >= hoy` y sin cumplir; editar título, tamaño y fecha (nunca a
  un día pasado); marcar solo `null → hoy` y desmarcar solo `hoy → null`; borrar salvo si
  `completedDateKey < hoy`. Una tarea cumplida en un día pasado queda fija.
- **Cierre:** `closePendingDays` consulta antes de la transacción las tareas cumplidas en los días
  pendientes (una tarea de un día pasado ya no puede cambiar) y `evaluateDay` suma sus puntos con
  el tope. El resumen del día y del mes incluyen esos puntos en `pointsEarned`.

## Tareas

**Núcleo (`shared`, TDD)**
- [x] Tipos, `TASK_POINTS`, `DAILY_TASK_POINTS_CAP`, límites del título, ID `tasks_{dateKey}`.
- [x] Puntos de las tareas de un día con tope, y `evaluateDay` con las tareas cumplidas ese día.
- [x] Lista de Hoy: vencidas, de hoy, cumplidas hoy y próximas, con "vencida hace N días".

**Reglas y operaciones (emulador)**
- [x] `tasks/{taskId}` y el movimiento `task_completion` en `firestore.rules`, con tests.
- [x] Operaciones: crear, editar, marcar, mover a mañana y borrar; `closePendingDays` con tareas.

Hecho el 25-09-2026: shared 249 (100 %), reglas y operaciones 182 (25 nuevos). Reglas nuevas
verificadas con 11 mutaciones: todas hacen fallar algún test. `closePendingDays` ya no lee nada
más si no hay días pendientes.

**App**
- [x] Converter y hooks; "+N hoy" y el desglose de puntos con las tareas.
- [x] Sección "Tareas" en Hoy (marcar, deslizar, vencidas, tope visible), formulario con días
      rápidos (Hoy, Mañana y la semana) y lista de próximas.
- [ ] Mes → Semana: un donut por día con las tareas cumplidas y pendientes.
- [x] Exportación: el respaldo JSON incluye las tareas y el CSV nombra el movimiento nuevo.
- [x] Datos de la demo con tareas (historia y hoy; azar propio para no cambiar la de hábitos).

App revisada con Edge headless contra la demo (claro y oscuro): marcar, próximas, crear con el formulario, menú (mover a mañana), tope pasado ("Llegaste al tope…", el día suma 30 por tareas). Cliente 142 tests.

**Cierre**
- [ ] Revisión en web, typecheck, lint y tests; revisión del usuario; publicar reglas antes que
      la web.

## Definición de terminado

- Las tareas se crean, marcan, mueven y borran desde Hoy; las vencidas se ven y no castigan.
- Al cerrar el día, sus puntos (con el tope de 30) pasan al saldo en un solo movimiento, y las
  reglas rechazan montos por encima del tope o fuera de un cierre.
- La semana muestra un donut por día con las tareas.
