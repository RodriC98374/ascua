# Fase 21 — Mejoras del uso real

Rama: `feat/21-real-use-improvements`. Decisión D27 (01-10-2026).

El 30-09-2026 el usuario reinició su cuenta y empezó a usar la app en su día a día. Al cargar sus
hábitos y recompensas salieron 13 observaciones. Se revisaron una por una en el chat y el usuario
decidió cuáles se implementan, cuáles solo se documentan y cuáles no cambian nada.

**Cada cambio de JavaScript llega al celular con un build nuevo de EAS** (sin EAS Update): juntar
todo lo de esta fase antes de construir la APK.

## Qué se implementa

| # | Qué | Toca datos o reglas | Estado |
|---|---|---|---|
| 1 | La pestaña y la pantalla de recompensas se llaman **"Premios"**: "Recompensas" se partía en dos líneas en el celular y desalineaba el ícono. Cada premio sigue siendo "una recompensa" en botones y formularios | No | Hecho |
| 11 | **Doce colores** de hábito en lugar de ocho: se suman lima, canela, pizarra y orquídea, cada uno con su tono oscuro | No (las reglas aceptan cualquier hexadecimal) | Hecho |
| 10 | **Ícono por hábito**: un selector en el formulario. El campo `icon` ya existe (hoy todos guardan `check`). Un emoji ya se puede escribir en el nombre | No (las reglas aceptan un texto de 1 a 40) | Pendiente |
| 2 | **Hábitos con pasos** (subtareas): un hábito como "Rutina de noche" lista sus pasos y se cumple al marcarlos todos | Sí: diseño por confirmar | Pendiente |
| 5 | **Premios conseguidos**: dentro de Premios, los canjes hechos que todavía no se usaron, con un botón para marcarlos como usados | Sí: diseño por confirmar | Pendiente |
| 3 | **Calculadora de recompensas**: sugiere el costo en puntos a partir del precio en dinero y estima cuánto se tarda en llegar | Por definir | Fórmula y flujo por definir con el usuario |

### Diseño por confirmar antes de escribir código

Los tres cambian datos o reglas, y los invariantes piden el visto bueno del usuario.

- **Pasos de un hábito (2).** Propuesta: campo opcional `steps` en el hábito (lista de textos
  cortos, editable) y, en la marca del día, cuáles pasos están hechos. El hábito cuenta como
  cumplido cuando están todos. Cambia las reglas de `habits` y de `dailyLogs.entries`.
- **Premios conseguidos (5).** Propuesta: campo opcional `usedAt` en `rewardRedemptions` y una
  operación nueva que solo puede pasarlo de vacío a una fecha. Hoy `rewardRedemptions` solo se
  escribe dentro de `redeemReward`: hay que abrir ese invariante para esta única escritura.
- **Calculadora (3).** Propuesta inicial, sin aprobar:
  - Entradas: precio en Bs y presupuesto mensual para gustos (guardado en el dispositivo).
  - Tasa de cambio: los puntos de un **mes perfecto sin tareas** (calculados con los hábitos
    activos) divididos entre el presupuesto mensual. Así un mes perfecto compra el presupuesto del
    mes, y agregar hábitos no abarata las recompensas (la tasa se recalcula).
  - Salidas: costo sugerido en puntos (precio × tasa) y dos plazos: cuándo alcanza el dinero y
    cuándo alcanzan los puntos al ritmo real de los últimos 30 días.
  - Una recompensa sin precio no usa la calculadora. Cuánto debe costar algo gratis y cómo
    repartir entre el corto y el largo plazo es subjetivo: la calculadora informa, no decide.
  - Mejor después de la calibración de puntos (~21-10-2026), que cambia cuánto se gana.

## Ideas documentadas, sin implementar

| # | Idea | Por qué no ahora |
|---|---|---|
| 4 | **Tope diario de puntos** para que muchos hábitos secundarios o tareas no inflen el saldo. Las tareas ya tienen el suyo (30 por día, D19); faltaría uno para los secundarios | Se decide en la calibración. Resuelve lo mismo que la calculadora (que recalcula la tasa): elegir una de las dos. Los **puntos dinámicos** (que un hábito valga distinto según cuántos haya) quedan descartados: dejan de ser predecibles |
| 6 | **Premios por tiempo**: comprar horas de algo que gusta mucho, canjeando varias de una vez y sumándolas a un total | En discusión. Canjear la misma recompensa varias veces ya se puede; faltaría el "×N" en el canje y el total. Encaja con "Premios conseguidos" (5): se decide junto con su diseño |
| 7 | **Formato en la descripción**: que `- ` y `1. ` se vean como viñetas y listas | Un editor con formato es caro en React Native. La necesidad real (la lista de una rutina) la cubren los pasos del hábito (2) |
| 8 | **Empezar con dos protectores** en una cuenta nueva | Regalarlos le quita valor a ahorrar para uno. Solo importa si algún día la app tiene más usuarios; ahí, quizá uno |
| 9 | **Hábitos con varias categorías** | La categoría define el color y el radar del año: con varias, un mismo día se contaría más de una vez |
| 13 | **Tablero de tareas** por estados, estilo Trello | Las tareas son de una persona y tienen dos estados. Un tablero es otra aplicación dentro de esta |
| — | **Hábitos cada N días** (por ejemplo, día por medio) | Tipo de frecuencia nuevo: toca qué día cuenta, las reglas, los recordatorios, las estadísticas y el formulario. Los días fijos alcanzan por ahora |

Sin cambios: "veces por semana" llega hasta 6 a propósito (7 es "todos los días", que ya existe
como frecuencia).

## Definición de terminado

- En un celular de 360 px, las cinco pestañas entran en una línea con sus íconos alineados.
- El formulario de hábito ofrece doce colores y un ícono, y se ven en Hoy y en Mes.
- Un hábito con pasos se marca paso a paso y cuenta como cumplido al completarlos; las reglas lo
  validan y un hábito sin pasos sigue igual.
- Un canje aparece en "Premios conseguidos" hasta que se marca como usado.
- La calculadora, con la fórmula aprobada por el usuario, sugiere un costo y los dos plazos.
- `shared` con cobertura de al menos 95 %; reglas con caso permitido y denegado por cada regla
  nueva; lint, typecheck y tests en verde.
