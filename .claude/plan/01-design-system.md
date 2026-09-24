# 01 — Sistema de diseño

**Estado: hecho y aprobado (21-09-2026).**

**Sistema:** https://claude.ai/artifact/R4ajRu7oMWUMzasdS317Fm (Claude Design, dirección "Brasa Viva").
Para leerlo desde Claude Code: `Artifact` con `action: "read"` y `paths: ["project/README.md", "project/tokens.json"]`. El README es la guía de marca y trae el bloque `theme.extend` para `tailwind.config.js`; `tokens.json` tiene cada token con su uso. **Es la fuente de verdad visual:** si se cambia el diseño, se cambia ahí y se vuelve a leer, no se copia a mano.

## Resumen

- **Concepto:** la racha es una brasa (`ember` naranja → `ember-glow` ámbar en degradado); el día protegido es hielo (`protegido` azul + ícono copo de nieve).
- **Colores:** superficies neutras (`surface-100/200/300`, ver la revisión de abajo), texto `ink`/`ink-muted`/`ink-faint`, estados `success`/`warning`/`error`/`protegido` (cada uno con `-fill`, `on-*` y `-soft`), y los 5 colores de semana en orden fijo: `week-morado`, `week-azul`, `week-turquesa`, `week-rosa`, `week-verde` (cada uno con `-soft`). Modo claro y oscuro.

## Revisión de la paleta (22-09-2026)

Al probar la fase 08 el usuario vio la app **demasiado monocromática**: no era solo el acento
naranja, también los neutrales eran crema (`#FFF8F0`, `#FDEEDF`, borde `#F1DFCB`, texto `#2B1B12`),
así que la brasa no contrastaba con nada. Decisión suya: **no estamos atados a la paleta del
mockup**. Dos cambios, aprobados antes de implementarlos:

1. **Neutrales fríos.** `surface-100` `#FFFFFF`, `surface-200` `#FAFAF9`, `surface-300` `#F1F0EE`,
   `border` `#E0DEDA`, `ink` `#1C1917`, `ink-muted` `#57534E`, `ink-faint` `#A8A29E`. La brasa es
   lo único cálido y queda como color de marca.
2. **Categoría y color por hábito** (`packages/shared/src/habit-appearance.ts`): Salud, Físico,
   Mental, Académico y Otro, cada una con un color que el formulario **propone** y el usuario puede
   cambiar entre los 8 de `HABIT_COLORS`. Ese color pinta la casilla de Hoy, la marca de la grilla,
   las barras de % por hábito, el donut de la semana y la línea del año al filtrar. Sin rojo en la
   paleta: en toda la app significa "día perdido".
3. **Los colores son pastel, en pares.** `HABIT_COLORS` son los tonos claros y solo rellenan
   superficies grandes (casilla, barra, porción del donut, área de una gráfica). Sobre blanco
   tienen contraste ~1.8:1, así que **todo trazo fino usa `strongHabitColor(color)`**: el aro de la
   marca de la grilla, el check, la línea de una gráfica, el punto junto al nombre. Sin ese par, un
   check pastel de 14 px desaparece contra el fondo. Al agregar un color a la paleta hay que darle
   su tono oscuro; un test comprueba que cada pastel tenga uno más oscuro y distinto.

Como el artefacto de Claude Design todavía tiene la paleta cálida, **la fuente de verdad de estos
dos puntos es este archivo** hasta que el artefacto se actualice (pendiente 5).
- **Tipografía:** Baloo 2 para títulos y números; Nunito para texto. Se cargan con `@expo-google-fonts` (un archivo por peso).
- **Forma:** espaciado de Tailwind por defecto (4 px); radios `sm` 8, `md` 12, `lg` 18, `xl` 24, `full`; sombras con tinte cálido en claro.
- **Estados del día:** completado (verde + check), perfecto (degradado brasa + estrella), protegido (azul + copo), perdido (rojo), sin hábitos (apagado), hoy (anillo `ember-strong` de 2 px, sin relleno).
- **Voz:** español neutro, de tú, celebra lo logrado ("¡Te lo ganaste!"), nunca "fallaste". Cifras siempre con unidad o contexto ("+50 hoy", "disponibles mañana"). **Sin emoji** en la interfaz: íconos propios de 24 × 24, un solo color.
- **Componentes:** Button, Card, HabitCheck, RewardChip, ProgressBar, StreakIndicator, PointsCounter, protectores (0/1/2), NavBar. Pantallas de referencia: Hoy, Mes y Recompensas a 360 px.

## Pendientes de implementación

1. ~~**Navegación**~~ Resuelto por D16: 4 pestañas, Hoy / Mes / Recompensas / Ajustes.
2. ~~**Modo oscuro**~~ Resuelto el 24-09-2026 (fase 10): NativeWind sí admite variables CSS por
   tema (`:root` y `.dark:root` con `darkMode: 'class'`), así que no se usan los pares `-dark`
   del README. Los valores de los dos temas viven en `apps/client/src/theme/palette.json`, fuente
   de verdad de los colores en el código. Oscuro: neutrales fríos derivados de la revisión de
   abajo (`surface-100` `#121110`, `surface-200` `#1C1A18`, `surface-300` `#292624`, `border`
   `#3A3633`, `ink` `#F5F5F4`, `ink-muted` `#BDB7B1`, `ink-faint` `#8C857F`); marca, estados y
   semanas con los `-dark` del diseño. En oscuro las superficies se aclaran al subir (la opción
   elegida del control segmentado va en `border`) y el pulgar del interruptor va claro.
3. **Sombras en Android** (fase 09, con la primera APK): `boxShadow` funciona en web; en Android revisar el soporte de NativeWind o usar `elevation`.
4. ~~**Regla de racha**~~ Resuelto: el README del diseño dice "los 3 principales"; la regla real es **todos los principales programados** (pueden ser menos de 3). En el código manda `data-model.md`, y los textos de la app lo dicen así.
5. **Sincronizar el artefacto de Claude Design** con la revisión de la paleta de arriba (neutrales
   fríos y colores por hábito). Hasta entonces, en esos dos puntos manda este archivo, no el
   artefacto. Al hacerlo, pasarle también los valores oscuros de `palette.json` (punto 2).

Hecho en la fase 04: tokens en `apps/client/tailwind.config.js` (desde la fase 10 salen de `src/theme/palette.json`, con los dos temas) y fuentes en `src/theme/fonts.ts`. **Ojo:** el README del diseño llama a la fuente `BalooTwo_*`, pero el paquete la exporta como `Baloo2_*`; en el código manda `Baloo2_*`.
