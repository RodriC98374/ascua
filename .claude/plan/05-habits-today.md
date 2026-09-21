# 05 — Hábitos y pantalla "Hoy"

**Objetivo:** crear hábitos y marcarlos cada día desde el celular y desde la PC.

## Tareas

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

## Definición de terminado

- En la APK y en la web: crear hábitos, marcarlos y ver la racha y los puntos actualizarse al instante.
- Lo marcado en el celular aparece en la PC en segundos, y viceversa.
- Sin conexión se puede marcar; al volver la red, sincroniza y el indicador desaparece.
- Crear un 4.º hábito principal es imposible desde la UI.
