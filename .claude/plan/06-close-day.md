# 06 — Cierre del día

**Objetivo:** que cada medianoche se acrediten los puntos, se evalúe la racha y se generen los resúmenes, sin intervención y sin errores de doble conteo.

## Tareas

- [ ] Función programada `closeDay` (00:05, `timeZone: 'America/La_Paz'`, región `southamerica-east1`).
- [ ] Por cada usuario, por cada día pendiente (`lastClosedDateKey + 1` hasta ayer), **una transacción por día**:
  1. Leer `serverState/gamification`, `dailyLogs/{D}` (puede no existir) y los hábitos.
  2. Llamar a `evaluateDay` de `shared`. Nada de lógica de negocio aquí.
  3. Escribir `dailyLogs/{D}` (`status`, `summary`), los `pointTransactions`, `serverState/gamification` y `monthlySummaries/{mes}`.
- [ ] Logs estructurados por día cerrado (fecha, estado, puntos).
- [ ] Reintentos habilitados en la función programada.

## Tests (emulador)

- Día normal: los documentos quedan exactamente como predice `evaluateDay`.
- **Puesta al día:** con `lastClosedDateKey` 3 días atrás, cierra los 3 en orden.
- **Idempotencia:** ejecutar `closeDay` dos veces seguidas no duplica nada.
- Día sin documento `dailyLogs` → se crea con `missed`, `frozen` o `inactive`.
- Cambio de mes: el resumen va al `monthlySummaries` correcto.

## Definición de terminado

- Tests en verde.
- Desplegada y verificada en el proyecto real al menos 3 noches seguidas (revisar los logs).
- **Hito: uso diario.** A partir de aquí la app se usa todos los días. Anotar en la Bitácora la fecha de inicio: sus datos calibran los puntos en la fase 10.
