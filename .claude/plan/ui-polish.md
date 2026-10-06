# Repaso de diseño (UI/UX)

**Rama:** `feat/ui-polish`, desde `feat/21-real-use-improvements` (incluye la segunda y la tercera
ronda de la fase 21, que todavía no están en `develop`). Pedido por el usuario el 02-10-2026: buscar
textos poco coherentes, botones, sombras, cajas y contrastes que no estén bien, y entregar la mejora
como **propuesta en una rama aparte**. No toca datos, reglas ni `shared`; **no quita ninguna
función**.

**Estado: hecho.** Los 13 hallazgos aplicados y la pantalla de inicio de sesión revisada. El usuario
lo aprobó en su demo y se unió a `develop` el 05-10-2026. Publicado el 06-10-2026 con la versión
de la fase 21.

## Qué se revisó

- Todas las pantallas de la demo en claro y oscuro (Edge headless), 28 capturas de "antes". Quedaron
  en la carpeta temporal de la sesión, no en el repo: para comparar hay que volver a tomarlas.
- El contraste de cada par texto/fondo de `theme/palette.json`, contra las reglas de
  [01-design-system.md](01-design-system.md) (`ink-faint` nunca en texto de cuerpo, `ember` nunca
  como texto, presionado 0,85 y deshabilitado 0,4, un radio por tipo de pieza).
- El código: opacidades de toque, grosores de borde, sombras, colores sueltos y textos tenues.
- La pantalla de inicio de sesión (05-10-2026, con un perfil de navegador sin sesión): sin
  hallazgos propios; toma la etiqueta única del hallazgo 6.
- La lista pasó por las skills de diseño `ui-ux-pro-max` y `frontend-design` (ver abajo).

## Hallazgos

| # | Qué | Arreglo | Estado |
|---|---|---|---|
| 1 | **Texto tenue que no se lee** en claro: `ink-faint` daba 2,3 a 2,5:1 (sugerencias de los campos, contador "0/60", "Así se verá", la fila "No te tocan hoy", pestañas inactivas, borde de la casilla) | `ink-faint` y `vacio` pasan de `#A8A29E` a `#88827B` (al menos 3:1 sobre las tres superficies). Además, los **textos** que usan `ink-faint` pasan a `ink-muted`: la ayuda de `components/ui/text-field.tsx`, "Así se verá" en `features/habits/habit-form.tsx`, `features/today/not-today-row.tsx` (dos lugares) y la pestaña inactiva de `components/nav-bar.tsx` | Hecho |
| 2 | **Etiqueta de recompensa chica** (`RewardChip`): `week-verde` sobre `week-verde-soft`, 2,87:1 | `success` sobre `success-soft` (4,5:1 o más, ya cubierto por el test) | Hecho |
| 3 | **Texto sobre fondos suaves** entre 4,2 y 4,4:1 (brasa, éxito, aviso, error y azul de la semana) | Fondos suaves aclarados: `success-soft` `#E3F8E9`, `warning-soft` `#FFF1D9`, `error-soft` `#FCE6E3`, `week-azul-soft` `#E8F0FE`. Todos los pares quedan en 4,5:1 o más | Hecho |
| 4 | **Botones "Descargar"** de Ajustes con estilo propio: `ember-strong` sobre `surface-300`, 4,27:1 | `Button` `secondary` en la fila (la fila deja de ser el botón); `Button` suma `accessibilityLabel` para que el lector diga "Descargar respaldo completo" | Hecho |
| 5 | **Formularios desparejos**: hábito y meta agrupan en tarjetas (`FormSection`); recompensa y tarea ponen los campos sobre el fondo, y la recompensa mezcla una sola tarjeta | `FormSection` en los dos: recompensa en "Lo básico" y "Cuánto cuesta" (la calculadora pierde su tarjeta propia y va dentro); tarea en una sola, "Tu tarea" | Hecho |
| 6 | **Dos estilos de etiqueta** en un mismo formulario: la de `TextField` (chica y gris) y `FieldLabel` (cuerpo y negra) | Una sola, `FieldLabel` (cuerpo, negrita, `ink`): la usa `TextField` y los grupos de opciones. Cambia la etiqueta de todos los campos de texto de la app | Hecho |
| 7 | **Ayuda bajo el campo alineada a la derecha**, como si fuera el contador ("El rango del nivel es una sugerencia") | `TextField` separa `hint` (ayuda, a la izquierda, bajo el error) de `counter` (contador, a la derecha); los ocho contadores pasan a `counter` | Hecho |
| 8 | **Sub-etiqueta de la opción elegida** distinta: gris en el nivel de la recompensa, brasa en el tamaño de la tarea | `choiceContainer`/`choiceLabel` en el nivel de la recompensa y en las horas rápidas de `TimeField` | Hecho |
| 9 | **Opacidades fuera de la regla**: cinco `active:opacity-70` y deshabilitados en `opacity-30`/`opacity-50` (`(hoy)/index.tsx`, `time-field.tsx`, `quantity-check.tsx`) | Presionado 85 y deshabilitado 40 en todos. Quedan aparte, a propósito, el atenuado de la grilla al resaltar un hábito y el círculo vacío de "no cumplido": no son estados de un control | Hecho |
| 10 | **Bordes de campo** de dos grosores: `border-2` y `border-[1.5px]` (por ejemplo, el campo del ícono) | `border-2` en campos y opciones (campo del ícono, fechas y horas rápidas, montos de la alcancía). El campo del ícono toma también el radio de los campos (`rounded-sm`). `Button` `secondary` sigue en 1,5 px: es del diseño del botón | Hecho |
| 11 | La etiqueta **"Motivac…"** se corta en "Cómo te sentiste" (Mes y Año) | El nombre de la escala va solo en su línea y el punto de color pasa junto al número | Hecho |
| 12 | La columna de nombres de **"Hábito por hábito"** corta los nombres ("Leer 20 min…") | Dos líneas: columna de 120 px y filas de 36 px | Hecho |
| 13 | El **"?"** de la calculadora tiene un área de toque menor a 44 px | El botón mide 44 × 44 con el círculo de 20 px adentro. No alcanza con `hitSlop`: no pasa del borde de la vista que lo contiene y React Native Web lo ignora | Hecho |

