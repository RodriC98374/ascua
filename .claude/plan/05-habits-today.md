# 05 — Hábitos y pantalla "Hoy"

**Objetivo:** crear hábitos y marcarlos cada día desde el celular y desde la PC.

## Tareas

**Primero (pendiente de la fase 00)**
- [ ] Ver la app en el celular con **Expo Go** (`npm run dev`, escanear el QR; si no conecta, `npm run dev -- --tunnel`). En la oficina la red no lo permitió; probar en casa. Confirmar que `LineChart` se ve animada en Android. **Pasa a la fase 09** (22-09-2026): se prueba con la primera APK.

**Base de UI**
- [x] Tokens del sistema de diseño (fase 01) en la configuración de NativeWind; navegación con pestañas inferiores en Android y adaptada a escritorio en web.
- [x] Caché persistente de Firestore en web (`persistentLocalCache`); caché en memoria en Android.
- [x] Hooks de datos sobre `onSnapshot`: `useHabits`, `useDailyLog(dateKey)`, `useGamificationState`.

**Hábitos**
- [x] Crear, editar, reordenar y archivar. El selector de ícono y color se descartó: el diseño no lo tiene.
- [x] Validación en la UI: máximo 3 principales activos (`MAX_PRIMARY_HABITS`).
- [x] `startDateKey` = hoy al crear; `archivedDateKey` = hoy al archivar.

**Hoy**
- [x] Lista de hábitos programados hoy con check; los principales, destacados.
- [x] Progreso del día (% y si la meta de racha está cumplida).
- [x] Racha, puntos del día y celebración de día perfecto **al instante**, calculados con `evaluateDay` de `shared` (mismos números que dará el cierre).
- [x] Saldo oficial (de `meta/gamification`) mostrado aparte de los puntos de hoy, con la aclaración "disponibles mañana".
- [x] Indicador de "pendiente de sincronizar" (`hasPendingWrites`) y aviso claro si una escritura es rechazada.
- [x] El día cambia solo a medianoche de Bolivia si la app queda abierta.

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

**22-09-2026, probado por el usuario en web:** todo lo anterior funciona. Después se reordenó el proyecto (mapa en `.claude/rules/frontend.md`): componentes de dominio a `features/<dominio>/`, hooks de lectura a `data/`, Firebase a `lib/firebase/`, `formatLongDate` a `shared`, tests de reglas a `packages/firestore-rules/src/rules/`; se borró `components/gamification.tsx` (sin uso). Las rutas de archivos citadas arriba son las de antes de ese cambio.

**22-09-2026, cierre en web:** unida a `main` junto con las fases 06 y 07, con el acuerdo del usuario. La parte de Android (verla en el celular, sombras con `elevation`, fuentes, degradados, sincronización celular ↔ PC y marcar sin conexión) **pasa a la fase 09**, que la necesita igual y empieza con la primera APK. `01-design-system.md` actualizado (pendientes 1, 2 y 4 resueltos).

## Definición de terminado

- En la APK y en la web: crear hábitos, marcarlos y ver la racha y los puntos actualizarse al instante.
- Lo marcado en el celular aparece en la PC en segundos, y viceversa.
- Sin conexión se puede marcar; al volver la red, sincroniza y el indicador desaparece.
- Crear un 4.º hábito principal es imposible desde la UI.
