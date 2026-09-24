---
paths:
  - "apps/client/**"
---

# App (Expo: Android + web)

## Dónde va cada cosa en `apps/client/src`

| Carpeta | Contenido | Regla |
|---|---|---|
| `app/` | Solo rutas de Expo Router (pantallas y `_layout.tsx`) y `+html.tsx` (documento HTML de la web) | Nada que no sea ruta: todo archivo aquí es una pantalla. Las pantallas componen; la lógica va en `features/` |
| `components/ui/` | Primitivas del sistema de diseño (botón, tarjeta, íconos, campos, modal, menú, control segmentado, `Screen`) | No conocen Firestore ni el dominio |
| `components/` | Piezas de la app que no son de un dominio (`nav-bar`) | — |
| `features/<dominio>/` | Todo lo de un dominio: componentes, hooks y lógica de UI con sus tests (`auth`, `habits`, `today`, `close-day`, `rewards`, `statistics`, `sync`, `reminders`, `export`, `appearance`…) | Una funcionalidad nueva = una carpeta nueva aquí |
| `data/` | Lectura de Firestore: referencias y converters (`documents.ts`) y hooks sobre `onSnapshot` | `documents.ts` solo con imports relativos (E13) |
| `operations/` | Escrituras y transacciones | Solo imports relativos; tests en `packages/firestore-rules/src/operations/` (E13) |
| `lib/firebase/` | Configuración e inicialización de Firebase (`index.ts` Android, `index.web.ts` web) | — |
| `theme/` | `palette.json` (colores de los dos temas, fuente única), `colors.ts` (`useThemeColors()` para props que no aceptan clases) y fuentes | Un color nuevo va en `palette.json`, en claro y en oscuro; nunca un hex suelto en un componente |
| `types/` | Declaraciones `.d.ts` de librerías | — |

Lo que sea lógica pura sin React ni Firebase (fechas, formato de fechas, reglas de negocio) va en `packages/shared`, no aquí.

## Reglas

- Stack: Expo + TypeScript, Expo Router, NativeWind, React Native Web. La librería de gráficas se elige en la fase 00 (debe funcionar en Android y web).
- **Un solo código para ambas plataformas.** Nada de elementos del DOM (`div`, `span`) ni APIs exclusivas del navegador: se usan componentes de React Native. Si algo es exclusivo de una plataforma, se aísla con `Platform.OS` o archivos `.android.tsx` / `.web.tsx`. La única excepción es `app/+html.tsx`, que solo corre en Node al exportar la web.
- **Modo oscuro:** las clases de color cambian solas de tema (variables CSS). Las props de color (íconos, degradados, gráficas, `shadowColor`) usan `useThemeColors()`, nunca un valor fijo; `dark:` solo para excepciones puntuales (p. ej. el pulgar del interruptor).
- Firebase con el SDK JavaScript modular y hooks propios sobre `onSnapshot` (`useDailyLog`, `useHabits`…). No usar `reactfire` ni `@react-native-firebase`.
- Caché persistente de Firestore solo en web (`persistentLocalCache`); en Android, caché en memoria.
- **Mobile-first:** se diseña primero para ~360 px de ancho y se adapta a escritorio. Áreas táctiles de mínimo 44 px.
- Textos de la UI en español. Fechas mostradas siempre en hora de Bolivia.
- La racha y los puntos de hoy se muestran al instante con `evaluateDay` de `packages/shared`; el saldo oficial se lee de `meta/gamification`. La app nunca inventa su propia fórmula de puntos.
- Las operaciones sensibles (`closePendingDays`, `purchaseStreakFreeze`, `redeemReward`, `initializeAccount`) viven en un módulo propio de la app y usan transacciones de Firestore. La lógica de negocio que usan viene de `packages/shared`.
- Escrituras pendientes de sincronizar (`hasPendingWrites`) se muestran con un indicador visible. Una escritura rechazada por las reglas se muestra al usuario, nunca se ignora.
- Notificaciones: solo en Android, locales con `expo-notifications`. En web no se piden permisos de notificación.
- **Sistema de diseño aprobado:** https://claude.ai/artifact/R4ajRu7oMWUMzasdS317Fm (leerlo con la herramienta `Artifact`, `action: "read"`, `paths: ["project/README.md", "project/tokens.json"]`). Usar solo sus tokens (colores, tipografías, radios, sombras) y seguir su guía de voz: español de tú, celebra lo logrado, sin emoji, cifras siempre con contexto. No inventar colores ni una dirección visual distinta. Resumen y pendientes en `.claude/plan/01-design-system.md`.
