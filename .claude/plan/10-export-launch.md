# 10 — Exportación y cierre del MVP

**Objetivo:** respaldo de datos, sistema de puntos equilibrado y MVP cerrado.

## Tareas

**Exportación**
- [ ] Botón en ajustes que descarga **JSON** con todas las colecciones del usuario (respaldo completo, restaurable a futuro).
- [ ] **CSV** de hábitos por día (una fila por día y columnas por hábito) y CSV de movimientos de puntos.
- [ ] Fechas exportadas como `DateKey` e instantes en ISO con zona horaria.

**Calibración de puntos (decisión D9)**
- [ ] Con al menos 3 semanas de uso real (desde el hito de la fase 06), calcular los puntos promedio ganados por semana.
- [ ] Revisar con el usuario: costo del protector (150), rangos de recompensas y bonos. Objetivo de equilibrio: una recompensa pequeña cada 2–4 días, una mediana por semana y una grande por mes de constancia.
- [ ] Si cambian valores: actualizar `constants.ts`, `data-model.md`, `rules/domain-invariants.md` y registrar la decisión en el README con fecha. El historial no se recalcula (los movimientos guardan su monto).

**Cierre**
- [ ] Revisión de rendimiento en el celular (Lighthouse: PWA instalable, performance aceptable).
- [ ] Revisar la alerta de presupuesto y el consumo real del mes.
- [ ] Actualizar el Estado y la Bitácora; marcar el MVP como cerrado.

## Definición de terminado

- El JSON exportado contiene todos los datos y se abre sin errores.
- Los valores de puntos quedaron confirmados por el usuario y documentados.
- Ninguna fase anterior tiene tareas pendientes.
