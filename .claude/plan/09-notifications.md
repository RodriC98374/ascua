# 09 — Recordatorios (notificaciones locales en Android)

**Objetivo:** recordatorios confiables para no perder la racha. Es un requisito central, no un extra.

Son **notificaciones locales** (`expo-notifications`): las programa la app en el celular, como una alarma. Sin servidor ni push; funcionan sin internet. Solo en Android (D14).

## Tareas

- [ ] Pedir permiso de notificaciones en un momento explicado (no al abrir la app por primera vez). Android 13+ lo exige explícitamente.
- [ ] Canal de notificaciones de Android con nombre e importancia adecuados.
- [ ] Ajustes: activar o desactivar, y elegir la hora de cada recordatorio (se guarda en `reminderSettings` del perfil, editable también desde la web).
- [ ] Operación `scheduleReminders`, a partir de `reminderSettings` y del estado del día:
  - **Diario:** se repite todos los días a `dailyReminderTime`.
  - **Racha en riesgo:** se programa a `streakRiskReminderTime`. Al cumplir la meta de hoy, se cancela la de hoy y queda la de mañana.
- [ ] Se ejecuta al abrir la app, al cambiar los ajustes y al marcar o desmarcar hábitos.
- [ ] Tocar la notificación abre la app en "Hoy".
- [ ] En web: la sección de recordatorios explica que los avisos llegan al celular.
- [ ] Lógica de qué y cuándo programar como función pura en `shared`, con tests.

## Definición de terminado

- Con la app cerrada, el recordatorio llega a la hora exacta configurada.
- Cambiar la hora en Ajustes cambia la notificación sin reinstalar nada.
- El aviso de racha en riesgo no llega si la meta ya se cumplió en el celular.
- Siguen llegando después de reiniciar el celular.

## Riesgos

- El ahorro de batería de algunas marcas de Android retrasa o bloquea notificaciones. Si pasa, documentar en Ajustes cómo excluir la app de la optimización de batería.
- Limitación aceptada: si la meta se cumple desde la PC y el celular no se abre antes de la hora, el aviso de racha en riesgo llega igual (`data-model.md` §8).
