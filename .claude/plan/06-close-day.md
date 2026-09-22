# 06 — Cierre de días pendientes

**Objetivo:** que al abrir la app se cierren solos los días anteriores (puntos al saldo, racha, protectores y resúmenes), sin duplicar nada aunque la app esté abierta en dos dispositivos.

## Avance (22-09-2026, oficina) — rama `feat/06-close-day` (sale de `feat/05-habits-today`, que aún no está en `main`)

- `shared`: `addClosedDay` / `addMonthlySpending` / `EMPTY_MONTHLY_COUNTERS` y tipos `MonthlyCounters` / `MonthlySummary` (antes vivían duplicados en los fixtures de test).
- `operations/close-pending-days.ts` con 9 tests contra el emulador (todos los de abajo + reloj adelantado). **Hallazgo:** con dos dispositivos a la vez, el segundo no recibe un conflicto que el SDK reintente, sino `permission-denied` (sus movimientos ya existen y `lastClosedDateKey` avanzó). La operación lo distingue de un rechazo real releyendo el estado en el servidor y sigue con el día siguiente.
- `features/close-day/`: `useClosePendingDays` (cierra cuando `lastClosedDateKey + 1 < hoy`, hay red —`expo-network`— y no está bloqueado; también al volver a primer plano), `DayClosingBanner` ("Actualizando tus días…", resultado con puntos, racha y protectores, o error con "Reintentar") y `closing-summary.ts` (textos, con tests). Primitiva nueva `components/ui/notice-bar.tsx`, que usa también el aviso de escrituras rechazadas.
- **Primer deploy web (22-09-2026):** https://ascua-a9e27.web.app, desde `feat/06-close-day`. `firebase.json` suma una reescritura para `/habits/*` (la ruta dinámica de editar hábito en la exportación estática). Reglas sin cambios desde la fase 03.
- **APK pospuesta por decisión del usuario:** el plan gratis de EAS tiene un cupo mensual de builds; se hará cuando la app esté más madura. Mientras tanto, el uso diario es por la web (también desde el navegador del celular).
- **22-09-2026:** unida a `main` junto con las fases 05 y 07, con el acuerdo del usuario. **Hito de uso diario: 22-09-2026, en la web** (desde el navegador de la PC y del celular). La APK pasa a la fase 09. Queda por comprobar con el uso: 3 cierres seguidos con el saldo y la racha correctos cada mañana (anotarlo en la Bitácora).

## Tareas

- [x] Operación `closePendingDays` según `data-model.md` §7: por cada día desde `lastClosedDateKey + 1` hasta ayer, **una transacción por día**, en orden.
  1. Leer los hábitos fuera de la transacción.
  2. Dentro: leer `meta/gamification`, `dailyLogs/{D}` y `monthlySummaries/{mes}`; confirmar que `lastClosedDateKey + 1 == D` (si no, otro dispositivo ya lo cerró: salir sin hacer nada).
  3. Llamar a `evaluateDay` de `shared`. **Nada de lógica de negocio aquí.**
  4. Escribir `dailyLogs/{D}`, los `pointTransactions`, `meta/gamification` y `monthlySummaries`.
- [x] Disparadores: al abrir la app, al volver a primer plano y al pasar la medianoche de Bolivia con la app abierta.
- [x] Mientras cierra, la UI muestra un estado breve ("Actualizando tus días…") y después el resultado: puntos acreditados y cambios de racha, incluido si se usó un protector.
- [x] Sin conexión: no intenta cerrar; reintenta al recuperar la red.
- [x] Si las reglas rechazan un cierre (por ejemplo, reloj del dispositivo mal configurado), mostrar el error; no reintentar en bucle.

## Tests (emulador)

- Día normal: los documentos quedan exactamente como predice `evaluateDay`.
- **Puesta al día:** con `lastClosedDateKey` 3 días atrás, cierra los 3 en orden.
- **Idempotencia:** ejecutar `closePendingDays` dos veces seguidas no duplica nada.
- **Concurrencia:** dos ejecuciones en paralelo (simulando celular y PC) cierran cada día una sola vez.
- Día sin documento `dailyLogs` → se crea con `missed`, `frozen` o `inactive`.
- Cambio de mes: el resumen va al `monthlySummaries` correcto.

## Definición de terminado

- Tests en verde.
- Usada en el celular real al menos 3 días seguidos, con el saldo y la racha correctos cada mañana.
- **Primera APK real** (`npm run build:apk`) instalada en el celular y **primer deploy web** (`npm run deploy:web` y `npm run deploy:rules`).
- **Hito: uso diario.** A partir de aquí la app se usa todos los días. Anotar en la Bitácora la fecha de inicio: sus datos calibran los puntos en la fase 10.
