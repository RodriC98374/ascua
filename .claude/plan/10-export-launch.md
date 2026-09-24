# 10 — Exportación y cierre del MVP

**Objetivo:** respaldo de datos, sistema de puntos equilibrado, APK final y MVP cerrado.

## Avance (23-09-2026, oficina) — rama `feat/10-export` (sale de `feat/09-notifications`)

Empezada mientras la APK de la fase 09 se construía en EAS. Sale de la rama de la 09 porque las
dos tocan Ajustes.

- `shared/export.ts` (TDD, 100%): `toCsv`, `buildHabitDaysCsv`, `buildPointTransactionsCsv`,
  `buildBackup` y `exportFileName`; `toBoliviaIsoString` en `dates.ts`.
  - **CSV con `;` y BOM UTF-8:** Excel en español (es-BO) usa `;` como separador de listas y con
    comas abriría todo en una columna; el BOM es para que lea los acentos. Google Sheets detecta
    ambos.
  - Hábitos por día: del primer hábito hasta hoy, columnas en el orden del usuario (los archivados
    marcados), 1 / 0 / vacío si ese día no contaba. Los días cerrados usan su `summary`; hoy, las
    marcas.
  - Respaldo: documentos crudos de Firestore (sin converter, para no perder campos), ordenados por
    ID, con cada `Timestamp` en ISO de Bolivia (`-04:00`). Lleva `format` y `formatVersion` para
    restaurarlo a futuro.
- `apps/client/src/data/export-files.ts` (lecturas con `getDocs`, imports relativos) con 4 tests
  contra el emulador, incluido que otra cuenta no puede exportar datos ajenos.
- `features/export/`: sección "Tus datos" en Ajustes. En web descarga el archivo; en Android lo
  escribe en la caché (`expo-file-system`) y abre la hoja de compartir (`expo-sharing`, módulo
  nativo nuevo: **llega al celular con el próximo build**).
- Probado en web con los emuladores y `seed:demo`: los tres archivos se descargan y su contenido
  cuadra (saldo final del CSV = saldo del seed).

## Avance (24-09-2026, oficina) — rama `feat/10-dark-mode` (sale de `feat/10-export`)

El usuario ya prueba la APK de la fase 09 en el celular y pidió terminar todo lo que no dependa
del uso; lo prueba en la web (sin gastar builds de EAS).

- **Modo oscuro (D17).** Fuente única de colores: `apps/client/src/theme/palette.json` (claro y
  oscuro). `tailwind.config.js` convierte cada token en una variable CSS (`:root` y `.dark:root`,
  `darkMode: 'class'`), así que `bg-surface-100` cambia sola de tema, sin pares `dark:`. Las props
  que no aceptan clases (íconos, degradados, gráficas, sombras) usan `useThemeColors()` de
  `theme/colors.ts`. Los neutrales oscuros siguen la revisión fría de la paleta; los estados y
  colores de semana, los `-dark` del diseño aprobado. En oscuro las sombras son negras, y la línea
  del año al filtrar un hábito usa su pastel (el tono fuerte se pierde sobre fondo oscuro).
- **Selector en Ajustes → Apariencia:** Automático / Claro / Oscuro, guardado en cada dispositivo
  (`features/appearance/`, AsyncStorage; en web, `localStorage` con la clave `ascua.theme`).
  Android: NativeWind lo pasa a `Appearance.setColorScheme` (barra de estado y splash siguen al
  tema). Web: clase `dark` en `<html>`, siguiendo la media query en Automático.
- **Web:** `src/app/+html.tsx` aplica el tema guardado antes del primer pintado (sin parpadeo
  blanco), `lang="es"`, `theme-color` por tema; `expo-router/head` pone "Ascua" como título.
- **Íconos de marca.** Reemplazan los de plantilla de Expo (la "A" azul): ícono adaptativo y
  temático de Android, ícono de notificación propio (blanco, antes usaba el monocromo con
  márgenes), splash claro y oscuro, favicon. Se regeneran con
  `node scripts/generate-icons.mjs` desde `apps/client` (Edge headless). **Llegan al celular con
  el próximo build**, igual que el modo oscuro y la exportación en Android.
- Revisado con Edge headless contra los emuladores y `seed:demo` (export `--dev`, servido por el
  emulador de Hosting): claro sin cambios, oscuro y Automático con el sistema oscuro, a 390 px y
  en escritorio, incluidos modales, formulario, semana, mes y año.
- Ojo al probar la web exportada con emuladores: `expo export` sin `--dev` deja `__DEV__` en
  falso y la app ignora `EXPO_PUBLIC_USE_EMULATORS` (a propósito): apunta al proyecto real.

## Tareas

**Modo oscuro (D17)**
- [x] Tokens por tema con variables CSS y selector Automático / Claro / Oscuro en Ajustes.
- [x] Íconos, degradados, gráficas y sombras con los colores del tema.
- [ ] Verlo en el celular con el próximo build.

**Exportación**
- [x] En Ajustes, descargar un **JSON** con todas las colecciones del usuario (respaldo completo, restaurable a futuro).
- [x] **CSV** de hábitos por día (una fila por día y una columna por hábito) y CSV de movimientos de puntos.
- [x] Fechas exportadas como `DateKey` e instantes en ISO con zona horaria.
- [x] En Android se guarda o comparte el archivo con la hoja de compartir del sistema; en web se descarga. (Android: falta probarlo con la APK)

**Calibración de puntos (decisión D9)** — desde ~13-10-2026. Los puntos de cada semana cerrada
se leen en Mes → Semana ("+N pts ganados"), o se suman del CSV de movimientos de puntos.
- [ ] Con al menos 3 semanas de uso real (desde el hito de la fase 06), calcular los puntos promedio ganados por semana.
- [ ] Revisar con el usuario el costo del protector (150), los rangos de recompensas y los bonos. Objetivo de equilibrio: una recompensa pequeña cada 2–4 días, una mediana por semana y una grande por mes de constancia.
- [ ] Si cambian valores: actualizar `constants.ts`, `firestore.rules`, `data-model.md` y `rules/domain-invariants.md`, y registrar la decisión en el README con fecha. El historial no se recalcula (los movimientos guardan su monto).

**Cierre**
- [x] Íconos, splash y favicon de marca (24-09-2026).
- [ ] APK final con el perfil de producción de EAS, instalada en el celular. Sin EAS Update por decisión del usuario (23-09-2026): cada cambio llega con un build nuevo, así que conviene juntar cambios.
- [ ] Revisar en la consola de Firebase que el uso quede holgadamente dentro de la cuota de Spark.
- [ ] Actualizar el Estado y la Bitácora; marcar el MVP como cerrado.

## Definición de terminado

- El JSON exportado contiene todos los datos y se abre sin errores.
- Los valores de puntos quedaron confirmados por el usuario y documentados.
- ~~Un cambio menor publicado con EAS Update llega a la app instalada sin reinstalar.~~ Sin EAS Update (decisión del usuario, 23-09-2026).
- El modo oscuro se ve bien en la web y en el celular.
- Ninguna fase anterior tiene tareas pendientes.
