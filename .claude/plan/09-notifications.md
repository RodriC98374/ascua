# 09 — Recordatorios (notificaciones locales en Android)

**Objetivo:** recordatorios confiables para no perder la racha. Es un requisito central, no un extra.

Son **notificaciones locales** (`expo-notifications`): las programa la app en el celular, como una alarma. Sin servidor ni push; funcionan sin internet. Solo en Android (D14).

## Avance (23-09-2026, oficina) — rama `feat/09-notifications` (sale de `main`)

Todo el código de los recordatorios quedó escrito **antes** de la primera APK, para gastar un
solo build del cupo de EAS.

- `shared`: `toInstant(dateKey, 'HH:mm')` en `dates.ts` (instante exacto de una hora de Bolivia,
  con Intl) y `planReminders` en `reminders.ts`, con TDD. Devuelve los avisos de los próximos
  `REMINDER_PLAN_DAYS` (30) días con ID determinista (`daily-<dateKey>`, `streak_risk-<dateKey>`),
  sin los que ya pasaron y sin el de racha en riesgo de hoy si la meta está cumplida o no hay
  hábitos programados.
- **Por qué triggers de fecha y no `DAILY`:** el trigger diario de `expo-notifications` usa la hora
  local del celular; con instantes calculados en Bolivia se respeta la invariante de zona horaria
  y "cancelar solo el de hoy" sale natural. Se reprograma todo al abrir la app, así que solo dejan
  de llegar si pasan 30 días sin abrirla.
- Cliente, en `features/reminders/`: `reminder-requests.ts` (textos, con test), `device-notifications.ts`
  (canal `reminders`, permiso, programación en fila y sin repetir si el plan no cambió) y su
  versión `.web.ts` que no hace nada; `RemindersProvider` en `app/(app)/_layout.tsx` reprograma al
  abrir, al cambiar horarios y al marcar, abre Hoy al tocar el aviso y cancela todo al cerrar
  sesión.
- Ajustes: sección Recordatorios con interruptor, horario diario y de racha en riesgo (primitivas
  nuevas `Toggle` y `TimeField`, selector propio de hora y minutos cada 5, igual en Android y web).
  En Android, si falta el permiso se pide ahí con una explicación; si está bloqueado, botón a los
  ajustes del celular. En web explica que los avisos llegan al celular. Operación
  `updateReminderSettings` con test contra el emulador.
- `app.json`: plugin `expo-notifications` (ícono monocromo y color de marca) y permisos
  `SCHEDULE_EXACT_ALARM` + `USE_EXACT_ALARM` (sin Play Store no hay objeción de política; así la
  alarma es exacta en Android 12+).
- Probado en web con los emuladores: la sección, el selector y el guardado. **Sin probar en
  Android:** todo lo que depende de la APK.

## Tareas

**Primero: la primera APK (pendiente de las fases 05 y 06)**

Las notificaciones solo se prueban en el celular, así que esta fase empieza con la primera APK (el plan gratis de EAS tiene un cupo mensual de builds: juntar cambios antes de cada build).
- [ ] `npm run build:apk` e instalarla en el celular.
- [ ] Revisar en Android lo que en web ya funciona: sombras (`elevation`), fuentes, degradados, `LineChart` animada, teclado sobre los formularios.
- [ ] Lo marcado en el celular aparece en la PC en segundos, y viceversa.
- [ ] Sin conexión se puede marcar; al volver la red, sincroniza y el indicador "Pendiente" desaparece.
- [ ] El cierre de días funciona al abrir la APK al día siguiente.

**Recordatorios**
Código hecho; las casillas marcadas con (APK) faltan comprobarlas en el celular.
- [x] Pedir permiso de notificaciones en un momento explicado (no al abrir la app por primera vez). Android 13+ lo exige explícitamente. (APK)
- [x] Canal de notificaciones de Android con nombre e importancia adecuados. (APK)
- [x] Ajustes: activar o desactivar, y elegir la hora de cada recordatorio (se guarda en `reminderSettings` del perfil, editable también desde la web).
- [x] Operación `scheduleReminders`, a partir de `reminderSettings` y del estado del día: (APK)
  - **Diario:** se repite todos los días a `dailyReminderTime`.
  - **Racha en riesgo:** se programa a `streakRiskReminderTime`. Al cumplir la meta de hoy, se cancela la de hoy y queda la de mañana.
- [x] Se ejecuta al abrir la app, al cambiar los ajustes y al marcar o desmarcar hábitos. (APK)
- [x] Tocar la notificación abre la app en "Hoy". (APK)
- [x] En web: la sección de recordatorios explica que los avisos llegan al celular.
- [x] Lógica de qué y cuándo programar como función pura en `shared`, con tests.

## Definición de terminado

- Con la app cerrada, el recordatorio llega a la hora exacta configurada.
- Cambiar la hora en Ajustes cambia la notificación sin reinstalar nada.
- El aviso de racha en riesgo no llega si la meta ya se cumplió en el celular.
- Siguen llegando después de reiniciar el celular.

## Riesgos

- El ahorro de batería de algunas marcas de Android retrasa o bloquea notificaciones. Si pasa, documentar en Ajustes cómo excluir la app de la optimización de batería.
- Limitación aceptada: si la meta se cumple desde la PC y el celular no se abre antes de la hora, el aviso de racha en riesgo llega igual (`data-model.md` §8).
