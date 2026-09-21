---
paths:
  - "apps/client/**"
---

# App (Expo: Android + web)

- Stack: Expo + TypeScript, Expo Router, NativeWind, React Native Web. La librería de gráficas se elige en la fase 00 (debe funcionar en Android y web).
- **Un solo código para ambas plataformas.** Nada de elementos del DOM (`div`, `span`) ni APIs exclusivas del navegador: se usan componentes de React Native. Si algo es exclusivo de una plataforma, se aísla con `Platform.OS` o archivos `.android.tsx` / `.web.tsx`.
- Firebase con el SDK JavaScript modular y hooks propios sobre `onSnapshot` (`useDailyLog`, `useHabits`…). No usar `reactfire` ni `@react-native-firebase`.
- Caché persistente de Firestore solo en web (`persistentLocalCache`); en Android, caché en memoria.
- **Mobile-first:** se diseña primero para ~360 px de ancho y se adapta a escritorio. Áreas táctiles de mínimo 44 px.
- Textos de la UI en español. Fechas mostradas siempre en hora de Bolivia.
- La racha y los puntos de hoy se muestran al instante con `evaluateDay` de `packages/shared`; el saldo oficial se lee de `meta/gamification`. La app nunca inventa su propia fórmula de puntos.
- Las operaciones sensibles (`closePendingDays`, `purchaseStreakFreeze`, `redeemReward`, `initializeAccount`) viven en un módulo propio de la app y usan transacciones de Firestore. La lógica de negocio que usan viene de `packages/shared`.
- Escrituras pendientes de sincronizar (`hasPendingWrites`) se muestran con un indicador visible. Una escritura rechazada por las reglas se muestra al usuario, nunca se ignora.
- Notificaciones: solo en Android, locales con `expo-notifications`. En web no se piden permisos de notificación.
- El sistema de diseño aprobado (fase 01, Claude Design) es la referencia visual; no inventar una dirección visual distinta.
