# 17 — Recordatorios por hábito y estadísticas

**Rama:** `feat/17-reminders-stats`, desde `main`. Elegida por el usuario el 29-09-2026.
**Toca datos:** campo opcional nuevo en `habits` y reglas. Los recordatorios llegan al celular con
el próximo build (`expo-notifications` ya está; no suma módulos nativos).

## Decisiones (D23)

- **Recordatorio por hábito:** hora propia y **días elegidos** (el usuario lo pidió así también
  para los semanales). Es opcional y se puede cambiar o quitar cuando sea, a diferencia de la
  frecuencia. En un hábito de días fijos solo se eligen entre sus días.
- No suena si ese hábito ya está cumplido hoy; en un semanal, tampoco el resto de la semana una
  vez llegado a N. El interruptor general de Ajustes también los apaga. Un hábito archivado no
  avisa.
- Se programan los próximos `HABIT_REMINDER_PLAN_DAYS` (7) días, no 30 como los generales:
  Android limita las alarmas por app (~500) y la app se abre a diario.
- **Mapa de calor y "mejor día" del año leen los `dailyLogs` del año** (elegido por el usuario):
  sin cambiar datos ni reglas. Solo existen los días desde que se usa la app (como máximo 365
  documentos pequeños). El resto de la vista Año sigue saliendo de `monthlySummaries`.

## Modelo

```ts
interface HabitReminder {
  time: string;          // 'HH:mm' de Bolivia
  daysOfWeek: number[];  // 1 = lunes … 7 = domingo; de 1 a 7, sin repetir
}

interface Habit {
  // … lo de siempre
  reminder?: HabitReminder | null;   // sin el campo o null = sin recordatorio
}
```

- **Reglas:** `reminder` opcional, `null` o con forma validada (hora como la de `reminderSettings`,
  días 1–7 sin repetir); en un hábito de días fijos, solo entre sus días.

## Estadísticas nuevas

- **Mapa de calor del año** (Año): una columna por semana y una fila por día (lunes arriba), color
  por % de hábitos cumplidos del día; perfecto en brasa, protegido en azul, hoy con anillo. Tocar
  un día muestra su fecha y su %. En el celular se desplaza de lado y abre en la semana actual.
- **Destacados** (Mes y Año): mejor día de la semana (promedio del % de los días cerrados, con un
  mínimo de días por día de la semana), hábito más constante (mayor %, con un mínimo de días) y,
  solo en Mes, la diferencia contra el mes anterior en puntos porcentuales.

## Tareas

**Núcleo (`shared`, TDD)**
- [ ] Tipos y constantes; validación del recordatorio de un hábito.
- [ ] `planHabitReminders`: días elegidos, hábito activo, cumplido hoy, semanal cumplido.
- [ ] Nivel del mapa de calor, mejor día de la semana, hábito más constante y tendencia.

**Reglas y operaciones (emulador)**
- [ ] `reminder` en `habits`, con tests y mutaciones.
- [ ] `createHabit`/`updateHabit` guardan el recordatorio; converter que lee los hábitos de antes.

**App**
- [ ] Formulario de hábito: "Recordarme" con hora y días.
- [ ] Programar los recordatorios por hábito junto a los generales.
- [ ] Mapa de calor y Destacados en Año; Destacados en Mes.
- [ ] Demo con recordatorios de ejemplo.

**Cierre**
- [ ] Revisión en web, typecheck, lint y tests; `data-model.md` al día; revisión del usuario.
      **Toca reglas:** publicar reglas antes que la web.

## Definición de terminado

- Un hábito guarda, cambia y quita su recordatorio; las reglas rechazan horas mal formadas, días
  fuera de 1–7 o repetidos, y días que un hábito de días fijos no tiene.
- El plan de avisos cumple las reglas de arriba (probado en `shared`).
- Año muestra el mapa de calor y los destacados; Mes, sus destacados con la tendencia. Las cifras
  coinciden con las de la grilla y los resúmenes.
