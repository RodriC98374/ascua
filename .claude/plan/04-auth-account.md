# 04 — Autenticación y cuenta

**Objetivo:** entrar a la app con tu correo desde Android y web, y que la cuenta se inicialice sola.

**Ya hecho (21-09-2026):** la cuenta del usuario se creó a mano en Firebase Console (Authentication → Users → Agregar usuario) y el registro está **desactivado** (*Enable create (sign-up)* desmarcado). Nadie más puede crear cuentas; la app **no tiene pantalla de registro**.

## Tareas

- [ ] Pantallas de inicio de sesión y recuperación de contraseña (no hay registro).
- [ ] Rutas protegidas con Expo Router: sin sesión → login.
- [ ] Sesión persistente: `AsyncStorage` en Android, persistencia del navegador en web (ya configurado en `src/lib/firebase*.ts`).
- [ ] Operación `initializeAccount` (idempotente): si no existen, crea `users/{uid}` y `meta/gamification` con los valores iniciales (`lastClosedDateKey` = ayer en Bolivia, todo en 0). Se llama después de cada inicio de sesión.
- [ ] Test de `initializeAccount` contra el emulador, incluido llamarla dos veces.
- [x] Lista de `uid` permitidos en las reglas, con el `uid` del usuario (hecho en la fase 03).

## Pasos manuales del usuario

1. ~~Pasar tu `uid`~~ (hecho en la fase 03).
2. Probar que la recuperación de contraseña llega a tu correo.

## Definición de terminado

- Iniciar sesión funciona en el celular y en la PC, y la sesión persiste al cerrar la app o el navegador.
- Existen `users/{uid}` y `meta/gamification` con los valores iniciales correctos.
- Aunque alguien lograra otra cuenta, las reglas no le dejarían leer ni escribir nada (lista de `uid` permitidos).
