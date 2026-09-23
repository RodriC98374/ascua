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

## Tareas

**Exportación**
- [x] En Ajustes, descargar un **JSON** con todas las colecciones del usuario (respaldo completo, restaurable a futuro).
- [x] **CSV** de hábitos por día (una fila por día y una columna por hábito) y CSV de movimientos de puntos.
- [x] Fechas exportadas como `DateKey` e instantes en ISO con zona horaria.
- [x] En Android se guarda o comparte el archivo con la hoja de compartir del sistema; en web se descarga. (Android: falta probarlo con la APK)

**Calibración de puntos (decisión D9)**
- [ ] Con al menos 3 semanas de uso real (desde el hito de la fase 06), calcular los puntos promedio ganados por semana.
- [ ] Revisar con el usuario el costo del protector (150), los rangos de recompensas y los bonos. Objetivo de equilibrio: una recompensa pequeña cada 2–4 días, una mediana por semana y una grande por mes de constancia.
- [ ] Si cambian valores: actualizar `constants.ts`, `firestore.rules`, `data-model.md` y `rules/domain-invariants.md`, y registrar la decisión en el README con fecha. El historial no se recalcula (los movimientos guardan su monto).

**Cierre**
- [ ] APK final con el perfil de producción de EAS, instalada en el celular. EAS Update configurado para cambios posteriores.
- [ ] Revisar en la consola de Firebase que el uso quede holgadamente dentro de la cuota de Spark.
- [ ] Actualizar el Estado y la Bitácora; marcar el MVP como cerrado.

## Definición de terminado

- El JSON exportado contiene todos los datos y se abre sin errores.
- Los valores de puntos quedaron confirmados por el usuario y documentados.
- Un cambio menor publicado con EAS Update llega a la app instalada sin reinstalar.
- Ninguna fase anterior tiene tareas pendientes.
