---
paths:
  - "**/*.test.ts"
  - "**/*.test.tsx"
  - "firestore.rules"
  - "functions/**"
  - "packages/shared/**"
---

# Tests

- Framework: **Vitest** en los tres paquetes. Tests junto al código: `foo.ts` → `foo.test.ts`.
- **TDD obligatorio** para `packages/shared` (fechas, evaluación del día, rachas, bonos) y para `firestore.rules`: primero el test en rojo, luego el código.
- La lógica de negocio del cierre del día es una **función pura** en `packages/shared` (sin Firestore) y se prueba con tablas de casos. `closeDay` solo lee, llama a esa función y escribe.
- Las reglas de seguridad se prueban con `@firebase/rules-unit-testing` contra el emulador de Firestore. Cada regla tiene al menos un caso permitido y uno denegado.
- Las functions se prueban contra el Firebase Emulator Suite, nunca contra el proyecto real.
- Fechas en los tests: siempre `DateKey` fijos o `vi.setSystemTime(...)`; nunca depender del día real ni de la zona horaria de la máquina. Incluir casos en el borde de la medianoche de Bolivia (23:59 / 00:00, es decir, 03:59 / 04:00 UTC).
- Nombres de test en inglés, describiendo el comportamiento: `it('keeps the streak without incrementing when a freeze is used')`.
