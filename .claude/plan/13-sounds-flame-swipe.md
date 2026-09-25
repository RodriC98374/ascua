# 13 — Sonidos, llama viva y deslizar para marcar

**Rama:** `feat/13-sounds-flame-swipe` (sale de `main`, con la fase 12 ya unida). Elegida por el
usuario el 25-09-2026. **Sin cambios de datos ni de reglas:** todo es de la app, y las
preferencias se guardan en cada dispositivo, como el tema.

## Decisiones de la fase

- **Sonidos sintetizados** por un script (`apps/client/scripts/generate-sounds.mjs`), como los
  íconos: son originales (sin licencias que revisar), se regeneran con un comando y pesan poco
  (cuatro WAV, 430 KB en total). Se tocan con `expo-audio`, que por defecto se mezcla con la
  música de otras apps (`mixWithOthers`). Su config plugin va **sin micrófono ni reproducción en
  segundo plano** (`app.json`): por defecto agregaba `RECORD_AUDIO` y un servicio que no hacen
  falta.
- **Llama viva con SVG + Reanimated** en lugar de Lottie o Rive: capas de la llama de marca que se
  mueven solo con `transform` y `opacity`. No suma dependencias nativas ni pesa en web, usa los
  colores del tema (claro y oscuro) y sigue las reglas de movimiento. Lottie pedía diseñar la
  animación en After Effects y otra librería más en web.
- **Nada infinito fuera de la celebración:** en el brasero la llama se aviva un par de segundos al
  abrir Hoy y al marcar un principal, y después queda quieta. En la celebración (el único momento
  grande del día) chisporrotea mientras está abierta. Con "reducir movimiento", quieta.
- **Deslizar a la derecha** una fila de Hoy la marca o la desmarca (lo mismo que tocarla, que sigue
  funcionando). `react-native-gesture-handler` ya está en la APK. El gesto solo se activa con un
  movimiento horizontal claro: si el dedo va primero en vertical, gana el scroll.

## Qué se hizo

**Sonidos** (`features/sounds/`)
- Cuatro sonidos: `tick` al marcar, `streak` al asegurar la racha, `milestone` con una insignia y
  `chime` en el día perfecto y al canjear. Suenan junto a cada vibración.
- `sounds.ts`: un reproductor por sonido, creado una vez; `playSound` vuelve al inicio y toca
  (marcar varios seguidos suena cada vez) y nunca falla.
- Preferencia por dispositivo (`ascua.sounds`), **encendidos en Android y apagados en web** por
  defecto (la PC suele estar en la oficina). `SoundsProvider` la lee al abrir; sección "Sonidos"
  en Ajustes con interruptor, que al encenderse toca una muestra.

**Llama viva** (`components/ui/living-flame.tsx`)
- La silueta de la brasa en el degradado de marca y un núcleo `ember-glow` dentro, que se estiran
  y se mecen desde la base. Las ondas son sumas de senos con frecuencias enteras en un ciclo de
  6 s: el bucle no tiene salto y no se nota que se repite.
- Modo continuo en la celebración (en lugar de la brasa quieta; los hitos siguen con su
  insignia). En el brasero, con racha viva, reemplaza al ícono (42 px) y se aviva por ráfagas;
  sin racha sigue el ícono apagado. `EmberFlame` se borró: la llama viva la reemplaza.

**Deslizar para marcar** (`features/today/swipe-to-check*.ts(x)`)
- `GestureHandlerRootView` en la raíz. Umbral, resistencia y decisión al soltar como funciones
  puras con test (35 % del ancho, tope de 120 px; un deslizamiento rápido marca desde la mitad).
- Detrás de la fila aparece el color del hábito con "Marcar" (o "Desmarcar" con una X), que crece
  al llegar al umbral; vibración corta al cruzarlo y la fila vuelve sin pasarse. Desactivado al
  ordenar. En web, `touchAction="pan-y"` deja el scroll vertical al navegador, y el clic que llega
  al soltar un deslizamiento se ignora (si no, marcaría dos veces).

Revisado con Edge headless contra los emuladores (`npm run demo -- --streak=10`), en oscuro y
claro: deslizar con mouse y con toques (marca y desmarca una sola vez), soltar antes del umbral no
marca, arrastrar en vertical sobre una fila hace scroll sin moverla, la llama cambia cuadro a cuadro
en la celebración y en el brasero se aviva al marcar y queda quieta a los 3,5 s, el interruptor
guarda la preferencia. Tests: shared 227, reglas 157, cliente 129.

## Pendiente

- [x] Visto bueno del usuario: unida a `main` el 25-09-2026, sin publicar en producción.
- [ ] Verlo en el celular con el próximo build: sonidos con el volumen multimedia, gesto con el
      scroll y con el gesto de atrás de Android, fluidez de la llama.

## Definición de terminado

- Marcar suena con un "tic" y asegurar la racha con una fanfarria; el interruptor de Ajustes los
  apaga en ese dispositivo y la preferencia sobrevive a reabrir la app.
- La llama se mueve en la celebración y en el brasero sin animaciones infinitas fuera de la
  celebración, en claro y oscuro.
- Deslizar una fila la marca o desmarca sin pelear con el scroll; tocar sigue funcionando.
