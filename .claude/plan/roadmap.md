# Hoja de ruta después del MVP

Ideas elegidas por el usuario el 24-09-2026 (decisión D18) a partir de la lista de la fase 11.
**No cambian el MVP:** las fases 00–10 siguen igual, y la calibración de puntos y la APK final
cierran el MVP. Estas fases se hacen después, o en paralelo si no tocan lo que se está probando.
Cada una lleva su archivo `NN-<tema>.md` con tareas y Definición de terminado **al empezarla**, no
antes.

## Cómo están ordenadas

- Primero lo que da más motivación con poco esfuerzo; después, los módulos grandes.
- **Juntar lo nativo para gastar pocos builds de EAS** (sin EAS Update, cada cambio nativo o de
  JavaScript llega al celular con un build nuevo). Las fases marcadas con *nativo* suman módulos
  nativos; conviene terminarlas juntas antes del siguiente build.
- Lógica de negocio nueva → primero en `packages/shared` con TDD; cambios de datos → reglas con
  tests contra el emulador (`rules/testing.md`). Funcionalidad nueva = subcolección nueva, sin
  cambiar la forma de lo existente (`data-model.md` §12).

| # | Fase | Qué incluye | Toca datos | Nativo |
|---|---|---|---|---|
| 12 | **Racha en riesgo e hitos** ([12-streak-risk-milestones.md](12-streak-risk-milestones.md), hecha en web) | Aviso en Hoy después de la hora del recordatorio con cuenta regresiva a la medianoche de Bolivia; celebraciones especiales a los 7, 30, 100 y 365 días con insignias propias (SVG) y una vista de insignias ganadas | Poco: los hitos se derivan de la racha; las insignias ganadas, en una subcolección nueva si hace falta guardarlas | No |
| 13 | **Sonidos, llama animada y deslizar** ([13-sounds-flame-swipe.md](13-sounds-flame-swipe.md), hecha en web) | "Tic" al marcar y fanfarria al asegurar la racha (`expo-audio`; sonidos sintetizados por script en lugar de CC0), interruptor en Ajustes; llama vectorial animada en la celebración y el brasero (con SVG + Reanimated en lugar de Lottie o Rive); deslizar un hábito para marcarlo (`react-native-gesture-handler`) sin pelear con el scroll ni con el gesto de atrás | No (preferencias por dispositivo) | Sí (`expo-audio`) |
| 14 | **Task tracker** ([14-task-tracker.md](14-task-tracker.md), hecha en web) | Subcolección `tasks/{taskId}` (título, `dueDateKey`, tamaño o prioridad, `completedAt`, puntos). Sección "Tareas de hoy" en Hoy; las vencidas pasan al día siguiente sin tocar la racha; puntos al cerrar el día en `closePendingDays` con el tipo nuevo `task_completion`; vista semanal con un donut por día | Sí: colección nueva, tipo de movimiento nuevo, reglas | No |
| 15 | **Check-in diario** | Ánimo, energía y foco del 1 al 5 dentro de `DailyLog` (solo hoy, como las marcas); promedios en `MonthlySummary`; línea de "estado mental" en Mes | Sí: campos nuevos en `DailyLog` y resúmenes | No |
| 16 | **Hábitos no diarios y con cantidad** | "N veces por semana" y días fijos (`schedule.type` ya existe); hábitos con meta numérica (0 de 8 vasos) que se cumplen al llegar a la meta. Cambia la evaluación del día y de la racha: fase con TDD fuerte en `shared` y reglas | Sí | No |
| 17 | **Recordatorios por hábito y estadísticas** | Hora propia por hábito (se suma al plan de `planReminders`); mapa de calor del año estilo GitHub; mejor día de la semana, hábito más constante, tendencia contra el mes anterior | Poco: hora opcional en el hábito | Recordatorios: el build los lleva |
| 18 | **Metas, reflexión y ahorro** ([18-goals-reflection-savings.md](18-goals-reflection-savings.md), hecha en web) | Metas a largo plazo que agrupan hábitos y tareas con su progreso; reflexión guiada del domingo con el resumen de la semana; ahorro apartado hacia una recompensa grande | Sí: subcolecciones nuevas | No |
| 19 | **Respaldo y PC** ([19-backup-pwa.md](19-backup-pwa.md), hecha en web) | Restaurar desde el JSON exportado (`formatVersion` ya existe; con vista previa y confirmación); instalar la web como app en la PC (manifiesto + service worker) | Escritura masiva validada por reglas | No |
| 20 | **Asistente con Claude** (decisión D21; [detalle abajo](#fase-20--asistente-con-claude)) | Importar tareas desde un archivo JSON que genera Claude; exportación pensada para que Claude analice el historial; una skill que repite el flujo. Automatizar con un MCP remoto queda como paso ideal y opcional | Poco: crea tareas con la operación existente | Sí, si el selector de archivos es nativo (`expo-document-picker`) |
| 21 | **Mejoras del uso real** ([21-real-use-improvements.md](21-real-use-improvements.md), en curso; D27) | Pestaña "Premios", doce colores e ícono por hábito, hábitos con pasos, premios conseguidos y calculadora de recompensas. Va **antes** de la 20 | Sí: pasos y premios conseguidos | No |

## Fase 20 — Asistente con Claude

Idea del usuario (28-09-2026, decisión D21): usar a Claude como asistente para cargar tareas y
analizar el propio historial. **Es la última fase:** empieza solo cuando la app esté terminada,
probada y con todas las funcionalidades planeadas al 100%. Así el formato de datos ya no cambia
debajo del asistente.

### Qué resuelve

1. **Cargar tareas sin tipearlas.** El usuario le pasa a Claude (en claude.ai, desde el celular o
   la PC) una práctica de la universidad u otro encargo. Entre los dos acuerdan las tareas (título,
   tamaño, fecha de entrega) y Claude genera un archivo JSON. En la app, "Importar tareas" lee el
   archivo, muestra una vista previa y, al confirmar, crea las tareas.
2. **Analizar el historial.** La app exporta los datos en un formato cómodo para Claude. Claude
   busca patrones (tareas que vencen seguido, hábitos que se olvida marcar, días de la semana
   flojos, rachas que se cortan siempre igual) y propone estrategias concretas para mejorar.
3. **Repetirlo sin volver a explicarlo.** Una skill de Claude (ver abajo) guarda el flujo, el
   formato del JSON y los criterios de análisis, para que cada vez sea un pedido corto.

### Paso 1: importar y exportar por archivo (sin servidor)

- **Formato de importación:** JSON versionado (`formatVersion`, como la exportación) con una
  lista de tareas `{ title, size, dueDateKey }`. `size` usa los valores de `TaskSize` y
  `dueDateKey` es `'YYYY-MM-DD'` en hora de Bolivia. Tipos y validación en `packages/shared` con
  TDD (títulos vacíos o largos, tamaño desconocido, fechas mal formadas o pasadas, duplicados,
  límite de tareas por archivo).
- **Importar en la app:** elegir el archivo (web: `<input type="file">`; Android:
  `expo-document-picker`, módulo nativo que llega con un build), vista previa editable con los
  errores marcados, y confirmar. Cada tarea se crea con la **misma operación** que el formulario,
  así las reglas de Firestore la validan igual. Sin atajos: nada de escrituras masivas que se
  salten la operación.
- **Solo crea tareas.** La importación nunca marca tareas ni hábitos como cumplidos: lo que se
  cumple lo marca el usuario, si no la racha y los puntos pierden sentido.
- **Exportación para análisis:** la de la fase 10 (JSON/CSV) ya existe. Revisar si le sirve a
  Claude tal cual o si conviene un resumen propio (por ejemplo, una fila por día con hábitos
  programados y marcados, tareas creadas, cumplidas y vencidas, y la racha), para que el archivo
  sea chico y fácil de leer. Sin datos personales de más.

### Paso 2: skill de Claude

Una skill (en `.claude/skills/` del repo o como skill de claude.ai, a decidir al empezar) con:

- El formato del JSON de importación y un ejemplo válido.
- El flujo de tareas: leer el encargo, proponer el desglose con tamaño y fecha, esperar el
  acuerdo del usuario y recién ahí generar el archivo.
- El flujo de análisis: qué mirar en la exportación, cómo presentar los hallazgos y cómo convertir
  cada uno en una acción concreta (cambiar la hora de un recordatorio, partir una tarea grande,
  bajar la meta de un hábito). Tono honesto y útil, sin sermones.

### Paso 3 (ideal, opcional): automatizarlo con un MCP remoto

Lo ideal sería que Claude cree las tareas directamente, sin pasar el archivo a mano: un servidor
MCP remoto agregado como conector personalizado en claude.ai (funciona en la web y en el
celular), con herramientas `list_tasks` y `create_tasks`.

- **Rompe el costo cero sin servidor (D12):** hace falta un servidor. El candidato es Cloudflare
  Workers en el plan gratis. Solo se hace si el usuario reabre D12 a propósito.
- **Autenticarse como el usuario**, con Firebase Auth REST y un refresh token guardado como
  secreto, y escribir por la API REST de Firestore para que `firestore.rules` siga validando
  todo. **Nunca** el Admin SDK ni una cuenta de servicio: se saltan las reglas.
- **Conector protegido con OAuth**, no con una URL "secreta".
- **Herramientas mínimas:** crear y listar tareas, y leer datos para el análisis. Nada que
  complete tareas ni marque hábitos.
- El formato del paso 1 sirve como contrato de `create_tasks`, y la validación de `shared` se
  reutiliza en el servidor.
- Revisar antes los límites de conectores personalizados del plan de claude.ai del usuario.

## Para después (rompen el costo cero o piden servidor)

- Integración con Google Calendar (OAuth y, probablemente, un servidor).
- Pasos del celular con Health Connect (código nativo; posible sin servidor, pero con permisos
  sensibles).
- Rachas compartidas con amigos: multiusuario real, reglas nuevas y quizá Cloud Functions (fuera
  de Spark).

Estas se vuelven a evaluar solo si el usuario acepta salir del costo cero (decisión D12).
