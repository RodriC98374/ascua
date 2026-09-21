---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "firestore.rules"
  - "packages/shared/**"
  - "apps/client/src/operations/**"
---

# Tests

- **Vitest** en `packages/shared` y en los tests de reglas; **Jest** (`jest-expo`) en `apps/client`. Tests junto al código: `foo.ts` → `foo.test.ts`.
- **TDD obligatorio** para `packages/shared` (fechas, evaluación del día, rachas, bonos, recordatorios) y para `firestore.rules`: primero el test en rojo, luego el código.
- La lógica de negocio del cierre del día es una **función pura** en `packages/shared` (sin Firestore) y se prueba con tablas de casos. Las operaciones de la app solo leen, llaman a esa función y escriben.
- Sin servidor, **las reglas de seguridad son la única barrera**: se prueban con `@firebase/rules-unit-testing` contra el emulador de Firestore, en `packages/firestore-rules`. Cada regla tiene al menos un caso permitido y uno denegado.
- Un caso denegado debe poder fallar **solo por la regla que prueba**: el resto de la escritura, coherente (usar `tamper` sobre un plan válido). Al agregar una regla, debilitarla a mano y confirmar que algún test falla.
- Las operaciones de la app (`closePendingDays`, compras, canjes) se prueban contra el emulador, nunca contra el proyecto real, incluyendo concurrencia (dos ejecuciones en paralelo).
- Fechas en los tests: siempre `DateKey` fijos o reloj simulado; nunca depender del día real ni de la zona horaria de la máquina. Incluir casos en el borde de la medianoche de Bolivia (23:59 / 00:00, es decir, 03:59 / 04:00 UTC).
- Nombres de test en inglés, describiendo el comportamiento: `it('keeps the streak without incrementing when a freeze is used')`.
