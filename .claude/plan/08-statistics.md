# 08 — Estadísticas y gráficas

**Objetivo:** ver el progreso semanal, mensual y anual con gráficas interactivas.

## Tareas

- [ ] Vista **Semana**: `dailyLogs` de lunes a domingo; % por día, estado de racha por día.
- [ ] Vista **Mes**: grilla de checks coloreada por semana (según el sistema de diseño), % por día y barras horizontales de % por hábito.
- [ ] Vista **Año**: desde `monthlySummaries`; línea de % mensual, barras por hábito (sumando `habitStats`), conteo de días perfectos, protegidos y perdidos.
- [ ] Gráfica de racha a lo largo del tiempo (`summary.streakAfterClose`).
- [ ] Navegación entre periodos (anterior/siguiente) y selector de periodo.
- [ ] Interacción: tooltip al tocar, y tocar un día o hábito filtra el detalle.
- [ ] Funciones de agregación puras en `packages/shared`, con tests.
- [ ] Las gráficas funcionan igual en Android y en web.

## Definición de terminado

- Ninguna vista lee más documentos de los indicados en `data-model.md` §9 (verificarlo en el panel de uso de Firestore).
- Las gráficas son legibles a 360 px y responden al toque.
- Los números coinciden con los de `meta/gamification` y `monthlySummaries`.
