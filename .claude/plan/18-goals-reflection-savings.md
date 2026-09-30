# 18 — Metas, reflexión y alcancía

**Rama:** `feat/18-goals-reflection-savings`, desde `main`. Elegida por el usuario el 29-09-2026.
**Toca datos:** tres documentos nuevos (`goals`, `weeklyReflections`, `meta/savings`) y una
condición nueva en las reglas de gasto. Sin módulos nativos.

## Decisiones (D25)

- **Metas:** agrupan **tareas** (se crean desde la meta) y **hábitos** existentes. El avance es
  tareas cumplidas / total; cada hábito muestra su % desde que empezó la meta. Fecha límite
  opcional. La da por lograda el usuario. **No dan puntos:** los puntos ya llegan por sus tareas y
  hábitos, y la calibración sigue pendiente.
- **Reflexión semanal:** tres preguntas sobre la semana (lunes a domingo) con el resumen de la
  semana al lado. Se puede escribir o editar **desde el domingo de esa semana, cuando sea**. Hoy la
  invita el domingo (la de esta semana) y el lunes (la de la semana pasada, si falta).
- **Metas en una quinta pestaña** (elegido el 30-09-2026; cambia D16): Hoy, Mes, Metas,
  Recompensas, Ajustes. La reflexión semanal vive ahí también, debajo de las metas.
- **Alcancía:** **una a la vez**, para una recompensa. Apartar puntos los **reserva**: siguen en el
  saldo, pero nada puede gastarlos (las reglas exigen que el saldo después de un gasto cubra lo
  apartado). Lo apartado solo sube; cancelar la vacía y los puntos vuelven a estar disponibles. Al
  llegar al costo, se canjea la recompensa como siempre y la alcancía se vacía en la misma
  transacción. Apartar no genera movimientos en el historial: el único gasto real es el canje.

## Modelo

```ts
interface Goal {                       // goals/{goalId}
  title: string;                       // 2..60
  description: string | null;          // ..200
  targetDateKey: DateKey | null;       // fecha límite opcional, desde el día de inicio
  habitIds: string[];                  // hasta MAX_GOAL_HABITS (10), sin repetir
  taskIds: string[];                   // hasta MAX_GOAL_TASKS (50), sin repetir
  status: 'active' | 'achieved' | 'archived';
  startDateKey: DateKey;               // día en que se creó; fijo
  achievedDateKey: DateKey | null;     // el día que se dio por lograda; solo en 'achieved'
  sortOrder: number;
}

interface WeeklyReflection {           // weeklyReflections/{weekStartDateKey}
  weekStartDateKey: DateKey;           // lunes; igual al ID
  wentWell: string;                    // ¿Qué salió bien? ..500
  wasHard: string;                     // ¿Qué te costó? ..500
  nextFocus: string;                   // ¿En qué te enfocas la próxima semana? ..500
}                                      // al menos una respuesta con texto

interface SavingsJar {                 // meta/savings
  rewardId: string | null;             // null = sin alcancía
  points: number;                      // apartados; ≤ costo de la recompensa y ≤ saldo
  startedDateKey: DateKey | null;
}
```

- Una tarea borrada deja su ID en `taskIds`; el avance solo cuenta las tareas que existen.
- Un hábito archivado sigue en la meta con su historial.

## Reglas

- `goals`: forma validada; se crean activas, con `startDateKey` = hoy; no se borran. Lograda ⇔
  `achievedDateKey` con valor, y al pasar a lograda es hoy.
- `weeklyReflections`: ID = lunes, y el domingo de esa semana ya llegó; textos hasta 500 y al menos
  uno con texto; no se borran.
- `meta/savings`: empezar = hoy; misma recompensa ⇒ los puntos solo suben; vaciar (sin recompensa,
  0 puntos) siempre; cambiar de recompensa sin vaciar, no. Puntos ≤ costo de la recompensa (activa
  al apartar) y ≤ saldo.
- **Gasto** (protector y canje): además, el saldo después del gasto ≥ lo apartado después.

## Tareas

**Núcleo (`shared`, TDD)**
- [x] Tipos y constantes; validación de metas y reflexiones.
- [x] Avance de una meta (tareas) y % de sus hábitos desde el inicio; días para la fecha límite.
- [x] Semana de la reflexión (cuál invita Hoy, si se puede escribir).
- [x] Alcancía: puntos disponibles, cuánto se puede apartar, si ya alcanza.
- [x] Respaldo con las colecciones nuevas.

**Reglas y operaciones (emulador)**
- [x] `goals`, `weeklyReflections` y `meta/savings`, con tests y mutaciones (17, todas detectadas).
- [x] Gasto con alcancía: protector y canje no bajan del apartado.
- [x] Operaciones: metas (crear, editar, lograr, archivar, tarea de la meta), reflexión, alcancía
      (empezar, apartar, cancelar) y canje desde la alcancía.

**App**
- [x] Pestaña **Metas**: lista, detalle con tareas y hábitos, formulario (fecha límite con ruedas).
- [x] Reflexión: pantalla con el resumen de la semana; invitación en Hoy; tarjeta en Mes → Semana.
- [x] Alcancía en Recompensas; "puntos para gastar" descuenta lo apartado en toda la app.
- [x] Respaldo y demo con metas, reflexiones y una alcancía.

**Cierre**
- [x] Revisión en web (claro y oscuro), typecheck, lint y tests; `data-model.md` al día.
- [x] Revisión del usuario (aprobada el 30-09-2026). **Toca reglas:** publicar reglas antes que la web.

## Definición de terminado

- Una meta se crea, se edita, suma tareas y hábitos, muestra su avance y se da por lograda o se
  archiva; las reglas rechazan formas inválidas y fechas que no cuadran.
- Una reflexión se escribe y se edita desde el domingo de su semana; antes, las reglas la rechazan.
- Lo apartado no se puede gastar en un protector ni en otra recompensa (probado en reglas);
  cancelar lo libera y el canje desde la alcancía la vacía.
