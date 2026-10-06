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
| `features/<dominio>/` | Todo lo de un dominio: componentes, hooks y lógica de UI con sus tests (`auth`, `habits`, `today`, `close-day`, `rewards`, `statistics`, `sync`, `reminders`, `export`, `appearance`, `sounds`, `goals`, `reflections`, `savings`, `restore`, `pwa`…) | Una funcionalidad nueva = una carpeta nueva aquí |
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
- **Web instalable (fase 19):** `npm run build:web` corre `scripts/build-pwa.mjs` después de exportar: escribe `manifest.webmanifest` y `sw.js` en `dist` y **falla si una ruta dinámica no tiene su reescritura en `firebase.json`** (una pantalla nueva con `[param]` necesita la suya). Lo que está en `public/` (los íconos de la PWA) se copia tal cual. El service worker solo se registra en producción (`features/pwa/pwa.web.ts`).
- **Mobile-first:** se diseña primero para ~360 px de ancho y se adapta a escritorio. Áreas táctiles de mínimo 44 px.
- Textos de la UI en español. Fechas mostradas siempre en hora de Bolivia.
- La racha y los puntos de hoy se muestran al instante con `evaluateDay` de `packages/shared`; el saldo oficial se lee de `meta/gamification`. La app nunca inventa su propia fórmula de puntos.
- Las operaciones sensibles (`closePendingDays`, `purchaseStreakFreeze`, `redeemReward`, `initializeAccount`) viven en un módulo propio de la app y usan transacciones de Firestore. La lógica de negocio que usan viene de `packages/shared`.
- Escrituras pendientes de sincronizar (`hasPendingWrites`) se muestran con un indicador visible. Una escritura rechazada por las reglas se muestra al usuario, nunca se ignora.
- Notificaciones: solo en Android, locales con `expo-notifications`. En web no se piden permisos de notificación.
- **Movimiento:** Reanimated con los tokens de `theme/motion.ts` (duraciones y resortes). Solo `transform`/`opacity`; nada infinito ni decorativo; dos momentos grandes a pantalla completa (la celebración de racha y la del canje de una recompensa, `features/rewards/reward-celebration.tsx`, con `Confetti`) y el resto, respuestas a un toque. `Animated.View` no acepta `className`: lleva `style` y las clases van en un hijo. Valores compartidos con `.get()`/`.set()` (React Compiler). La llama viva (`components/ui/living-flame.tsx`) solo se mueve sin parar dentro de la celebración; en el resto, por ráfagas que terminan quietas.
- **Sonidos:** solo en los logros (marcar, racha asegurada, hito, día perfecto, canje con su fanfarria `reward`, premio utilizado), junto a su vibración: `playSound` de `features/sounds/sounds.ts` al lado de `tapFeedback`/`celebrationFeedback`. Desmarcar o cambiar de opción vibran sin sonar. Un sonido nuevo se agrega en `scripts/generate-sounds.mjs`, nunca como archivo suelto de terceros.
- **Patrones de la interfaz (D24):** fondo `surface-100` y todo lo blanco encima (tarjetas, campos, hojas) en `surface-200`. Una opción elegida usa `choiceContainer`/`choiceLabel` de `components/ui/choice-styles.ts`, nunca un estilo propio. El "Guardar" de un formulario (con su aviso de error) va en `ScreenFooter`, la barra fija al pie de la `Screen`. Los selectores van en una `BottomSheet` al alcance del pulgar; la hora, con `TimeField` (ruedas y horas rápidas). Las listas van en una `Card` por sección con `SectionHeader`. Detalle en `.claude/plan/01-design-system.md`.
- **Formularios y estados (repaso de diseño, 05-10-2026):** los campos van en `FormSection`, nunca sueltos sobre el fondo. Una sola etiqueta, `FieldLabel` (la que usa `TextField`); la ayuda con `Hint` (en `TextField`, `hint`, a la izquierda) y el contador de caracteres con `counter` (a la derecha). `ink-faint` solo en bordes, íconos y placeholders, nunca en texto. Presionado `active:opacity-85` y deshabilitado `opacity-40`. Campos y opciones con `border-2`. Un control chico (un "?") mide 44 px por sí mismo: `hitSlop` no pasa del borde de la vista que lo contiene y la web lo ignora.
- **Gráficas de línea:** siempre con curva suave, nunca con rectas entre puntos. La curva sale de `features/statistics/smooth-path.ts` (cúbica monótona: pasa por cada punto y no se sale del rango entre dos vecinos). `smoothPath` da el trazado de un `<Path>` propio (check-in) y `smoothValues` suma puntos intermedios para `TouchLineChart`, que solo dibuja rectas. La opción `curved` de `react-native-gifted-charts` no se usa: su curva se pasa del eje en una caída brusca (hasta ~6 px bajo el 0 cuando una racha vuelve a 0).
- **Sistema de diseño aprobado:** https://claude.ai/artifact/R4ajRu7oMWUMzasdS317Fm (leerlo con la herramienta `Artifact`, `action: "read"`, `paths: ["project/README.md", "project/tokens.json"]`). Usar solo sus tokens (colores, tipografías, radios, sombras) y seguir su guía de voz: español de tú, celebra lo logrado, sin emoji, cifras siempre con contexto. No inventar colores ni una dirección visual distinta. Resumen y pendientes en `.claude/plan/01-design-system.md`.
