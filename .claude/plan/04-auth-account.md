# 04 — Autenticación y cuenta

**Objetivo:** entrar a la app con tu correo, que la cuenta se inicialice sola y que nadie más pueda registrarse.

## Tareas

- [ ] Pantallas de registro, inicio de sesión y recuperación de contraseña (según los mockups).
- [ ] Verificación de correo al registrarse.
- [ ] Rutas protegidas: sin sesión → login.
- [ ] Función `onUserCreated` (trigger de Auth, `firebase-functions/v1`): crea `users/{uid}`, `serverState/gamification` (`lastClosedDateKey` = ayer en Bolivia, todo en 0) y `serverState/reminders`. Idempotente.
- [ ] Test de `onUserCreated` en el emulador.
- [ ] Lista de `uid` permitidos en las reglas (se completa con tu `uid` después de registrarte).

## Pasos manuales del usuario

1. Registrarse en la app desplegada con tu correo real y verificarlo.
2. Pasar tu `uid` (Firebase Console → Authentication) para ponerlo en la lista de permitidos.
3. **Desactivar el registro:** Authentication → Settings → User actions → desmarcar *Enable create (sign-up)*.
4. Probar desde una ventana privada que registrarse con otro correo falla.

## Definición de terminado

- Iniciar sesión en el celular y en la PC funciona; la sesión persiste al cerrar el navegador.
- Existen `users/{uid}` y los dos documentos de `serverState` con valores iniciales correctos.
- Registrarse con otro correo es imposible, y aunque se lograra, las reglas no dejarían leer ni escribir nada.
