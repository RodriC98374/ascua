# 05 — Hábitos y pantalla "Hoy"

**Objetivo:** crear hábitos y marcarlos cada día desde el celular y desde la PC.

## Tareas

**Primero (pendiente de la fase 00)**
- [ ] Ver la app en el celular con **Expo Go** (`npm run dev`, escanear el QR; si no conecta, `npm run dev -- --tunnel`). En la oficina la red no lo permitió; probar en casa. Confirmar que `LineChart` se ve animada en Android.

**Base de UI**
- [ ] Tokens del sistema de diseño (fase 01) en la configuración de NativeWind; navegación con pestañas inferiores en Android y adaptada a escritorio en web.
- [ ] Caché persistente de Firestore en web (`persistentLocalCache`); caché en memoria en Android.
- [ ] Hooks de datos sobre `onSnapshot`: `useHabits`, `useDailyLog(dateKey)`, `useGamificationState`.

**Hábitos**
- [ ] Crear, editar, reordenar y archivar. Selector de ícono y color.
- [ ] Validación en la UI: máximo 3 principales activos (`MAX_PRIMARY_HABITS`).
- [ ] `startDateKey` = hoy al crear; `archivedDateKey` = hoy al archivar.

**Hoy**
- [ ] Lista de hábitos programados hoy con check; los principales, destacados.
- [ ] Progreso del día (% y si la meta de racha está cumplida).
- [ ] Racha, puntos del día y celebración de día perfecto **al instante**, calculados con `evaluateDay` de `shared` (mismos números que dará el cierre).
- [ ] Saldo oficial (de `meta/gamification`) mostrado aparte de los puntos de hoy, con la aclaración "disponibles mañana".
- [ ] Indicador de "pendiente de sincronizar" (`hasPendingWrites`) y aviso claro si una escritura es rechazada.
- [ ] El día cambia solo a medianoche de Bolivia si la app queda abierta.

## Avance (21-09-2026, oficina) — rama `feat/05-habits-today`, SIN unir a `main`

Decisiones de esta sesión: **D16** navegación de 4 pestañas (Hoy / Mes / Recompensas / Ajustes; la gestión de hábitos vive en Ajustes) y **D17** modo oscuro en la fase 10. Selector de ícono y color **descartado**: el diseño no los muestra; se guardan fijos (`DEFAULT_HABIT_ICON`, `DEFAULT_HABIT_COLOR` en `operations/habits.ts`).

**Hecho y probado:**
- `shared` (TDD, 89 tests, 100%): `msUntilNextDay`, `previewDay`, `canBePrimary`, tipos `HabitRecord` y `DailyLog`.
- Operaciones con tests contra el emulador (15 en `packages/firestore-rules/src/operations/`): `createHabit`, `updateHabit`, `archiveHabit`, `reorderHabits`, `setHabitCompletion`. Converters de hábitos y del registro diario en `data/documents.ts`.
- Cliente con Jest (19 tests): `formatLongDate` y `buildTodaySummary` (vista previa de Hoy con `previewDay`).

**Escrito pero SIN verificar (no compila todavía el typecheck):**
- Hooks: `features/data/use-snapshot.ts` + `hooks.ts` (`useHabits`, `useDailyLog`, `useGamificationState`), `features/today/use-today.ts` (cambio a medianoche), `features/sync/write-errors.ts` (`trackWrite` + banner).
- Componentes del diseño: `components/ui/icons.tsx`, `card`, `progress-bar`, `button` (primario con degradado), `habit-check`, `gamification.tsx` (racha, puntos, protectores), `nav-bar.tsx`, `habit-form.tsx`, `screen-header.tsx`, `coming-soon.tsx`, `write-error-banner.tsx`. `theme/colors.ts`.
- Rutas: `app/(app)/(tabs)/_layout.tsx` (tabs headless de `expo-router/ui`; barra abajo y columna izquierda desde 768 px), `(tabs)/index.tsx` (Hoy), `mes.tsx` y `recompensas.tsx` (provisionales), `ajustes.tsx` (hábitos con reordenar + cuenta), `app/(app)/habits/new.tsx` y `habits/[habitId].tsx` (editar y archivar con confirmación). Se borraron `app/(app)/index.tsx` y `components/charts-spike.tsx`.

