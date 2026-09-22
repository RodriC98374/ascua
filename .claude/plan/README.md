# Plan del MVP — Habit Tracker (Android + web)

> **Documento de trabajo.** Se versiona en git para poder continuar desde cualquier máquina. Al terminar cada sesión, actualizar **Estado** y **Bitácora**.

- **Requerimientos:** [../requirements.md](../requirements.md)
- **Modelo de datos:** [../data-model.md](../data-model.md)
- **Reglas para Claude:** [../rules/](../rules/)
- **Repositorio:** https://github.com/RodriC98374/ascua
- **Proyecto Firebase:** `ascua-a9e27` (plan Spark, Firestore en `southamerica-east1`)
- **Estado:** ver la tabla [Estado](#estado) y la [Bitácora](#bitácora).
- **Web publicada:** https://ascua-a9e27.web.app

## Arquitectura en una frase

Una sola app en **Expo** (React Native) genera la **APK de Android** y la **versión web**. Los datos viven en **Firebase Spark** (gratis, sin tarjeta). No hay servidor: la app ejecuta todas las operaciones y las reglas de Firestore las validan. Los recordatorios son notificaciones locales del celular.

## Cómo leer este plan

En orden. Cada fase es autocontenida, pero asume las decisiones de este README. Una fase se considera terminada cuando se cumple su **Definición de terminado**, no antes.

| # | Archivo | Resultado | Depende de |
|---|---|---|---|
| 00 | [00-foundations.md](00-foundations.md) | Monorepo, Firebase, emuladores, APK de prueba en el celular y web desplegada | — |
| 01 | [01-design-system.md](01-design-system.md) | Sistema de diseño (paleta, tipografía, componentes) y pantallas clave, aprobados | — (paralelo a 00) |
| 02 | [02-shared-core.md](02-shared-core.md) | Tipos, constantes, fechas Bolivia y lógica pura del cierre, con TDD | 00 |
| 03 | [03-security-rules.md](03-security-rules.md) | `firestore.rules` completas y probadas, incluidas las operaciones sensibles | 02 |
| 04 | [04-auth-account.md](04-auth-account.md) | Login e inicialización de la cuenta (el registro ya está cerrado) | 03 |
| 05 | [05-habits-today.md](05-habits-today.md) | CRUD de hábitos y pantalla "Hoy" en Android y web | 01, 04 |
| 06 | [06-close-day.md](06-close-day.md) | Cierre de días pendientes al abrir la app | 05 |
| — | **Hito: uso diario** | La app se usa todos los días desde el celular y empieza a juntar datos reales | 06 |
| 07 | [07-points-rewards.md](07-points-rewards.md) | Historial de puntos, protectores, recompensas y canjes | 06 |
| 08 | [08-statistics.md](08-statistics.md) | Vistas de semana, mes y año con gráficas | 06 |
| 09 | [09-notifications.md](09-notifications.md) | Recordatorios locales en Android | 06 |
| 10 | [10-export-launch.md](10-export-launch.md) | Exportación CSV/JSON, calibración de puntos, APK final, cierre del MVP | 07, 08, 09 |

Las fases 07, 08 y 09 son independientes entre sí; se pueden hacer en cualquier orden.

## Decisiones tomadas

Confirmadas por el usuario. **No volver a preguntarlas ni cambiarlas durante la implementación.**

| # | Fecha | Decisión | Consecuencia práctica |
|---|---|---|---|
| D1 | 21-09-2026 | Firebase: Firestore, Auth por email y Hosting (para la web) | Sin Cloud Functions ni FCM |
| D2 | 21-09-2026 | **Expo** (React Native + React Native Web): un solo código para la APK de Android y la web | Reemplaza la PWA en React. Sin Recharts ni Tailwind directo (ver E6) |
| D3 | 21-09-2026 | **Monorepo** con npm workspaces: `apps/client`, `packages/shared` | Una sola fuente para tipos, constantes, fechas y lógica de negocio |
| D4 | 21-09-2026 | Todo en hora de Bolivia (`America/La_Paz`) | Helper único de fechas en `packages/shared` |
| D5 | 21-09-2026 | Meta de racha = todos los principales. Tres resultados: perdida, activa, perfecta | "Perfecta" no es un estado: es `completed` + `isPerfectDay` |
| D6 | 21-09-2026 | Bonos de 7 y 30 días **recurrentes** en cada múltiplo | El día 210 da ambos bonos |
| D7 | 21-09-2026 | El día protegido conserva la racha sin sumarla | `status: 'frozen'` |
| D8 | 21-09-2026 | **Sin margen de gracia** para días pasados | Las reglas solo aceptan escrituras sobre el día de hoy |
| D9 | 21-09-2026 | Rangos de costo de recompensas = sugerencia | Se calibran en la fase 10 con datos reales |
| D10 | 21-09-2026 | Código en inglés; comentarios, commits, documentación y UI en español | Prefijo de Conventional Commits en inglés. Sin atribución a IA |
| D11 | 21-09-2026 | `.claude/` se **versiona** en git | Plan y reglas disponibles en cualquier máquina |
| D12 | 21-09-2026 | **Costo cero:** Firebase Spark sin tarjeta, sin Cloud Functions, sin GitHub Actions ni otros servidores | La app ejecuta las operaciones; las reglas de Firestore las validan |
| D13 | 21-09-2026 | **La app cierra los días pendientes al abrirse** | La UI muestra racha y puntos al instante; el saldo oficial se actualiza al cerrar el día. Los puntos de hoy se gastan desde mañana |
| D14 | 21-09-2026 | **Notificaciones locales solo en Android**, con horario configurable desde la app | Sin push ni servidor. La web no notifica |
| D15 | 21-09-2026 | Sistema de diseño en **Claude Design** en lugar de mockups HTML | Lo lee Claude como código; Figma queda descartado |
| D16 | 21-09-2026 | **Navegación de 4 pestañas: Hoy / Mes / Recompensas / Ajustes** | Elegida por el usuario (el diseño tenía 3). Todo lo de hábitos vive en Hoy (22-09-2026): crear con el botón flotante "+", editar y archivar con el menú de tres puntos (archivar con modal), "Ordenar" en la cabecera de la lista. Los formularios se abren dentro de la pestaña Hoy, con la navegación visible. Ajustes queda para cuenta y preferencias |
| D17 | 21-09-2026 | **Modo oscuro en la fase 10** | Todo nace en tema claro; se agrega al pulir |

Decisiones de diseño derivadas (no requieren confirmación, pero no cambiarlas sin avisar):

| # | Decisión | Por qué |
|---|---|---|
| E1 | Los puntos pasan al saldo al cierre del día, no al marcar | Sin reversos ni carreras; ver `data-model.md` §6 |
| E2 | La lógica de negocio es pura y vive en `packages/shared` | Se prueba con tablas de casos; es la garantía que las reglas no pueden dar |
| E3 | Firestore en la región `southamerica-east1` (São Paulo) | La más cercana a Bolivia. **No se puede cambiar después** |
| E4 | Node 22 fijado con `.nvmrc` y `engines`; `firebase-tools` y `eas-cli` como dependencias locales | Mismas versiones en la oficina y en casa |
| E5 | APK instalada a mano (sin Play Store) | Play Store cobra USD 25. Actualizaciones de código con EAS Update, sin reinstalar |
| E6 | NativeWind para estilos; librería de gráficas que funcione en Android y web, elegida con una prueba en la fase 00 | Recharts y Tailwind directo no funcionan en React Native |
| E7 | SDK JavaScript de Firebase (no `@react-native-firebase`) | Funciona igual en Android y web. Costo: en Android no hay caché offline en disco |
| E8 | Gráficas con `react-native-gifted-charts` (+ `react-native-svg`, `expo-linear-gradient`) | Mantenida, funciona en Android y web. En web, `LineChart` va **sin animación** (`isAnimated={Platform.OS !== 'web'}`): su animación usa un `Rect` SVG animado que rompe en web. Los avisos de consola `pointerEvents is deprecated` y `onStartShouldSetResponder` vienen de las librerías y se ignoran |
| E9 | `packages/shared` sin Firebase ni Node; converters de Firestore en la app | La lógica se prueba sin emulador y corre igual en Android, web y tests |
| E10 | `meta/gamification.lastSpendTransactionId`: ID del movimiento del último gasto | Las reglas exigen que cada descuento del saldo tenga su movimiento nuevo en el historial |
| E11 | Un hábito archivado **no se reactiva** (se crea uno nuevo) y un hábito nuevo empieza hoy o después | Ambos cambiarían el resultado de días pasados todavía sin cerrar |
| E12 | Tests de reglas en `packages/firestore-rules`, con las escrituras generadas por `evaluateDay` real | Prueban que lo que calcula la app pasa las reglas. Las funciones de fecha de las reglas se prueban con sondas, porque el emulador no permite fijar `request.time` |
| E13 | Las operaciones de la app (`src/operations/`) y `src/data/documents.ts` usan solo imports relativos y se prueban contra el emulador desde `packages/firestore-rules/src/operations/` | Un solo lugar con emulador y reglas reales; Jest en la app queda para lógica de UI sin Firebase |

## Alcance

**Dentro del MVP:** todo lo de las fases 00–10.

**Fuera (no implementar aunque parezca relacionado):**
- Task tracker, check-in de ánimo/mindset, metas, diario. El modelo ya los contempla (`data-model.md` §12).
- Notificaciones en la web o en iPhone.
- Recordatorios avanzados o por hábito: el MVP tiene dos (diario y racha en riesgo).
- Hábitos con frecuencia no diaria (`schedule.type` distinto de `'daily'`).
- Publicación en Play Store. Multiusuario real.

## Estado

| Fase | Estado | Rama | Notas |
|---|---|---|---|
| 00 | **hecha** | unida a `main` | Esqueleto completo, lint/tipos/tests en verde, logins y EAS listos, verificada en el navegador. Expo Go → fase 05; emuladores → fase 03; APK y deploy web → fase 06 |
| 01 | **hecha** | — | Sistema "Brasa Viva" aprobado: https://claude.ai/artifact/R4ajRu7oMWUMzasdS317Fm |
| 02 | **hecha** | unida a `main` | 63 tests, cobertura 100%. Converters movidos a la app |
| 03 | **hecha** | unida a `main` | 110 tests de reglas, verificadas con mutaciones. Desplegadas en `ascua-a9e27` con el uid real en `allowedUids()` |
| 04 | **hecha** | unida a `main` | Probada por el usuario en web: login, error de credenciales, sesión persistente, cuenta creada en Firestore y correo de recuperación. Prueba en el celular junto con la fase 05 |
| 05 | **hecha en web** | unida a `main` | Probada por el usuario en web. La parte de Android (APK, sincronización celular ↔ PC, sin conexión) pasa a la fase 09 |
| 06 | **hecha en web** | unida a `main` | Tests y UI hechos; web publicada. Hito de uso diario: 22-09-2026, en la web. Queda comprobar 3 cierres reales seguidos; la APK pasa a la fase 09 |
| 07 | **hecha** | unida a `main` | Aprobada por el usuario y publicada. El gasto con saldo real se verá con el uso |
| 08 | **en curso** | `feat/08-statistics` | Semana, mes y año con grilla, gráficas y filtros. Falta: prueba del usuario. Datos de ejemplo para probar: `npm run seed:demo` |
| 09 | pendiente | — | Empieza con la primera APK y lo pendiente de Android de las fases 05 y 06 |
| 10 | pendiente | — | — |

## Bitácora

Lo más reciente arriba. Una línea por sesión: fecha, máquina (oficina/casa), qué se hizo y qué queda a medias.

- **22-09-2026 · oficina** — Fases 05, 06 y 07 unidas a `main` con el acuerdo del usuario (lo pendiente de Android pasa a la fase 09, que empieza con la primera APK) y web publicada con la fase 07. **Hito de uso diario: 22-09-2026, en la web.** Fase 08 en `feat/08-statistics`: periodos y estadísticas en `shared`, pestaña Mes con semana/mes/año, grilla, gráficas con toque propio y filtros. Datos de ejemplo para los emuladores (`npm run seed:demo`) y revisión en el navegador a 360 px y en escritorio. Queda: prueba del usuario.
- **22-09-2026 · oficina** — Web publicada en Hosting (desde la rama de la 06). APK pospuesta por decisión del usuario (cupo mensual de EAS). Fase 07 en `feat/07-points-rewards`: operaciones de recompensas y gasto con tests (incluido doble toque), pantalla Recompensas, canje en hoja, historial. Queda: prueba del usuario en web y volver a publicar.

- **22-09-2026 · oficina** — Fase 06 empezada en paralelo (la 05 espera la prueba en el celular): `closePendingDays` con 9 tests contra el emulador (incluida concurrencia), resumen mensual movido a `shared`, cierre automático con `expo-network` y aviso en la UI. Queda: verlo cerrar un día real, APK y deploy.

- **22-09-2026 · oficina** — Fase 05: typecheck arreglado, observaciones del usuario resueltas (navegación lateral, "+" flotante, menú ⋮ con modal de archivar, reordenar en Hoy, formularios con navegación visible, validaciones) y pasada de diseño de Hoy (brasero). Probado por el usuario en web. Proyecto reordenado por dominio (mapa en `rules/frontend.md`). Queda de la fase: probar en el celular con Expo Go y la sincronización celular ↔ PC, en casa.

- **21-09-2026 · oficina** — Fase 05 empezada en `feat/05-habits-today` (commit de trabajo en curso). Decisiones D16 (4 pestañas) y D17 (oscuro en fase 10). Hecho y probado: lógica de `shared`, operaciones de hábitos y marcas contra el emulador, resumen de Hoy. Escrito sin verificar: hooks, componentes del diseño, pestañas, Hoy, Ajustes y formularios. A medias: el typecheck falla por rutas tipadas desactualizadas; ver "Dónde quedé" en `05-habits-today.md`.
- **21-09-2026 · oficina** — Fase 04 en `feat/04-auth-account`: login, recuperación de contraseña, rutas protegidas, `initializeAccount` (6 tests contra el emulador), tokens claros y fuentes del diseño. `shared` suma `initialUserProfile` y `DEFAULT_REMINDER_SETTINGS`. Probada por el usuario en web (5/5) y unida a `main`. Siguiente: fase 05 (hábitos y pantalla "Hoy"), que empieza probando Expo Go en el celular desde casa.
- **21-09-2026 · oficina** — Fase 03 con TDD en `feat/03-security-rules`: `firestore.rules` completas y 110 tests contra el emulador (acceso, forma, entries solo hoy, cierre, compra, canje, inmutabilidad, límite de lecturas). Verificadas con mutaciones. Nuevo campo `lastSpendTransactionId` (E10). Uid real en `allowedUids()`, reglas desplegadas y rama unida a `main`. Siguiente: fase 04 (login e `initializeAccount`).
- **21-09-2026 · oficina** — Java portable (Temurin 25) en `D:\jdk-portable`; los emuladores de Auth y Firestore arrancan. Siguiente: fase 03.
- **21-09-2026 · oficina** — Fase 02 hecha con TDD: fechas de Bolivia, programación de hábitos, `evaluateDay` (racha, protectores, bonos, día perfecto) y gasto de puntos. 63 tests, 100% de cobertura. Siguiente: fase 03 (reglas de seguridad), que necesita Java 21 portable para los emuladores.
- **21-09-2026 · oficina** — Fase 00 cerrada y unida a `main`. La app se ve en el navegador; en el celular (Expo Go) no conectó desde la red de la oficina: queda como primera tarea de la fase 05. Siguiente: fase 02 (núcleo compartido con TDD).
- **21-09-2026 · oficina** — Fase 01 hecha: sistema de diseño "Brasa Viva" en Claude Design, revisado y aprobado. Quedan 4 pendientes de implementación para la fase 05 (navegación, modo oscuro con variables, sombras en Android, redacción de la regla de racha).
- **21-09-2026 · oficina** — GitHub marcó la `apiKey` de Firebase como secreto: es pública por diseño; alerta cerrada como "won't fix", clave restringida a Identity Toolkit, Token Service y Firestore. Usuario creado a mano en la consola y registro desactivado (la fase 04 ya no tiene pantalla de registro).
- **21-09-2026 · oficina** — Fase 00 en `feat/00-foundations`: monorepo, Expo SDK 57, `shared`, NativeWind, Firebase por plataforma, gifted-charts, EAS, ESLint/Prettier, Vitest/Jest. Se usa el Node portable `D:\node-portable-2` (v22). Corregido un `.gitignore` que ignoraba `src/lib`. Pendiente: Java 21, logins de Firebase CLI/EAS, deploy web y APK.
- **21-09-2026 · oficina** — Firebase configurado (`ascua-a9e27`, Spark, Firestore en `southamerica-east1`, login con correo, app web registrada). Bloqueo en la PC de la oficina: `C:\Program Files\nodejs` apunta al nvm de otro usuario de Windows (`jtapiab`, Node 21); `npm` falla con `EPERM`. Hace falta Node 22 propio del usuario.
- **21-09-2026 · oficina** — Se descarta el plan Blaze (costo). Nueva arquitectura sin servidor: Expo (Android + web), Firebase Spark, cierre del día en la app, notificaciones locales (D2, D12–D15). Documentación y plan actualizados. Siguiente: crear el proyecto de Firebase (guía en el chat) y empezar la fase 00.
- **21-09-2026 · oficina** — Requerimientos, modelo de datos, stack y plan definidos. Repo en GitHub con `.claude/` versionada.
