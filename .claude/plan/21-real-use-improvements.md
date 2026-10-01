# Fase 21 — Mejoras del uso real

Rama: `feat/21-real-use-improvements`, que vuelve a `develop` (D28): es la versión siguiente, no se
publica ni se construye APK hasta tenerla completa. Decisión D27 (01-10-2026).

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
| 10 | **Ícono por hábito**: 96 íconos en seis grupos (catálogo en `shared/habit-icons.ts`), elegidos en una hoja inferior desde el formulario. Se ve antes del nombre en Hoy, en el tono oscuro del color del hábito. **Solo íconos, sin emojis** (un emoji puede ir en el nombre). El campo `icon` ya existía; "sin ícono" guarda `check`. La restauración conserva el ícono del respaldo | No (las reglas aceptan un texto de 1 a 40) | Hecho |
| 2 | **Hábitos con pasos** (subtareas): un hábito como "Rutina de noche" lista sus pasos y se cumple al marcarlos todos | Sí: diseño por confirmar | Pendiente |
| 5 | **Premios conseguidos**: dentro de Premios, los canjes hechos que todavía no se usaron, con un botón para marcarlos como usados | Sí: diseño por confirmar | Pendiente |
| 3 | **Calculadora de recompensas**: sugiere el costo en puntos a partir del precio en dinero y estima cuánto se tarda en llegar | Por definir | Fórmula y flujo por definir con el usuario |

### Diseño por confirmar antes de escribir código

Los tres cambian datos o reglas, y los invariantes piden el visto bueno del usuario.

- **Pasos de un hábito (2). Confirmado por el usuario (01-10-2026):** son **opcionales**. Si el
  hábito tiene pasos, **solo se cumple con todos marcados**, y el formulario lo advierte. En Hoy
  se ven como subcasillas debajo del hábito; al marcar la última, el hábito queda cumplido.
  Datos: campo opcional `steps` en el hábito (lista de textos cortos, editable) y, en la marca
  del día, cuáles pasos están hechos. Cambia las reglas de `habits` y de `dailyLogs.entries`.
- **Premios conseguidos (5). Confirmado por el usuario (01-10-2026):** es un historial propio,
  aparte del de puntos, como **trofeos**: todo lo que se canjeó, de cualquier recompensa, para
  recordar lo logrado. Se ve como una **grilla de bloques con animación**; al tocar uno se abre
  una **tarjeta modal** con el logro y un botón **"Utilizado"**, que al marcarse muestra una
  animación de celebración. Los canjes ya se guardan en `rewardRedemptions`; marcar uno como
  usado pide un campo `usedAt` y una operación nueva (hoy esa colección solo se escribe dentro de
  `redeemReward`: se abre el invariante para esta única escritura, de vacío a una fecha).
- **Calculadora (3). Confirmada por el usuario (01-10-2026):**
  - Entradas: precio en Bs y **presupuesto mensual para gustos, que queda guardado** (no se
    vuelve a pedir en cada cálculo).
  - Tasa de cambio: los puntos de un **mes perfecto sin tareas** (calculados con los hábitos
    activos) divididos entre el presupuesto mensual. Así un mes perfecto compra el presupuesto del
    mes, y agregar hábitos no abarata las recompensas (la tasa se recalcula).
  - Salidas: costo sugerido en puntos (precio × tasa) y dos plazos: cuándo alcanza el dinero y
    cuándo alcanzan los puntos al ritmo real de los últimos 30 días.
  - Una recompensa gratis no usa la calculadora: su costo lo pone el usuario.
  - Un **(?)** explica que es solo una sugerencia: el costo final lo decide el usuario.
  - Por decidir al implementarla: dónde se guarda el presupuesto (en el perfil, para que se vea
    igual en el celular y en la PC, toca reglas; en el dispositivo, no).

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
- El formulario de hábito ofrece doce colores y un ícono del catálogo, y se ven en Hoy.
- Un hábito con pasos se marca paso a paso y cuenta como cumplido al completarlos; las reglas lo
  validan y un hábito sin pasos sigue igual.
- Un canje aparece en "Premios conseguidos" hasta que se marca como usado.
- La calculadora, con la fórmula aprobada por el usuario, sugiere un costo y los dos plazos.
- `shared` con cobertura de al menos 95 %; reglas con caso permitido y denegado por cada regla
  nueva; lint, typecheck y tests en verde.