**22-09-2026 (oficina):** typecheck, lint y tests en verde (client 19, reglas + operaciones 125, shared 89); el bundle web compila. Las rutas tipadas se regeneraron al arrancar `expo start --web` (la ruta rara de `packages/shared` desapareció). `Tabs` descubre los `TabTrigger` de `renderNavBar` (revisado en `parseTriggersFromChildren`). Corregido: `TabList` ahora usa `asChild` con un `View` propio, porque su `View` interna no pasa por NativeWind (ignoraba `className`) y forzaba `flexDirection: 'row'`.

**22-09-2026, prueba del usuario en web:** OK crear (bloquea el 4.º principal), editar, reordenar, archivar, racha/puntos al instante e indicador "Pendiente". Observaciones atendidas el mismo día:
- Columna lateral en escritorio: `TabList` y `TabTrigger` pasan a su hijo un estilo inline (`flexDirection: 'row'`) que les gana a las clases de NativeWind; la dirección va ahora en `style`.
- Botón "+" en Hoy para crear; menú de tres puntos (`PopoverMenu`) con Editar y Archivar en Hoy y Ajustes; archivar confirma con `ConfirmDialog` (modal). Un hábito archivado hoy sigue en Hoy con la etiqueta "Último día" y sin menú.
- Validaciones con mensajes: hábito (`features/habits/habit-validation.ts`: nombre 2–60, sin repetir entre activos, descripción ≤ 200, máximo de principales) y acceso (`features/auth/credentials-validation.ts`). Los largos pasaron a `shared` (`HABIT_NAME_MIN_LENGTH`, etc.).

**22-09-2026, segunda ronda de observaciones + pasada de diseño de Hoy:**
- Descripción como área de texto (~4 líneas, contador, máximo 200 como las reglas).
- Botón flotante "+" abajo a la derecha, alineado a la columna de contenido; la lista deja espacio para que no tape la última fila.
- Reordenar se mueve a Hoy: "Ordenar" / "Listo" en la cabecera de la lista; cada hábito se mueve dentro de su grupo (`features/habits/habit-order.ts`, con tests). Ajustes queda con cuenta y hábitos archivados.
- Rutas: Hoy y los formularios viven en `app/(app)/(tabs)/(hoy)/` con su propio `Stack`, así la navegación no desaparece al crear o editar.
- Diseño: la tarjeta de progreso y el bloque de racha/saldo se reemplazan por `TodayHero`, con el **brasero** (`StreakHearth`), un anillo con un segmento por hábito principal que se enciende al cumplirlo, la racha y una franja con puntos de hoy, saldo y protectores. Principales en fichas propias; secundarios como filas dentro de una tarjeta. El desglose de puntos pasa a una frase al final.

**Dónde quedé (primer paso de la próxima sesión):**
1. Que el usuario pruebe en la web todo lo de arriba (ventana angosta y ancha): brasero, "+", menú ⋮, modal de archivar, ordenar, formularios con la navegación visible y mensajes de error.

**Falta de la fase:**
- Expo Go en el celular (en casa) y confirmar que todo se ve bien en Android (sombras con `elevation`, fuentes, degradados).
- Sincronización celular ↔ PC en segundos y prueba sin conexión.
- Actualizar `01-design-system.md` (pendientes 1 y 2 resueltos por D16/D17) y `data-model.md` si hace falta.

## Definición de terminado

- En la APK y en la web: crear hábitos, marcarlos y ver la racha y los puntos actualizarse al instante.
- Lo marcado en el celular aparece en la PC en segundos, y viceversa.
- Sin conexión se puede marcar; al volver la red, sincroniza y el indicador desaparece.
- Crear un 4.º hábito principal es imposible desde la UI.