El tema oscuro ya cumplía todos los pares: no cambia.

## Paso por las skills de diseño

Con `ui-ux-pro-max` (lista de revisión por prioridad) y `frontend-design` (criterio: contención y
nada de adorno), antes de aplicar:

- **Confirmados sin cambios:** contraste 4,5:1 (1 a 4), áreas de 44 px (13), ayuda visible bajo el
  campo y agrupar campos relacionados (5 y 7), preferir que el texto entre antes que cortarlo (11 y
  12), un solo lenguaje para estados y bordes (8, 9 y 10).
- **Ajustados por las skills:** en el 4, un botón de verdad en vez de una fila entera que parece
  botón (un control por acción); en el 5, la tarea va en **una** tarjeta y no en tres con título
  cada una (títulos que no agregan nada); en el 6 se elige la etiqueta grande (14 px en `ink`) y no
  la chica gris; en el 7 la ayuda sigue a la vista aunque haya un error.
- **Observaciones que no se aplicaron** (cambian el diseño aprobado o suman funciones; a decidir
  por el usuario): la etiqueta de nivel de la recompensa va en mayúsculas (`RewardChip`); el campo
  de contraseña no tiene "mostrar"; los días por venir de la grilla usan `ink-faint` como texto (se
  dejó: es el estado inactivo y pasar a `ink-muted` los confunde con los pasados).

## Qué se dejó como está

- No hay colores sueltos en los componentes ni `ember` usado como texto.
- Los verbos de los botones son coherentes ("Guardar" en todos los formularios).
- "Premios" (pestaña y pantalla) y "recompensa" (botones y formularios) conviven a propósito (D27).
- Avisos de la consola en desarrollo (`onPress` en piezas de `react-native-svg` en la vista Año, y
  las deprecaciones de `shadow*` y `pointerEvents` de React Native Web): no se ven en producción.

## Cómo queda protegido

`apps/client/src/theme/colors.test.ts` mide el contraste de la paleta en los dos temas: cada par de
texto y fondo debe dar 4,5:1 o más, e `ink-faint` 3:1 sobre las tres superficies. Con la paleta
anterior fallaban dos casos.

## Definición de terminado

- Los 13 hallazgos aplicados o descartados con su motivo, y la pantalla de inicio de sesión revisada.
- Ninguna función ni texto de ayuda se pierde: cada pantalla hace lo mismo que antes.
- Capturas de "después" en claro y oscuro revisadas contra las de "antes".
- Lint, typecheck y tests en verde.
- El usuario la revisa en su demo antes de unirla a `develop`.

**Hecho el 05-10-2026**, con la revisión del usuario. Capturas de 14 pantallas (inicio de sesión,
Hoy, Premios, los cuatro formularios, la calculadora abierta, Ajustes, Semana, Mes y Año) antes y
después a 390 px en claro, después en oscuro y a 360 px. Medido en el navegador: el "?" pasó de
20 × 20 a 44 × 44, y Mes pasó de cuatro nombres cortados a ninguno. Las capturas quedaron en la
carpeta temporal de la sesión, no en el repo.
