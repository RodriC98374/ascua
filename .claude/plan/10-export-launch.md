# 10 — Exportación y cierre del MVP

**Objetivo:** respaldo de datos, sistema de puntos equilibrado, APK final y MVP cerrado.

## Tareas

**Exportación**
- [ ] En Ajustes, descargar un **JSON** con todas las colecciones del usuario (respaldo completo, restaurable a futuro).
- [ ] **CSV** de hábitos por día (una fila por día y una columna por hábito) y CSV de movimientos de puntos.
- [ ] Fechas exportadas como `DateKey` e instantes en ISO con zona horaria.
- [ ] En Android se guarda o comparte el archivo con la hoja de compartir del sistema; en web se descarga.

**Calibración de puntos (decisión D9)**
- [ ] Con al menos 3 semanas de uso real (desde el hito de la fase 06), calcular los puntos promedio ganados por semana.
- [ ] Revisar con el usuario el costo del protector (150), los rangos de recompensas y los bonos. Objetivo de equilibrio: una recompensa pequeña cada 2–4 días, una mediana por semana y una grande por mes de constancia.
- [ ] Si cambian valores: actualizar `constants.ts`, `firestore.rules`, `data-model.md` y `rules/domain-invariants.md`, y registrar la decisión en el README con fecha. El historial no se recalcula (los movimientos guardan su monto).

**Cierre**
- [ ] APK final con el perfil de producción de EAS, instalada en el celular. EAS Update configurado para cambios posteriores.
- [ ] Revisar en la consola de Firebase que el uso quede holgadamente dentro de la cuota de Spark.
- [ ] Actualizar el Estado y la Bitácora; marcar el MVP como cerrado.

## Definición de terminado

- El JSON exportado contiene todos los datos y se abre sin errores.
- Los valores de puntos quedaron confirmados por el usuario y documentados.
- Un cambio menor publicado con EAS Update llega a la app instalada sin reinstalar.
- Ninguna fase anterior tiene tareas pendientes.
