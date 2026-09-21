# 09 — Notificaciones push

**Objetivo:** recordatorios confiables para no perder la racha. Es un requisito central, no un extra.

## Tareas

**Cliente**
- [ ] Pedir permiso de notificaciones en un momento explicado (no al abrir la app por primera vez).
- [ ] Integrar FCM en el mismo service worker de `vite-plugin-pwa` (estrategia `injectManifest`). **Un solo service worker**; dos compiten y rompen la PWA.
- [ ] Registrar o refrescar el token en `devices/{sha256(token)}` al abrir la app; actualizar `lastSeenAt`.
- [ ] Ajustes: activar o desactivar, horas de los dos recordatorios y lista de dispositivos.
- [ ] Tocar la notificación abre la app en "Hoy".

**Servidor**
- [ ] Función programada `sendReminders` cada 15 minutos:
  - Recordatorio diario a `dailyReminderTime`.
  - Racha en riesgo a `streakRiskReminderTime`, **solo si la meta de hoy no está cumplida**.
  - Deduplicar con `serverState/reminders`.
  - Borrar tokens que FCM reporte como inválidos.
- [ ] Tests con el emulador (el envío a FCM se simula).

## Definición de terminado

- En el celular llega el push con la app cerrada, a la hora configurada ±15 min.
- El aviso de racha en riesgo no llega si la meta ya está cumplida.
- Nunca llegan dos avisos iguales el mismo día.
- La PWA sigue funcionando offline después de integrar FCM.

## Riesgos

- Android puede retrasar notificaciones con el ahorro de batería activo. Si pasa, documentar en ajustes cómo excluir la app.
