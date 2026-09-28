# 15 — Check-in diario

**Rama:** `feat/15-check-in`, sale de `feat/16-flexible-habits` (toca los mismos archivos: registro
del día, reglas, converters). Se une a `main` **después** de la 16. Elegida por el usuario el
28-09-2026. **Toca datos:** campo nuevo en `DailyLog` y en `MonthlySummary`, y reglas.

## Decisiones (D22)

- Tres escalas de **1 a 5**: **ánimo, energía y motivación** (el usuario cambió "foco" por
  "motivación"; los requerimientos originales mencionaban las cuatro).
- **No da puntos** ni toca la racha o el día perfecto: sirve para conocerse, no para ganar.
- **Solo hoy**, como las marcas: a las 00:00 de Bolivia el día deja de aceptar cambios. Cada
  escala se contesta sola (se puede dejar alguna sin contestar) y tocar el valor elegido lo borra.
- Promedios: en semana y mes, de los días con respuesta (hoy incluido, se ve al instante); en el
  año, de los días cerrados, desde `monthlySummaries` (como el resto del año).

## Modelo

```ts
const CHECK_IN_DIMENSIONS = ['mood', 'energy', 'motivation'] as const;
type CheckIn = Partial<Record<CheckInDimension, number>>;   // 1..5; sin la clave = sin contestar

interface DailyLog {
  // … lo de siempre
  checkIn?: CheckIn;              // opcional: los registros de antes no lo traen
}

interface MonthlyCounters {
  // … lo de siempre
  checkInStats: Partial<Record<CheckInDimension, { days: number; total: number }>>;
}
```

- `checkInStats` guarda suma y días, no el promedio: así se suma día a día al cerrar y se juntan
  los meses del año sin perder precisión. Los resúmenes de antes no lo traen: se leen como `{}`.
- **Reglas:** `checkIn` se escribe con las marcas (solo hoy, solo esas tres claves, enteros de 1 a
  5); el cierre no lo cambia y un día cerrado sin registro se crea sin él. `checkInStats` se valida
  en forma (como `habitStats`, sin recorrer sumas) y un gasto no lo cambia.

## Tareas

**Núcleo (`shared`, TDD)**
- [x] Tipos y constantes; `addClosedDay` y `mergeMonthlyCounters` con `checkInStats`.
- [x] Promedios por escala; `RangeStats.checkIn` (días y promedios) y `YearStats.checkInAverages`.
- [x] Exportación con las tres escalas por día.

**Reglas y operaciones (emulador)**
- [x] `checkIn` en `dailyLogs` y `checkInStats` en `monthlySummaries`, con tests.
- [x] `setCheckIn` (marcar y borrar una escala); `closePendingDays` suma el check-in al mes.

**App**
- [x] Tarjeta "¿Cómo estás hoy?" en Hoy.
- [x] "Cómo te sentiste" en Mes (semana y mes) y en Año: promedios y una línea por escala.
- [x] Demo con check-ins.

**Cierre**
- [ ] Revisión en web, typecheck, lint y tests; `data-model.md` al día; revisión del usuario.
      **Toca reglas:** publicar reglas antes que la web.

## Definición de terminado

- Hoy guarda las tres escalas al instante y solo hoy; las reglas rechazan valores fuera de 1–5,
  claves desconocidas y cambios en días pasados.
- Mes y Año muestran los promedios y la línea de cada escala; los números coinciden con
  `monthlySummaries`.
- El check-in no cambia puntos, racha ni día perfecto.
