# Propuesta de mejora de UI/UX

**Rama:** `feat/ui-refresh`, desde `feat/17-reminders-stats` (usa el formulario con recordatorio de
la 17). Pedida por el usuario el 29-09-2026: la interfaz le resultaba poco amigable y no le gustaba
elegir la hora en una grilla de casillas. **Es una propuesta:** se revisa y se aprueba o se ajusta
antes de unirla. No toca datos, reglas ni `shared`; no quita ninguna función.

## Qué se revisó

Todas las pantallas a 390 px en claro y oscuro (Edge headless), contra las guías de la skill
`ui-ux-pro-max` (táctil, formularios, jerarquía, consistencia) y patrones de apps de hábitos y de
selectores de hora en el celular (rueda de la alarma, hoja inferior, horas rápidas).

Lo que más pesaba:
1. **Hora en grilla:** un modal centrado con 36 casillas (24 horas + 12 minutos). Mucho para leer y
   lejos del pulgar.
2. **Fondo y tarjetas:** fondo blanco con tarjetas casi blancas y una sombra naranja en todas; se veía
   borroso y sin separación.
3. **Opción elegida distinta en cada control:** borde negro (días, categoría, "Para cuándo"), borde
   naranja (tipo, tamaño) o aro negro (color). Costaba ver qué estaba elegido.
4. **Hoy:** principales en fichas sueltas y secundarios en una tarjeta; casillas cuadradas chicas;
   un hábito hecho se veía igual que uno pendiente; el "3 de 3" casi no se veía.
5. **Check-in:** 15 píldoras grises iguales; solo el número decía qué se eligió.
6. **Formulario de hábito:** una sola columna larga sin grupos; al editar, "Con cantidad" aparecía
   sin control.
7. **Ajustes:** "Cerrar sesión" era lo primero de la pantalla.

## Qué cambia

| Dónde | Antes | Ahora |
|---|---|---|
| Selector de hora (hábito y Ajustes) | Modal con grilla de casillas | **Hoja inferior** con dos **ruedas** (hora y minutos cada 5) que giran con el dedo o la rueda del mouse, tic al pasar cada valor, toque para llevar un valor al centro, y **horas rápidas**: Mañana 07:00, Mediodía 12:00, Tarde 18:00, Noche 21:00. La fila muestra la hora en una pastilla con reloj |
| Fondo (claro) | `surface-100` blanco, tarjetas `#FAFAF9` | Fondo gris cálido `#F5F4F2`, **tarjetas blancas**, `surface-300` `#EBE9E6`. Oscuro sin cambios |
| Sombra de `Card` | Naranja, 12 px, 18 % | Neutra y corta (6 px, 6 %). El brillo cálido queda para la tarjeta de racha y el botón flotante |
| Opción elegida | Tres estilos distintos | Uno solo en toda la app (`choice-styles.ts`): relleno brasa suave con borde brasa. Color: check del tono oscuro dentro del círculo |
| Hoy | Fichas sueltas + tarjeta | **Una tarjeta por sección** (lista del celular), casillas **redondas** de 28 px, el nombre de lo hecho se apaga, avance en pastilla que se pone **verde con check** al completar (`SectionHeader`). Botones de cantidad de 44 px |
| Check-in | Píldoras 1–5 grises | **Barra de nivel** que se llena hasta el valor, y el valor en palabras junto al nombre ("Bien", "A tope", "Bastante") |
| Formulario de hábito | Una columna | Cuatro tarjetas: **Lo básico, Cómo cuenta, Recordatorio, Aspecto**; frecuencia con círculo de opción; lo que no se puede cambiar al editar, en una caja gris con el porqué; **vista previa** de la casilla con el color elegido; días en una sola fila |
| Ajustes | Cuenta arriba | Cuenta al final |

## Pendiente de decidir con el usuario

- Si aprueba el fondo gris con tarjetas blancas: cambia la revisión de la paleta del 22-09-2026
  (anotarla en [01-design-system.md](01-design-system.md) como definitiva y pasarla al artefacto de
  Claude Design, pendiente 5).
- Siguientes candidatos, sin hacer: barra inferior fija con "Guardar" en formularios largos,
  cerrar la hoja deslizándola hacia abajo, texto de cuerpo a 15–16 px, y la grilla "Hábito por
  hábito" de Mes (nombres cortados).

## Cómo verla

`npm run demo` y abrir http://localhost:8082 (ver el comando completo en el CLAUDE.md). Mirar Hoy,
editar "Leer" (Recordatorio → Hora) y Ajustes → Recordatorios. Tema claro y oscuro desde Ajustes.
