# 01 — Sistema de diseño

**Estado: hecho y aprobado (21-09-2026).**

**Sistema:** https://claude.ai/artifact/R4ajRu7oMWUMzasdS317Fm (Claude Design, dirección "Brasa Viva").
Para leerlo desde Claude Code: `Artifact` con `action: "read"` y `paths: ["project/README.md", "project/tokens.json"]`. El README es la guía de marca y trae el bloque `theme.extend` para `tailwind.config.js`; `tokens.json` tiene cada token con su uso. **Es la fuente de verdad visual:** si se cambia el diseño, se cambia ahí y se vuelve a leer, no se copia a mano.

## Resumen

- **Concepto:** la racha es una brasa (`ember` naranja → `ember-glow` ámbar en degradado); el día protegido es hielo (`protegido` azul + ícono copo de nieve).
- **Colores:** superficies cálidas (`surface-100/200/300`), texto `ink`/`ink-muted`/`ink-faint`, estados `success`/`warning`/`error`/`protegido` (cada uno con `-fill`, `on-*` y `-soft`), y los 5 colores de semana en orden fijo: `week-morado`, `week-azul`, `week-turquesa`, `week-rosa`, `week-verde` (cada uno con `-soft`). Modo claro y oscuro.
- **Tipografía:** Baloo 2 para títulos y números; Nunito para texto. Se cargan con `@expo-google-fonts` (un archivo por peso).
- **Forma:** espaciado de Tailwind por defecto (4 px); radios `sm` 8, `md` 12, `lg` 18, `xl` 24, `full`; sombras con tinte cálido en claro.
- **Estados del día:** completado (verde + check), perfecto (degradado brasa + estrella), protegido (azul + copo), perdido (rojo), sin hábitos (apagado), hoy (anillo `ember-strong` de 2 px, sin relleno).
- **Voz:** español neutro, de tú, celebra lo logrado ("¡Te lo ganaste!"), nunca "fallaste". Cifras siempre con unidad o contexto ("+50 hoy", "disponibles mañana"). **Sin emoji** en la interfaz: íconos propios de 24 × 24, un solo color.
- **Componentes:** Button, Card, HabitCheck, RewardChip, ProgressBar, StreakIndicator, PointsCounter, protectores (0/1/2), NavBar. Pantallas de referencia: Hoy, Mes y Recompensas a 360 px.

## Pendientes de implementación

1. ~~**Navegación**~~ Resuelto por D16: 4 pestañas, Hoy / Mes / Recompensas / Ajustes.
2. **Modo oscuro** (fase 10, D17): el bloque del README duplica cada color (`bg-surface-100 dark:bg-surface-100-dark`). Antes de copiarlo, verificar en la documentación de NativeWind si se pueden usar variables CSS por tema en `global.css`, para que cada clase cambie sola de tema. Si no es posible, usar los pares tal como vienen.
3. **Sombras en Android** (fase 09, con la primera APK): `boxShadow` funciona en web; en Android revisar el soporte de NativeWind o usar `elevation`.
4. ~~**Regla de racha**~~ Resuelto: el README del diseño dice "los 3 principales"; la regla real es **todos los principales programados** (pueden ser menos de 3). En el código manda `data-model.md`, y los textos de la app lo dicen así.

Hecho en la fase 04: los tokens del **tema claro** ya están en `apps/client/tailwind.config.js` (sin los pares `-dark`, que dependen del punto 2) y las fuentes se cargan en `src/theme/fonts.ts`. **Ojo:** el README del diseño llama a la fuente `BalooTwo_*`, pero el paquete la exporta como `Baloo2_*`; en el código manda `Baloo2_*`.
