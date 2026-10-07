# Fase 22 — Día de gracia y reinicio de la cuenta

Rama: `feat/22-grace-day-reset`, que sale de `develop` y vuelve a `develop` (D28). Decisiones D29 y D30
(07-10-2026).

El 07-10-2026 el usuario instaló la APK de la fase 21 y pidió dos cosas, ambas por cosas que le pasaron
en el uso real:

1. **Reiniciar la cuenta ya pasó más de una vez** y cada vez hizo falta la consola de Firebase. Quiere
   hacerlo desde la app.
2. **Poder marcar ayer** si se olvidó: que un descuido no cueste la racha ni los puntos.

## D29 — Día de gracia (reemplaza a D8)

**Ayer sigue abierto hasta las 00:00 de hoy.** Se pueden marcar (y desmarcar) sus hábitos; después el
día se cierra y queda fijo, como siempre.

| Qué | Cómo queda |
|---|---|
| Qué se puede marcar ayer | Solo **hábitos** (`entries`). Las tareas se marcan el mismo día (D19) y el check-in también (D22) |
| Cuándo se cierra un día | Al acabarse su gracia: el día `D` se cierra desde las 00:00 de `D + 2`. `closePendingDays` cierra hasta anteayer |
| Cuándo llegan los puntos al saldo | **Un día más tarde que antes**: los de hoy se pueden gastar desde pasado mañana (antes, mañana). Es el costo de la gracia |
| Qué ve el usuario de la racha | La de hoy **ya cuenta ayer con sus marcas actuales** (`stateAfterGraceDay`): si faltan principales de ayer, Hoy muestra la racha rota (o un protector gastado) y avisa; al marcarlos, vuelve en el acto |
| Aviso en Hoy | Franja "Ayer te faltaron N principales. Márcalos hasta las 00:00 y tu racha de X días sigue viva." (o "se usará un protector…", o solo "hábitos sin marcar… aún suman puntos"). Lleva a `/ayer`. Sin pendientes no aparece |
| Pantalla `/ayer` | Las mismas filas de hábito de Hoy (casilla, cantidad, pasos) sobre las marcas de ayer, con lo que pasaría si se cerrara ahora. Si ayer ya se cerró, avisa y vuelve a Hoy |
| Cuenta nueva | Nace con ayer como cerrado: no hay nada que marcar de antes de la cuenta |
| Estadísticas | Sin cambios: un día pasado sin cerrar ya salía como "En curso" |

### Reglas (`firestore.rules`)

- `graceKey()` = ayer (`prevDateKey(todayKey())`), espejo de `EDIT_GRACE_DAYS = 1` en `shared`.
- `dailyLogs` **update**: hoy como antes; ayer solo cambia `entries` (nunca `checkIn`) y solo si sigue
  `open`. **create** de ayer: abierto, sin resumen ni check-in y solo si `lastClosedDateKey < ayer`
  (una lectura de `meta/gamification`).
- **Cierre**: `dateKey < graceKey()` en `isClosedLog` y en `isValidClose`: ayer no se cierra.
- **Compatibilidad:** una APK vieja que intente cerrar ayer al abrirse será rechazada por las reglas
  nuevas y mostrará el aviso de cierre rechazado hasta que se instale la APK nueva. Publicar reglas,
  web y APK el mismo día.

### Lo que cambia en el código

- `shared`: `EDIT_GRACE_DAYS`, `lastClosableDateKey`, `graceDateKey`, `isEditableDateKey`,
  `stateAfterGraceDay` (en `open-days.ts`, con TDD) y `pendingDateKeysToClose` (hasta anteayer).
- `closePendingDays` y el cierre automático (`use-close-pending-days`): hasta anteayer.
- `setHabitCompletion` recibe `dateKey` (el día que se marca), no `today`.
- `buildTodaySummary` recibe `graceEntries` y devuelve `baseState`: de ahí salen la racha, los
  protectores y el riesgo de Hoy, los recordatorios y "Racha actual" de Año.
- `habit-marks.ts` y `habit-row.tsx`: las marcas y las filas de hábito, compartidas por Hoy y `/ayer`.
- Textos: "disponibles pasado mañana" en la tarjeta de Hoy.

## D30 — Reiniciar la cuenta desde la app

**Ajustes → "Empezar de cero" → "Reiniciar mi cuenta".** Una hoja pide escribir `REINICIAR` y avisa de
descargar antes un respaldo completo ("Tus datos"). Borra hábitos, recompensas, tareas, metas, puntos,
protectores, racha e historial, y el perfil (avisos y presupuesto vuelven a su valor de fábrica); el
usuario de acceso (Auth) no se toca y la cuenta se vuelve a crear en cero.

- **Reglas:** el historial nunca se borra, salvo con el marcador `users/{uid}/meta/reset`
  (`{ requestedAt }` con la hora del servidor) escrito hasta 15 minutos antes (`isResetting`). Todo
  `allow delete` de los datos pasa por ahí; sin marcador, siguen rechazados. Los hábitos y recompensas
  "nunca se borran" salvo en un reinicio.
- **Operación** `resetAccount` (`operations/reset-account.ts`): marcador → cada colección (leída del
  servidor, no de la caché) en lotes de 200 → `meta/gamification` y `meta/savings` → perfil → marcador
  → `initializeAccount`. Pide conexión. Una colección nueva de la app debe sumarse a
  `RESET_COLLECTIONS`.
- Probada contra el emulador con 450 movimientos (varios lotes) y con mutaciones sobre las reglas.

## Tareas y estado

| Tarea | Estado |
|---|---|
| `shared`: gracia (TDD) | Hecho |
| Reglas de la gracia y del reinicio, con mutaciones (8 detectadas) | Hecho |
| `closePendingDays`, `setHabitCompletion`, `resetAccount` y sus pruebas contra el emulador | Hecho |
| Hoy: racha con ayer, aviso y pantalla `/ayer` | Hecho |
| Ajustes: reiniciar la cuenta | Hecho |
| Demo: `--forgot` y ayer abierto | Hecho |
| Revisión del usuario en su demo y unión a `develop` | Pendiente |
| Publicar: reglas → web → una APK | Pendiente (con la versión siguiente) |

## Cómo probarlo

`npm run demo -- --forgot` deja a ayer con los principales sin marcar: Hoy muestra la franja "Marcar
ayer", y `/ayer` deja marcarlos y ver cómo vuelve la racha. Sin `--forgot`, ayer queda marcado por
completo pero abierto (se cierra al día siguiente). El reinicio se prueba en Ajustes → "Empezar de cero"
(en la demo borra solo los datos del emulador).

## Definición de terminado

- Marcar ayer funciona en web y en el celular; las reglas rechazan ayer una vez cerrado, el check-in de
  ayer y cualquier día anterior.
- Ningún día se cierra antes de acabarse su gracia, aunque dos dispositivos abran la app a la vez.
- El reinicio borra todo, deja la cuenta como nueva y no se puede disparar sin el marcador.
- shared al 100 %, reglas y operaciones, cliente, lint y tipos en verde.
