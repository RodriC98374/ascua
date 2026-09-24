# 12 — Racha en riesgo e hitos

**Rama:** `feat/12-streak-risk-milestones` (sale de `main`, con la fase 11 ya unida). Primera fase
de la hoja de ruta después del MVP ([roadmap.md](roadmap.md), D18), elegida por el usuario el
24-09-2026. **Sin cambios de datos ni de reglas.**

## Qué se hizo

**Racha en riesgo** (aversión a la pérdida, como Duolingo)
- `shared/streak-risk.ts` (TDD): `streakRiskAt` decide si avisar y qué decir; `formatTimeLeft`
  ("2 h 35 min", "menos de 1 min"). Avisa desde la hora de **racha en riesgo** de los
  recordatorios (`reminderSettings.streakRiskReminderTime`, 21:00 por defecto; se usa aunque los
  avisos estén apagados) si hay principales y la meta no está cumplida. La cuenta es hasta la
  medianoche de Bolivia.
- Tres casos: `save` (hay racha y ningún protector: "Quedan 2 h para salvar tu racha de 12
  días"), `freeze` (un protector la salvará) y `start` (no hay racha: "para encender tu racha").
- En Hoy, una franja `warning-soft` arriba de la tarjeta principal (`streak-risk-band.tsx`, texto
  en `streak-risk-text.ts` con test). `useMinuteClock` refresca al empezar cada minuto y al volver
  a primer plano. El perfil no frena la pantalla: mientras llega se usa la hora por defecto.

**Hitos de racha**
- `STREAK_MILESTONES = [7, 30, 100, 365]` en `constants.ts`; `shared/milestones.ts` (TDD):
  `milestoneReached(from, to)` y `milestoneProgress(longest, current)`. Las insignias **se derivan
  de `longestStreak`**: no se guardan y no se pierden aunque la racha vuelva a empezar. Distintas
  de los bonos de 7/30 (que dan puntos en cada múltiplo).
- Insignias SVG (`features/milestones/streak-badge.tsx`): una forma por hito (círculo, hexágono,
  sol de 8 y de 12 puntas) en el degradado de la brasa; bloqueadas en `surface-300`.
- Celebración: si la racha de hoy llega exactamente a un hito, la brasa se cambia por la insignia,
  con más chispas, y el título "¡Insignia de 7 días!" con su frase (`MILESTONE_MESSAGES`). Se
  celebra cada vez que se alcanza el número, aunque la insignia ya estuviera ganada.
- Mes → Año (solo el año actual): tarjeta "Insignias de racha" con las cuatro, cuánto falta para
  la próxima y una barra de la racha actual hacia ella.

Revisado con Edge headless contra los emuladores: franja en claro y oscuro (con la hora de riesgo
cambiada a las 08:00 desde Ajustes), insignias en Año y celebración del hito de 7 (racha puesta en
6 en el emulador). Tests: shared 227 (100 %), reglas 157, cliente 110.

## Pendiente

- [ ] Revisión del usuario en la web (canal de vista previa) y visto bueno para unir a `main`.
- [ ] Verla en el celular con el próximo build.

## Definición de terminado

- La franja aparece a la hora configurada, cuenta bien hasta la medianoche de Bolivia y desaparece
  al cumplir la meta.
- Cada hito se celebra con su insignia, y la tarjeta de Año muestra las ganadas y la próxima.
