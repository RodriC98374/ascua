# 08 — Estadísticas y gráficas

**Objetivo:** ver el progreso semanal, mensual y anual con gráficas interactivas.

## Avance (22-09-2026, oficina) — rama `feat/08-statistics` (sale de `main`)

- `shared`: `periods.ts` (semana de lunes a domingo, mes, año; navegación y etiquetas) y
  `statistics.ts` (`buildRangeStats`, `buildYearStats`): cada día con su estado, los hábitos que
  contaban ese día y las cifras de los días cerrados, sumadas con `addClosedDay` para que
  coincidan con `monthlySummaries`. `format-date` suma los formatos de mes, rango y día corto.
- Lecturas dentro de lo que fija `data-model.md` §9: semana ≤ 7 registros, mes ≤ 31 y año ≤ 12
  resúmenes (`useDailyLogsInRange`, `useMonthlySummaries`). `useQuery` ya no muestra los datos de
  la consulta anterior al cambiar de periodo.
- UI en `features/statistics/` y pestaña Mes (`app/(app)/(tabs)/mes.tsx`): selector Semana / Mes /
  Año con flechas (no pasa de hoy ni del primer día con hábitos), tarjeta de resumen, grilla
  hábito × día con las semanas coloreadas, detalle del día, gráfica de racha, barras de % por
  hábito, barras por día en la semana y línea por mes en el año. Tocar un día abre su detalle;
  tocar un hábito lo resalta y, en el año, filtra la gráfica y los meses a ese hábito.
- Las gráficas son de `react-native-gifted-charts`, pero el toque lo maneja una capa propia de
  columnas `Pressable` sobre la gráfica (`chart-parts.tsx`): funciona igual en Android y en web,
  sin depender de los eventos de los elementos SVG de la librería.
- Primitiva nueva `components/ui/segmented-control.tsx`; íconos `Snowflake` (del diseño),
  `Chevron` y `Close`. Se borró `components/coming-soon.tsx`, que ya no usa nadie.
- Revisado en el navegador a 360 px y en escritorio, con los datos de ejemplo de abajo: mes con
  día perfecto y día protegido, semana, año, meses anteriores y filtro por hábito.
- Falta: prueba del usuario y verlo en Android (fase 09).

## Cómo probarlo con datos

La cuenta real recién empieza, así que las vistas se prueban con datos de ejemplo **en los
emuladores locales**; el proyecto real no se toca.

1. `npm run emulators` (necesita Java).
2. En otra terminal, `npm run seed:demo`: vacía los emuladores y siembra unos 80 días cerrados,
   compras de protectores y canjes, generados con la lógica real de `shared`.
3. Desde `apps/client`, con los emuladores encendidos:
   `$env:EXPO_PUBLIC_USE_EMULATORS="true"; npx expo start --web --port 8082`. El puerto distinto
   del habitual evita que la caché del navegador se mezcle con la de producción.
4. Entrar con `demo@ascua.test` / `demo1234`.

## Tareas

- [x] Vista **Semana**: `dailyLogs` de lunes a domingo; % por día, estado de racha por día.
- [x] Vista **Mes**: grilla de checks coloreada por semana (según el sistema de diseño), % por día y barras horizontales de % por hábito.
- [x] Vista **Año**: desde `monthlySummaries`; línea de % mensual, barras por hábito (sumando `habitStats`), conteo de días perfectos, protegidos y perdidos.
- [x] Gráfica de racha a lo largo del tiempo (`summary.streakAfterClose`).
- [x] Navegación entre periodos (anterior/siguiente) y selector de periodo.
- [x] Interacción: tooltip al tocar, y tocar un día o hábito filtra el detalle.
- [x] Funciones de agregación puras en `packages/shared`, con tests.
- [x] Las gráficas funcionan igual en Android y en web.

## Definición de terminado

- Ninguna vista lee más documentos de los indicados en `data-model.md` §9 (verificarlo en el panel de uso de Firestore).
- Las gráficas son legibles a 360 px y responden al toque.
- Los números coinciden con los de `meta/gamification` y `monthlySummaries`.
