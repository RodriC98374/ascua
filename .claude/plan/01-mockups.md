# 01 — Mockups

**Objetivo:** fijar la dirección visual y la navegación **antes** de escribir componentes, para no rehacer la UI en React.

**Por qué vale la pena:** la app es muy visual (colores por semana, varias gráficas, mobile-first) y el requerimiento pide "atractiva, minimalista pero no simple". Cambiar un mockup HTML toma minutos; cambiar componentes React ya conectados a Firestore toma horas.

## Formato

- HTML estático con Tailwind (CDN) y datos falsos, un archivo por pantalla en `.claude/mockups/`.
- Diseñado a 360 px de ancho y revisado también en escritorio.
- Gráficas con Chart.js por CDN, solo como referencia de forma; la implementación final usa Recharts.
- Sin lógica: nada se reutiliza tal cual; el objetivo es acordar el diseño.

## Pantallas

| Archivo | Pantalla | Contenido clave |
|---|---|---|
| `design-tokens.html` | Sistema visual | Paleta (5 colores de semana: morado, azul, turquesa, rosa, verde), tipografía, espaciado, modo claro/oscuro |
| `today.html` | Hoy (inicio) | Racha y saldo arriba, progreso del día, lista de hábitos con check, principales destacados, puntos provisionales |
| `month.html` | Mes | Grilla semanal de checks coloreada por semana, % por día, barras de % por hábito |
| `stats.html` | Estadísticas | Selector semana/mes/año, línea de cumplimiento, barras por hábito, historial de racha |
| `rewards.html` | Recompensas | Saldo, protectores (0–2) con botón de compra, catálogo por nivel, confirmación de canje, historial |
| `habits.html` | Gestión de hábitos | Lista, crear/editar (nombre, ícono, color, principal/secundario), archivar |
| `settings.html` | Ajustes | Recordatorios, dispositivos con push, exportar, cerrar sesión |

La navegación va en una barra inferior (mobile) que se convierte en barra lateral en escritorio. Se acuerda en `today.html`.

## Definición de terminado

- El usuario revisó cada pantalla en su celular y la aprobó (o pidió cambios, que ya se aplicaron).
- Paleta y tokens aprobados; en la fase 05 se trasladan a la configuración de Tailwind.
- Registrado en la Bitácora del README.
