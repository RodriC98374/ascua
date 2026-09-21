# Plan del MVP — Habit Tracker PWA

> **Documento de trabajo.** Se versiona en git para poder continuar desde cualquier máquina. Al terminar cada sesión, actualizar **Estado** y **Bitácora**.

- **Requerimientos:** [../requirements.md](../requirements.md)
- **Modelo de datos:** [../data-model.md](../data-model.md)
- **Reglas para Claude:** [../rules/](../rules/)
- **Estado:** fase 00 sin empezar. Documentación y plan listos.

## Cómo leer este plan

En orden. Cada fase es autocontenida, pero asume las decisiones de este README. Una fase se considera terminada cuando se cumple su **Definición de terminado**, no antes.

| # | Archivo | Resultado | Depende de |
|---|---|---|---|
| 00 | [00-foundations.md](00-foundations.md) | Monorepo, Firebase, emuladores, CI y un "hola mundo" desplegado | — |
| 01 | [01-mockups.md](01-mockups.md) | Mockups HTML de las pantallas clave, aprobados | — (paralelo a 00) |
| 02 | [02-shared-core.md](02-shared-core.md) | Tipos, constantes, fechas Bolivia y lógica pura del cierre del día, con TDD | 00 |
| 03 | [03-security-rules.md](03-security-rules.md) | `firestore.rules` completas y probadas | 02 |
| 04 | [04-auth-account.md](04-auth-account.md) | Login, `onUserCreated`, registro cerrado | 03 |
| 05 | [05-habits-today.md](05-habits-today.md) | CRUD de hábitos, pantalla "Hoy", PWA instalable | 01, 04 |
| 06 | [06-close-day.md](06-close-day.md) | `closeDay`, puntos reales, racha, resúmenes mensuales | 05 |
| — | **Hito: uso diario** | La app se usa todos los días desde el celular y empieza a juntar datos reales | 06 |
| 07 | [07-points-rewards.md](07-points-rewards.md) | Historial de puntos, protectores, recompensas y canjes | 06 |
| 08 | [08-statistics.md](08-statistics.md) | Vistas de semana, mes y año con gráficas | 06 |
| 09 | [09-pwa-push.md](09-pwa-push.md) | Notificaciones push de recordatorio | 06 |
| 10 | [10-export-launch.md](10-export-launch.md) | Exportación CSV/JSON, calibración de puntos, cierre del MVP | 07, 08, 09 |

Las fases 07, 08 y 09 son independientes entre sí; se pueden hacer en cualquier orden.

## Decisiones tomadas

Confirmadas por el usuario. **No volver a preguntarlas ni cambiarlas durante la implementación.**

| # | Fecha | Decisión | Consecuencia práctica |
|---|---|---|---|
| D1 | 21-09-2026 | Firebase: Firestore, Auth por email, Hosting, Cloud Functions, FCM | Requiere el plan Blaze con alerta de presupuesto |
| D2 | 21-09-2026 | Frontend en **React** + Vite + TypeScript, Tailwind, Recharts, `vite-plugin-pwa` | Sin `reactfire`: hooks propios sobre `onSnapshot` |
| D3 | 21-09-2026 | **Monorepo** con npm workspaces: `apps/web`, `functions`, `packages/shared` | Una sola fuente para tipos, constantes y fechas |
| D4 | 21-09-2026 | Todo en hora de Bolivia (`America/La_Paz`) | Helper único de fechas en `packages/shared` |
| D5 | 21-09-2026 | Meta de racha = todos los principales. Tres resultados: perdida, activa, perfecta | "Perfecta" no es un estado: es `completed` + `isPerfectDay` |
| D6 | 21-09-2026 | Bonos de 7 y 30 días **recurrentes** en cada múltiplo | El día 210 da ambos bonos |
| D7 | 21-09-2026 | El día protegido conserva la racha sin sumarla | `status: 'frozen'` |
| D8 | 21-09-2026 | **Sin margen de gracia** para días pasados | Las reglas solo aceptan escrituras sobre el día de hoy |
| D9 | 21-09-2026 | Rangos de costo de recompensas = sugerencia | Se calibran en la fase 10 con datos reales |
| D10 | 21-09-2026 | Código en inglés; comentarios, commits, documentación y UI en español | Prefijo de Conventional Commits en inglés. Ver `rules/code-conventions.md` |
| D11 | 21-09-2026 | `.claude/` se **versiona** en git | Plan y reglas disponibles en cualquier máquina |

Decisiones de diseño derivadas (no requieren confirmación, pero no cambiarlas sin avisar):

| # | Decisión | Por qué |
|---|---|---|
| E1 | Los puntos se acreditan al cierre del día, no al marcar | Sin reversos ni carreras; ver `data-model.md` §6 |
| E2 | La lógica del cierre es una función pura en `packages/shared` | Se prueba con tablas de casos sin emulador; `closeDay` solo orquesta |
| E3 | Región `southamerica-east1` (São Paulo) para Firestore y Functions | Es la región de Google Cloud más cercana a Bolivia. **La región de Firestore no se puede cambiar después** |
| E4 | Node 22 fijado con `.nvmrc` y `engines`; `firebase-tools` como dependencia local | Mismas versiones en la oficina y en casa |
| E5 | Mockups en HTML estático dentro de `.claude/mockups/` | Se abren en cualquier navegador y quedan versionados |

## Alcance

**Dentro del MVP:** todo lo de las fases 00–10.

**Fuera (no implementar aunque parezca relacionado):**
- Task tracker, check-in de ánimo/mindset, metas, diario. El modelo ya los contempla (`data-model.md` §12).
- Recordatorios push avanzados o personalizados por hábito: el MVP tiene dos (recordatorio diario y racha en riesgo).
- Hábitos con frecuencia no diaria (`schedule.type` distinto de `'daily'`).
- Multiusuario real.

## Estado

| Fase | Estado | Rama | Notas |
|---|---|---|---|
| 00 | pendiente | — | |
| 01 | pendiente | — | |
| 02–10 | pendiente | — | |

## Bitácora

Lo más reciente arriba. Una línea por sesión: fecha, máquina (oficina/casa), qué se hizo y qué queda a medias.

- **21-09-2026 · oficina** — Requerimientos, modelo de datos, stack y plan definidos. Repo inicializado con `.claude/` versionada. Siguiente: crear el repo remoto y empezar la fase 00.
