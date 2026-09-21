# 04 — Autenticación y cuenta

**Objetivo:** entrar a la app con tu correo desde Android y web, que la cuenta se inicialice sola y que nadie más pueda registrarse.

## Tareas

- [ ] Pantallas de registro, inicio de sesión y recuperación de contraseña.
- [ ] Verificación de correo al registrarse.
- [ ] Rutas protegidas con Expo Router: sin sesión → login.
- [ ] Sesión persistente: `AsyncStorage` en Android, persistencia del navegador en web.
- [ ] Operación `initializeAccount` (idempotente): si no existen, crea `users/{uid}` y `meta/gamification` con los valores iniciales (`lastClosedDateKey` = ayer en Bolivia, todo en 0). Se llama después de cada inicio de sesión.
- [ ] Test de `initializeAccount` contra el emulador, incluido llamarla dos veces.
- [ ] Lista de `uid` permitidos en las reglas (se completa con tu `uid` después de registrarte).

## Pasos manuales del usuario

1. Registrarse con tu correo real (desde la web o la APK) y verificarlo.
2. Pasar tu `uid` (Firebase Console → Authentication) para ponerlo en la lista de permitidos.
3. **Desactivar el registro:** Authentication → Settings → User actions → desmarcar *Enable create (sign-up)*.
4. Probar desde una ventana privada que registrarse con otro correo falla.

## Definición de terminado

- Iniciar sesión funciona en el celular y en la PC, y la sesión persiste al cerrar la app o el navegador.
- Existen `users/{uid}` y `meta/gamification` con los valores iniciales correctos.
- Registrarse con otro correo es imposible, y aunque se lograra, las reglas no dejarían leer ni escribir nada.
