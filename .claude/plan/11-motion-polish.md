# 11 — Movimiento, pulido de la interfaz e ideas para crecer

**Rama:** `feat/11-motion-polish`, **aprobada por el usuario y unida a `main` el 24-09-2026**
(la revisó en un canal de vista previa de Hosting). Libertad creativa dada por el usuario, con la inspiración de
Duolingo: animaciones sencillas pero agradables que den la "dopamina" de cumplir la racha.

## Lenguaje de movimiento: "la brasa se aviva"

- Lo que se enciende (una casilla, un segmento del brasero, la brasa) crece un poco de más y se
  asienta con un resorte (`SPRING_POP`). Lo demás es calma: 120–320 ms, salida suave (`EASE_OUT`).
- **Un solo momento grande por día:** asegurar la racha. Todo lo demás son microinteracciones que
  responden a un toque. Sin animaciones infinitas decorativas.
- Solo `transform` y `opacity` (salvo el ancho de las barras de progreso). Con "reducir
  movimiento" activado en el sistema, Reanimated salta cada animación a su final.
- Tokens en `apps/client/src/theme/motion.ts`. `Animated.View` de Reanimated no acepta clases de
  NativeWind: lleva solo `style` y las clases van en un hijo.

## Qué se hizo

| Dónde | Qué pasa |
|---|---|
| Casilla de Hoy | Al marcar, el relleno entra con rebote, el check aparece un instante después, "+10" / "+5" sube desde la casilla y el celular vibra corto. Desmarcar se apaga rápido |
| Brasero | El segmento recién encendido destella hacia afuera y la brasa late; al completar los principales destella el anillo entero |
| Números de Hoy | La racha y los "+N hoy" ruedan como contador (el viejo sale arriba, el nuevo entra desde abajo) |
| **Celebración de racha** | Al cumplir el último principal con la pantalla abierta: pantalla completa con la brasa que se enciende (rebote + giro), una onda, chispas, el número que sube (18 → 19), la semana L–D con hoy encendiéndose al final, y los bonos del día (día perfecto, bono de racha). Una vez por día por dispositivo (`ascua.streakCelebratedOn` en el almacenamiento local). Lee a lo sumo 7 `dailyLogs` |
| Día perfecto | Si llega después de asegurar la racha, el aviso entra con rebote, la estrella gira y saltan chispas |
| Recompensas | La que no alcanza muestra una barra de avance ("575 de 600 pts · Te faltan 25 pts") en lugar de un botón apagado. Al canjear, la medalla rebota con chispas y vibra |
| Primitivas | Botones y "+" se hunden al tocarlos; el control segmentado desliza su pastilla; el interruptor desliza su pulgar y cambia de color; las barras se llenan al cambiar (no al montar, para no mover pantallas enteras) |
| Hoy, filas | Se quitaron las etiquetas PRINCIPAL / SECUNDARIO de cada fila: la sección ya lo dice y el nombre gana espacio. Queda "Último día" para un hábito archivado hoy |

Piezas nuevas: `components/ui/{pressable-scale,rolling-number,sparks,ember-flame}.tsx`,
`features/celebration/` (vibraciones, detección de momentos, celebración y la semana con test).
Dependencia nueva: `expo-haptics` (módulo nativo: la vibración llega al celular con el próximo
build; en web usa la Vibration API si existe).

Revisado con Edge headless contra los emuladores (`seed:demo`), capturando a distintos
milisegundos: marcar, celebración en claro y oscuro, día perfecto, control segmentado,
interruptor y recompensas. Typecheck, lint y tests en verde (cliente 106).

## Plan para lo que es más complejo (no hecho)

Los puntos 3 y 4 se hicieron en la fase 12; los 1, 2 y 5, en la fase 13 (con sonidos
sintetizados y la llama en SVG + Reanimated en lugar de Lottie).

1. **Sonidos** (`expo-audio`): un "tic" al marcar y una fanfarria corta al asegurar la racha, con
   interruptor en Ajustes (apagado en web). Necesita módulo nativo, sonidos CC0 y un build.
