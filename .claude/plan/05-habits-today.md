# 05 — Hábitos y pantalla "Hoy"

**Objetivo:** poder crear hábitos y marcarlos cada día desde el celular, con la app instalada como PWA.

## Tareas

**Base de UI**
- [ ] Tokens de los mockups en la configuración de Tailwind; layout con navegación inferior/lateral.
- [ ] Caché persistente de Firestore activada.
- [ ] Hooks de datos: `useHabits`, `useDailyLog(dateKey)`, `useGamificationState`.

**Hábitos**
- [ ] Crear, editar, reordenar y archivar. Selector de ícono y color.
- [ ] Validación en la UI: máximo 3 principales activos (`MAX_PRIMARY_HABITS`).
- [ ] `startDateKey` = hoy al crear; `archivedDateKey` = hoy al archivar.

**Hoy**
- [ ] Lista de hábitos programados hoy con check; los principales, destacados.
- [ ] Progreso del día (% y meta de racha cumplida o no).
- [ ] Puntos provisionales y racha provisional, calculados con `evaluateDay` de `shared`.
- [ ] Indicador de "pendiente de sincronizar" (`hasPendingWrites`) y aviso si una escritura es rechazada.
- [ ] El día cambia solo a medianoche de Bolivia si la app queda abierta.

**PWA básica**
- [ ] `vite-plugin-pwa` con manifest, íconos (incluido *maskable*) y service worker con estrategia `injectManifest` (la fase 09 le agrega FCM).
- [ ] Instalable desde Chrome en Android.

## Definición de terminado

- Instalada en el celular, se abre como app, muestra "Hoy" y permite marcar hábitos.
- En modo avión se puede marcar; al volver la red, sincroniza y el indicador desaparece.
- Crear un 4.º hábito principal es imposible desde la UI.
