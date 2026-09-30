# 19 — Respaldo y PC

**Rama:** `feat/19-backup-pwa`, desde `main`. Empezada el 30-09-2026.
**Toca datos:** no cambia la forma de nada ni las reglas: la restauración crea documentos con las
mismas reglas que los formularios. Suma un módulo nativo (`expo-document-picker`) para elegir el
archivo en Android; en la web funciona sin build.

## Decisiones (D26)

- **Restaurar solo la configuración** (elegido por el usuario el 30-09-2026), en la cuenta actual y
  sin abrir ninguna puerta en las reglas. Del respaldo se recuperan:
  - **Hábitos activos**, que vuelven a empezar **hoy** (E11: un hábito nuevo no puede cambiar días
    pasados). Si ya no quedan lugares de principal (`MAX_PRIMARY_HABITS`), entran como secundarios.
  - **Recompensas activas.**
  - **Tareas pendientes.** Una vencida pasa a vencer hoy (las reglas no aceptan crear una tarea con
    fecha pasada).
  - **Metas activas**, que empiezan hoy, con sus hábitos y tareas vinculados a los nuevos. Una
    fecha límite ya pasada queda sin fecha.
  - **Reflexiones semanales**, tal cual: las reglas ya aceptan cualquier semana terminada.
- **No se restaura:** el historial (días, marcas, check-in, racha, puntos, movimientos, canjes,
  resúmenes), la alcancía, lo archivado, las tareas cumplidas, las metas logradas ni los ajustes.
- **Lo que ya está en la cuenta no se duplica:** un hábito, recompensa o meta activa con el mismo
  nombre, una tarea pendiente con el mismo título o una reflexión de la misma semana se saltan. Si
  una meta restaurada apuntaba a ese hábito o tarea, se vincula con el que ya existe.
- **Vista previa antes de escribir:** cada cosa con su casilla (todas marcadas salvo lo repetido) y
  lo que cambia al restaurarla (pasa a secundario, vence hoy, sin fecha límite). Nada se escribe
  hasta confirmar.
- **La web se instala como app en la PC y abre sin internet** (elegido por el usuario): manifiesto,
  íconos y un service worker propio (sin dependencias) que guarda la app al instalarse. Las páginas
  van primero a la red y, sin conexión, a lo guardado; los archivos con hash, primero a lo
  guardado. Los datos sin conexión ya los da la caché persistente de Firestore en la web. Una
  versión nueva se toma al volver a abrir la app. Solo en la web publicada: en desarrollo no se
  registra.

## Tareas

**Núcleo (`shared`, TDD)**
- [x] `readBackup`: lee el texto del archivo, comprueba formato y versión, valida cada documento
      restaurable y cuenta los que no se pueden leer.
- [x] `planRestore`: repetidos, principales que pasan a secundarios, tareas vencidas, fechas
      límite pasadas y vínculos de las metas, según lo elegido.

**Operaciones (emulador)**
- [x] `restoreConfiguration`: crea lo elegido en lotes, con los vínculos de las metas a los IDs
      nuevos; pasa las reglas sin cambiarlas.

**App**
- [x] Ajustes → Tus datos → "Restaurar desde un respaldo": elegir archivo, vista previa, confirmar
      y resultado.
- [x] PWA: manifiesto, íconos 192/512 (y maskable), service worker generado al exportar la web,
      registro solo en producción, botón "Instalar en esta PC" cuando el navegador lo ofrece.
- [x] `firebase.json`: reescrituras de las rutas de Metas (faltaban desde la fase 18) y cabeceras
      del service worker y el manifiesto. El build falla si una ruta dinámica no tiene reescritura.

**Cierre**
- [x] Revisión en web (claro y oscuro): restaurar un respaldo de la demo en otra cuenta y en la
      misma (todo repetido); instalar y abrir sin conexión con la web exportada.
- [x] La app abre sin conexión: la puerta de la cuenta ya no exige red (`isAccountCached`).
- [ ] Revisión del usuario. Probar "Instalar" en su Edge (el headless no lo ofrece) y, al
      publicar, que las cabeceras de `sw.js` y del manifiesto lleguen (el emulador de Hosting no
      aplica cabeceras).

## Lo que salió al revisar

- **Faltaban las reescrituras de Metas** en `firebase.json` desde la fase 18: recargar una meta en
  Hosting habría dado 404. Agregadas, y `build-pwa.mjs` ahora rompe el build si falta una.
- **Sin conexión, la app se quedaba en "No pudimos preparar tu cuenta":** la puerta de la cuenta
  corría la transacción de `initializeAccount`, que exige el servidor. Ahora, si el perfil y el
  estado de puntos ya están en la caché local, no la corre (nunca se borran).
- **La vista previa mostraba lo repetido fila por fila** y tapaba lo nuevo; ahora las secciones
  solo listan lo que se puede recuperar y lo repetido va resumido en una línea.
- Con varias pestañas de fondo en Edge headless, la exportación no terminaba: la pestaña principal
  de la caché multipestaña queda frenada. Con una sola pestaña, bien; no se tocó.

## Cómo probarlo

- **Restaurar:** en la demo, Ajustes → Tus datos → "Descargar" el respaldo completo, cambiarle el
  nombre a algún hábito o tarea dentro del JSON y restaurarlo desde "Restaurar desde un respaldo".
  El mismo archivo sin cambios muestra todo como repetido.
- **Web instalable:** solo en la web exportada (`npm run build:web`). En la web publicada, Edge o
  Chrome muestran "Instalar" en Ajustes → "Ascua en esta PC" (y el ícono en la barra de
  direcciones). Para probar sin conexión: abrirla una vez con internet, esperar unos segundos a que
  guarde la app y cortar la red.

## Definición de terminado

- Un respaldo de la demo restaurado en una cuenta vacía deja sus hábitos, recompensas, tareas
  pendientes, metas y reflexiones, con las metas apuntando a los nuevos; restaurado otra vez en la
  misma cuenta no duplica nada.
- Un archivo que no es un respaldo, o de una versión más nueva, se rechaza sin escribir nada.
- La web exportada se instala desde Edge o Chrome y, sin conexión, abre y muestra los datos que ya
  tenía.
