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
| 11 | **Doce colores** de hábito en lugar de ocho: se suman lima, canela, pizarra y orquídea, cada uno con su tono oscuro (en la segunda ronda pasaron a 24) | No (las reglas aceptan cualquier hexadecimal) | Hecho |
| 10 | **Ícono por hábito** (desde la tercera ronda, todo hábito muestra uno: el elegido o el de su categoría): 96 íconos en seis grupos (catálogo en `shared/habit-icons.ts`), elegidos en una hoja inferior desde el formulario. Se ve antes del nombre en Hoy, en el tono oscuro del color del hábito. **Solo íconos, sin emojis** (un emoji puede ir en el nombre). El campo `icon` ya existía; "sin ícono" guarda `check`. La restauración conserva el ícono del respaldo | No (las reglas aceptan un texto de 1 a 40) | Hecho |
| 2 | **Hábitos con pasos** (subtareas): un hábito como "Rutina de noche" lista de 2 a 6 pasos y se cumple al marcarlos todos. Opcional, en "Cómo cuenta" del formulario ("Con pasos", con aviso), editable; no aplica a un hábito con cantidad. En Hoy, la casilla del hábito se marca sola y cada paso tiene su subcasilla; el último paso suena y suelta los puntos. Lógica en `shared/habit-steps.ts`; la marca del día guarda `doneSteps`. **Máximo 6** porque con 8 la escritura del hábito (con días fijos y recordatorio) pasaba el límite de evaluación de las reglas. La demo trae "Dormir antes de las 23:00" con tres pasos | Sí: campo `steps` en `habits` (validado en reglas) y `doneSteps` en `entries` | Hecho |
| 5 | **Premios conseguidos (trofeos)**: tarjeta en Premios ("N por usar · M en total", con contador) que lleva a `/recompensas/trofeos`, una vitrina de tres bloques por fila: regalo, medalla o trofeo según el nivel; los por usar con borde de brasa, los usados con un visto verde. Entran uno tras otro con un rebote. Al tocar uno, tarjeta modal con lo conseguido, cuándo, cuánto costó y la nota; "Utilizado" lo marca y lo celebra (rebote, chispas, vibración y sonido), una sola vez y sin deshacer. Orden: el más nuevo primero (`trophyShelf` en shared). La demo trae canjes usados y por usar | Sí: `usedAt` en `rewardRedemptions` (regla nueva) y la operación `markTrophyUsed` | Hecho |
| 3 | **Calculadora de recompensas**: en el formulario de recompensa, "Cuesta dinero" (apagado por defecto: una gratis no la usa) pide el precio en Bs y muestra el costo sugerido, un "?" que explica que es solo una sugerencia, cuándo alcanza el dinero (meses de presupuesto) y cuándo los puntos (ritmo real: promedio de los días cerrados de los últimos 30), y "Usar N pts" que llena el costo. El mes perfecto sale de simular 30 días desde un lunes con `evaluateDay` (el mismo cálculo del cierre: hábitos, día perfecto, bonos de racha y tope de los semanales). Costo redondeado a múltiplos de 5. El presupuesto se edita en Ajustes → Premios o desde la calculadora. Lógica en `shared/reward-calculator.ts`. La demo trae 250 Bs | Sí: `rewardBudget` en el perfil (entero de 1 a 100000 Bs, o null), validado en reglas | Hecho |

### Segunda ronda (02-10-2026): ajustes tras probar la demo

El usuario probó pasos, trofeos y calculadora en su demo ("está bien en general") y pidió:

| Qué | Toca datos o reglas | Estado |
|---|---|---|
| **Casilla en el hábito con cantidad**: sin ella la fila parecía otra cosa. No se toca: se marca sola al llegar a la meta, y el contador queda debajo, alineado con el nombre (igual que los pasos) | No | Hecho |
| **Aviso de "Utilizado" al canjear**: la celebración dice que el premio queda en la vitrina y que se marca como utilizado al disfrutarlo, con el botón "Ver mi vitrina" | No | Hecho |
| **24 colores** de hábito (12 más: amarillo, pistacho, jade, cian, índigo, violeta, fucsia, salmón, cobalto, oliva, topo y salvia, cada uno con su tono oscuro). El formulario muestra **ocho** (siempre con el elegido a la vista) y "Más colores" abre una hoja con todos | No | Hecho |
| **Color distinto por hábito nuevo**: antes lo proponía la categoría y varios hábitos de la misma categoría pintaban las gráficas de un solo color. Ahora `nextHabitColor` propone el primer color de `HABIT_COLOR_ROTATION` que ningún hábito activo usa (si se usan todos, el menos repetido). Cambiar de categoría ya no cambia el color; el usuario sigue eligiendo el que quiera. El color de la categoría queda para su punto en el formulario, el radar del año y el respaldo de un color inválido | No | Hecho |
| **Celebración del canje a pantalla completa**: el trofeo del nivel cae y rebota con un "tada", rayos que giran un cuarto de vuelta, onda, chispas, lluvia de confeti (`components/ui/confetti.tsx`), el saldo que rueda a lo que queda, "Ya son N premios conseguidos" y la fanfarria `reward` (sintetizada en `generate-sounds.mjs`). Todo termina quieto | No | Hecho |
| **Todo hábito se ve con ícono** (tercera ronda): sin uno elegido se perdía la uniformidad de la lista. Ya no existe "Sin ícono": el que no elige lleva el de su categoría (`habitIconFor` y `CATEGORY_HABIT_ICONS`: salud, físico, mental, académico y otro). Se sigue guardando `check`, así el ícono acompaña a la categoría si cambia | No | Hecho |
| **Categorías sin punto de color** en el formulario (desde que el color no sale de la categoría, confundía) y **hoja de "Más colores" ordenada por tono** (`HABIT_COLORS_BY_HUE`: la rueda de color y los tres apagados al final) | No | Hecho |

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
  - **Presupuesto en la cuenta (02-10-2026):** se guarda en el perfil (`users/{uid}`), igual en
    el celular y en la PC, y se edita cuando sea. Toca las reglas del perfil. Se edita desde una
    sección de Ajustes: una pestaña de "Perfil" aparte no entra en la barra (ya tiene cinco).

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
- El formulario de hábito ofrece 24 colores (ocho a la vista) y un ícono del catálogo, y se ven en
  Hoy. Cada hábito nuevo propone un color que no usa otro activo.
- Un hábito con pasos se marca paso a paso y cuenta como cumplido al completarlos; las reglas lo
  validan y un hábito sin pasos sigue igual.
- Un canje aparece en "Premios conseguidos" hasta que se marca como usado.
- La calculadora, con la fórmula aprobada por el usuario, sugiere un costo y los dos plazos.
- `shared` con cobertura de al menos 95 %; reglas con caso permitido y denegado por cada regla
  nueva; lint, typecheck y tests en verde.
