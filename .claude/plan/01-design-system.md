# 01 — Sistema de diseño

**Objetivo:** fijar la dirección visual **antes** de escribir componentes, para no rehacer la UI.

**Herramienta:** **Claude Design** (D15). El diseño queda en HTML/CSS, que Claude lee como texto (valores exactos de color, tipografía y espaciado) sin procesar imágenes.

## Entregables

1. **Sistema de diseño**
   - Paleta: color principal, neutros, estados (éxito, advertencia, error) y los **5 colores de semana** (morado, azul, turquesa, rosa, verde). Modo claro y oscuro.
   - Tipografía: familia, escala de tamaños y pesos.
   - Espaciado, radios de borde y sombras.
   - Componentes base: botón, tarjeta, check de hábito, chip de nivel, barra de progreso, indicador de racha, contador de puntos, barra de navegación.
2. **Pantallas clave** (a 360 px de ancho, con datos falsos):
   - **Hoy:** racha y saldo, progreso del día, lista de hábitos con los principales destacados, puntos del día.
   - **Mes:** grilla semanal coloreada por semana, % por día, barras por hábito.
   - **Recompensas:** saldo, protectores, catálogo por nivel, confirmación de canje.

Las demás pantallas (gestión de hábitos, estadísticas, ajustes) se construyen directamente en la app siguiendo el sistema.

## Traslado a código

- Los tokens (colores, tipografía, espaciado) se copian a la configuración de NativeWind en la fase 05.
- El enlace al sistema de diseño se guarda en este archivo y en `rules/frontend.md`.

## Definición de terminado

- El usuario revisó el sistema y las 3 pantallas en su celular y los aprobó (o pidió cambios, que ya se aplicaron).
- Enlace registrado y decisión anotada en la Bitácora del README.
