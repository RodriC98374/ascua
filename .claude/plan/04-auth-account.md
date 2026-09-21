# 04 — Autenticación y cuenta

**Objetivo:** entrar a la app con tu correo desde Android y web, y que la cuenta se inicialice sola.

**Ya hecho (21-09-2026):** la cuenta del usuario se creó a mano en Firebase Console (Authentication → Users → Agregar usuario) y el registro está **desactivado** (*Enable create (sign-up)* desmarcado). Nadie más puede crear cuentas; la app **no tiene pantalla de registro**.

## Tareas

- [x] Pantallas de inicio de sesión y recuperación de contraseña (no hay registro): `src/app/sign-in.tsx`, `src/app/forgot-password.tsx`.
- [x] Rutas protegidas con `Stack.Protected` en `src/app/_layout.tsx`: sin sesión → login; con sesión → grupo `(app)`.
- [x] Sesión persistente: `AsyncStorage` en Android, persistencia del navegador en web (`src/lib/firebase*.ts`). Correos de Firebase en español (`auth.languageCode = 'es'`).
- [x] Operación `initializeAccount` (`src/operations/initialize-account.ts`): transacción que crea solo lo que falte. `src/app/(app)/_layout.tsx` no muestra la app hasta que termina; si falla, pantalla con "Reintentar".
- [x] Tests de `initializeAccount` contra el emulador (`packages/firestore-rules/src/operations/`): primera vez, segunda vez, dos dispositivos a la vez, cuenta a medias, no pisa un estado existente, usuario no permitido.
- [x] Mensajes de error de login y recuperación en español, sin revelar qué correos existen (`src/features/auth/auth-errors.ts`, con tests).
- [x] Tokens del sistema de diseño (tema claro) en `tailwind.config.js` y fuentes Baloo 2 / Nunito con `@expo-google-fonts`.
- [x] Lista de `uid` permitidos en las reglas, con el `uid` del usuario (hecho en la fase 03).

## Pasos manuales del usuario

1. ~~Pasar tu `uid`~~ (hecho en la fase 03).
2. Probar que la recuperación de contraseña llega a tu correo.

## Definición de terminado

- Iniciar sesión funciona en el celular y en la PC, y la sesión persiste al cerrar la app o el navegador.
- Existen `users/{uid}` y `meta/gamification` con los valores iniciales correctos.
- Aunque alguien lograra otra cuenta, las reglas no le dejarían leer ni escribir nada (lista de `uid` permitidos).
