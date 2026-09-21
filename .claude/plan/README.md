# Plan del MVP — Habit Tracker (Android + web)

> **Documento de trabajo.** Se versiona en git para poder continuar desde cualquier máquina. Al terminar cada sesión, actualizar **Estado** y **Bitácora**.

- **Requerimientos:** [../requirements.md](../requirements.md)
- **Modelo de datos:** [../data-model.md](../data-model.md)
- **Reglas para Claude:** [../rules/](../rules/)
- **Repositorio:** https://github.com/RodriC98374/ascua
- **Proyecto Firebase:** `ascua-a9e27` (plan Spark, Firestore en `southamerica-east1`)
- **Estado:** fase 00 sin empezar. Documentación y plan listos; arquitectura sin servidor aprobada.

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
| 03–10 | pendiente | — | Java portable listo en la oficina |

## Bitácora

Lo más reciente arriba. Una línea por sesión: fecha, máquina (oficina/casa), qué se hizo y qué queda a medias.

- **21-09-2026 · oficina** — Java portable (Temurin 25) en `D:\jdk-portable`; los emuladores de Auth y Firestore arrancan. Siguiente: fase 03.
- **21-09-2026 · oficina** — Fase 02 hecha con TDD: fechas de Bolivia, programación de hábitos, `evaluateDay` (racha, protectores, bonos, día perfecto) y gasto de puntos. 63 tests, 100% de cobertura. Siguiente: fase 03 (reglas de seguridad), que necesita Java 21 portable para los emuladores.
- **21-09-2026 · oficina** — Fase 00 cerrada y unida a `main`. La app se ve en el navegador; en el celular (Expo Go) no conectó desde la red de la oficina: queda como primera tarea de la fase 05. Siguiente: fase 02 (núcleo compartido con TDD).
- **21-09-2026 · oficina** — Fase 01 hecha: sistema de diseño "Brasa Viva" en Claude Design, revisado y aprobado. Quedan 4 pendientes de implementación para la fase 05 (navegación, modo oscuro con variables, sombras en Android, redacción de la regla de racha).
- **21-09-2026 · oficina** — GitHub marcó la `apiKey` de Firebase como secreto: es pública por diseño; alerta cerrada como "won't fix", clave restringida a Identity Toolkit, Token Service y Firestore. Usuario creado a mano en la consola y registro desactivado (la fase 04 ya no tiene pantalla de registro).
- **21-09-2026 · oficina** — Fase 00 en `feat/00-foundations`: monorepo, Expo SDK 57, `shared`, NativeWind, Firebase por plataforma, gifted-charts, EAS, ESLint/Prettier, Vitest/Jest. Se usa el Node portable `D:\node-portable-2` (v22). Corregido un `.gitignore` que ignoraba `src/lib`. Pendiente: Java 21, logins de Firebase CLI/EAS, deploy web y APK.
- **21-09-2026 · oficina** — Firebase configurado (`ascua-a9e27`, Spark, Firestore en `southamerica-east1`, login con correo, app web registrada). Bloqueo en la PC de la oficina: `C:\Program Files\nodejs` apunta al nvm de otro usuario de Windows (`jtapiab`, Node 21); `npm` falla con `EPERM`. Hace falta Node 22 propio del usuario.
- **21-09-2026 · oficina** — Se descarta el plan Blaze (costo). Nueva arquitectura sin servidor: Expo (Android + web), Firebase Spark, cierre del día en la app, notificaciones locales (D2, D12–D15). Documentación y plan actualizados. Siguiente: crear el proyecto de Firebase (guía en el chat) y empezar la fase 00.
- **21-09-2026 · oficina** — Requerimientos, modelo de datos, stack y plan definidos. Repo en GitHub con `.claude/` versionada.
