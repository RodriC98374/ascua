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
- **Al probarlo, el usuario pidió más color:** la app se veía monocromática. De ahí salió la
  revisión de la paleta y las categorías por hábito, en la rama `feat/01-palette-categories`
  (ver [01-design-system.md](01-design-system.md)). La grilla, las barras y la línea del año usan
  ahora el color de cada hábito.
- En la misma rama se sumaron dos gráficas que faltaban de la lista de ideas: **donut** de la
  semana (`habit-donut.tsx`, `PieChart` de la librería) con el reparto de lo cumplido por hábito, y
  **radar** por categoría en el año (`category-radar.tsx`). El radar va dibujado a mano con
  `react-native-svg` porque `react-native-gifted-charts` no trae uno; su agregación es
  `buildCategoryStats` en `shared`, que suma los días de cada categoría en vez de promediar los
  porcentajes de sus hábitos.
- **23-09-2026:** aprobada por el usuario, reglas y web publicadas, ramas unidas a `main`. Queda
  verla en Android (fase 09) y comprobar las lecturas en el panel de uso de Firestore cuando haya
  datos reales.

## Cómo probarlo con datos

La cuenta real recién empieza, así que las vistas se prueban con datos de ejemplo **en los
emuladores locales**; el proyecto real no se toca. Todo con un comando (necesita Java en el PATH):

- `npm run demo`: enciende los emuladores de Auth y Firestore (o usa los que ya estén
  encendidos), siembra unos 80 días cerrados con compras de protectores y canjes (lógica real de
  `shared`) y abre la web de desarrollo en `http://localhost:8082` conectada a ellos. El puerto
  distinto del habitual evita que la caché del navegador se mezcle con la de producción.
- Entrar con `demo@ascua.test` / `demo1234`. Datos en vivo en la UI de emuladores (`:4000`).
- **Ctrl+C** cierra Expo y apaga los emuladores: los datos desaparecen (viven en memoria).
- Opciones: `npm run demo -- --streak=6` llega a hoy con esa racha exacta y dos principales
  sin marcar; la historia anterior nunca la supera, así que al marcarlos se celebra el hito
  (6 → insignia de 7, 29 → de 30, 99 → de 100, 364 → de 365; 0 → franja "enciende tu racha").
  `--risk` pone la hora de racha en riesgo a las 00:00 para ver la franja a cualquier hora.
- `npm run seed:demo` (mismas opciones) solo vuelve a sembrar, con los emuladores encendidos.
- La celebración de racha sale una vez por día en cada navegador: para repetirla, ventana
  privada. En modo desarrollo sale un aviso rojo "Unknown event handler property" al abrir
  gráficas de línea: viene de `react-native-gifted-charts` en web, no afecta y no sale en la
  web publicada.
- Código: `packages/firestore-rules/scripts/` (`demo-data.ts` siembra, `demo.ts` orquesta).

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
