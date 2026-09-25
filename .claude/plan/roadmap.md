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
| 18 | **Metas, reflexión y ahorro** | Metas a largo plazo que agrupan hábitos y tareas con su progreso; reflexión guiada del domingo con el resumen de la semana; ahorro apartado hacia una recompensa grande | Sí: subcolecciones nuevas | No |
| 19 | **Respaldo y PC** | Restaurar desde el JSON exportado (`formatVersion` ya existe; con vista previa y confirmación); instalar la web como app en la PC (manifiesto + service worker) | Escritura masiva validada por reglas | No |

## Para después (rompen el costo cero o piden servidor)

- Integración con Google Calendar (OAuth y, probablemente, un servidor).
- Pasos del celular con Health Connect (código nativo; posible sin servidor, pero con permisos
  sensibles).
- Rachas compartidas con amigos: multiusuario real, reglas nuevas y quizá Cloud Functions (fuera
  de Spark).

Estas se vuelven a evaluar solo si el usuario acepta salir del costo cero (decisión D12).