2. **Brasa animada de verdad** (Lottie o Rive): una llama vectorial que parpadea en la celebración
   y en el brasero. `lottie-react-native` funciona en Android y web; el costo real es diseñar la
   animación (LottieFiles / After Effects). Se cargaría solo en la celebración para no pesar.
3. **Hitos de racha** (7, 30, 100, 365 días): una celebración distinta con insignia propia. La
   detección va en `shared` (función pura con test) y las insignias, como SVG del sistema.
4. **Racha en riesgo en Hoy**: después de la hora del recordatorio y sin la meta cumplida, la
   tarjeta cambia de tono y muestra cuánto falta para la medianoche de Bolivia (aversión a la
   pérdida, como Duolingo). Necesita un reloj que refresque cada minuto.
5. **Deslizar para marcar** un hábito (`react-native-gesture-handler`, ya instalado), cuidando no
   pelear con el scroll ni con el gesto de atrás de Android. Siempre con el toque como alternativa.
6. **Widget de Android** con la racha y los principales para marcar desde la pantalla de inicio.
   Necesita código nativo (`react-native-android-widget` + config plugin) y más builds de prueba.
7. **Descartado por ahora:** confeti con física en Skia (suma varios MB y en web carga CanvasKit
   en WebAssembly) y transiciones de elemento compartido entre pantallas (experimentales).

## Ideas de funcionalidades

Lista propuesta al usuario. **Las que eligió están ordenadas en fases en
[roadmap.md](roadmap.md) (D18)**; esta lista queda como registro de la propuesta.

**Sobre lo que ya existe**
1. Racha en riesgo e hitos (puntos 3 y 4 de arriba): poca complejidad y mucha motivación.
2. **Frecuencias no diarias**: "3 veces por semana" o días fijos. `schedule.type` ya existe; cambia
   la evaluación de la racha en `shared` y las reglas, así que es una fase con TDD.
3. **Hábitos con cantidad**: vasos de agua 0/8, minutos de lectura; se cumple al llegar a la meta.
4. **Recordatorio por hábito** con su propia hora (hoy hay dos generales).
5. **Estadísticas nuevas**: mapa de calor del año estilo GitHub, mejor día de la semana, hábito más
   constante, tendencia contra el mes anterior.
6. **Recompensas**: meta de ahorro hacia una grande, recompensas recurrentes, lista de deseos.
7. **Restaurar desde el respaldo JSON** (el formato ya trae `formatVersion`).
8. **PWA en la PC**: manifiesto y service worker para abrir la web como app de escritorio.

**Módulos nuevos (escalar)**
1. **Task tracker** (el más natural, ya previsto en `data-model.md` §12): subcolección
   `tasks/{taskId}` con título, `dueDateKey`, prioridad o tamaño, `completedAt` y puntos. En Hoy,
   una sección "Tareas de hoy" bajo los hábitos; las vencidas pasan al día siguiente sin tocar la
   racha; los puntos se acreditan en `closePendingDays` con un tipo nuevo de movimiento
   (`task_completion`). Vista de la semana con un donut por día, como la inspiración original.
   Es una fase completa (shared + reglas + UI), del tamaño de la 05 o la 07.
2. **Check-in de ánimo, energía y foco** (1–5) dentro de `DailyLog`, con la línea de "estado
   mental" en Mes que tenía la hoja original.
3. **Metas a largo plazo** que agrupan hábitos y tareas con su progreso.
4. **Reflexión semanal**: el domingo, una pregunta guiada con el resumen de la semana.
5. **Temporizador de foco** (pomodoro) que marca solo los hábitos de tiempo.
6. **Integraciones** (Google Calendar, Health Connect para pasos): requieren OAuth o código
   nativo; Calendar probablemente un servidor, lo que rompe el costo cero.
7. **Amigos y rachas compartidas**: multiusuario real; cambia reglas y quizá pide Cloud Functions
   (fuera de Spark).

## Pendiente

- [x] Revisión del usuario (web) y su visto bueno para unir a `main` (24-09-2026).
- [ ] Ver en el celular con el próximo build: vibraciones, fluidez en Android, sombras del botón
      que se hunde.
