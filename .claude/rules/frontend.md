---
paths:
  - "apps/web/**"
---

# Frontend (React)

- Stack: Vite + React + TypeScript, React Router, Tailwind CSS, Recharts, `vite-plugin-pwa`.
- Firebase con el SDK modular directo y hooks propios sobre `onSnapshot` (`useDailyLog`, `useHabits`…). No usar `reactfire` (mantenimiento casi nulo).
- Caché persistente de Firestore activada (`persistentLocalCache`) para que la app funcione offline y abra rápido.
- **Mobile-first:** se diseña primero para ~360 px de ancho y se amplía para escritorio. Áreas táctiles de mínimo 44 px.
- Textos de la UI en español. Fechas mostradas siempre en hora de Bolivia.
- La UI **nunca** calcula puntos ni rachas definitivos: los lee de `serverState/gamification`. Solo muestra los provisionales de hoy, con la misma lógica de `packages/shared`.
- Escrituras pendientes de sincronizar (`hasPendingWrites`) se muestran con un indicador visible. Una marca offline que llega después de medianoche es rechazada y el usuario debe enterarse.
- Mockups aprobados en `.claude/mockups/`: son la referencia visual; no inventar una dirección visual distinta.
