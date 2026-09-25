# 16 — Hábitos no diarios y con cantidad

**Rama:** `feat/16-flexible-habits` (sale de `main`, con la fase 14 ya unida). Elegida por el
usuario el 25-09-2026. **Toca datos:** forma nueva de `schedule`, campo `target` en el hábito,
`count` en las marcas y reglas. Cambia la evaluación del día: TDD en `shared`.

## Decisiones (D20)

- **Días fijos** (`days_of_week`): el hábito solo toca esos días (de 1 a 6; los 7 son "todos los
  días"). Los demás días no cuenta ni castiga. Si un día no tiene principales programados, la meta
  de racha son todos los hábitos que tocan ese día (la regla de siempre, D5).
- **Veces por semana** (`times_per_week`, N de 1 a 6, semanas de lunes a domingo): **no toca la
  racha diaria** ni el día perfecto, y no lleva una racha propia. Cada marca suma los puntos de su
  nivel hasta N por semana; las de más se cumplen igual, pero ya no suman (como el tope de las
  tareas, D19).
- **Semana potenciada:** cuando todos los hábitos semanales cumplen su N de la semana, la llama de
  la racha se vuelve **morada** hasta el domingo. Se deriva de las marcas de la semana: no se guarda
  nada ni da puntos extra (se puede revisar en la calibración).
- **Con cantidad** (`target: { amount, unit }`, de 2 a 999): se cumple al llegar a la meta del
  día (0 de 8 vasos). Sin puntos parciales. Se combina con cualquier frecuencia.
- **Frecuencia y meta fijas al crear el hábito.** Para cambiarlas, se archiva y se crea otro (su
  historial queda en el archivado). Las reglas ya no dejan cambiar `schedule`; tampoco `target`.

## Modelo

```ts
type HabitSchedule =
  | { type: 'daily' }
  | { type: 'days_of_week'; daysOfWeek: number[] }   // 1 = lunes … 7 = domingo
  | { type: 'times_per_week'; timesPerWeek: number }; // 1..6

interface Habit {
  // … lo de siempre
  target?: { amount: number; unit: string } | null;  // sin el campo = sin cantidad
}

type DailyEntries = Record<string, { completed: boolean; count?: number }>;
```

- **Cumplido un día:** con cantidad, `count >= amount`; sin cantidad, `completed`. Lo decide
  `shared` (las reglas no pueden recorrer las marcas); la app escribe los dos campos.
- **En el resumen del día**, un hábito semanal entra en `scheduledHabitIds` y `completedHabitIds`
  solo el día que se marca (las reglas exigen que cada movimiento de hábito esté en
  `completedHabitIds`). Nunca entra en la meta de racha.
- **Cierre:** `closePendingDays` lee antes de la transacción las marcas de la semana de los días
  pendientes (solo si hay hábitos semanales) para aplicar el tope de N por semana. Una marca de un
  día pasado ya no cambia, así que la foto sirve.
- **Reglas:** forma de `schedule` (tres tipos) y de `target` (opcional, para no romper los hábitos
  existentes); ni `schedule` ni `target` se pueden editar. El tope semanal no se puede comprobar en
  las reglas (sumaría lecturas por hábito), como el nivel de cada hábito: lo garantizan los tests de
  `evaluateDay`.

## Tareas

**Núcleo (`shared`, TDD)**
- [ ] Tipos, día de la semana ISO, `isHabitScheduledOn` con días fijos y semanales.
- [ ] Cumplido con cantidad; `evaluateDay` con días fijos, cantidad y semanales (tope por semana).
- [ ] Progreso de la semana por hábito y semana potenciada.
- [ ] Estadísticas: días que no tocan, % de los semanales contra su N.

**Reglas y operaciones (emulador)**
- [ ] `schedule` y `target` en `firestore.rules`, con tests; inmutables.
- [ ] Crear hábito con frecuencia y meta; marcar con cantidad; `closePendingDays` con la semana.

**App**
- [ ] Formulario: frecuencia (todos los días, días fijos, veces por semana) y meta con unidad.
- [ ] Hoy: contador para los de cantidad, "2 de 3 esta semana", sección de los que no tocan hoy.
- [ ] Llama morada con la semana potenciada.
- [ ] Mes y Año con los nuevos tipos; demo con un hábito de cada tipo.

**Cierre**
- [ ] Revisión en web, typecheck, lint y tests; revisión del usuario. **Toca reglas:** publicar
      reglas antes que la web.

## Definición de terminado

- Se crean hábitos de días fijos, semanales y con cantidad; Hoy muestra cada uno como corresponde.
- Un día que no toca no castiga; un semanal nunca rompe la racha y suma hasta N por semana.
- Con todos los semanales cumplidos, la llama se ve morada hasta el domingo.
- Las reglas aceptan las formas nuevas, rechazan las inválidas y no dejan cambiar frecuencia ni meta.
