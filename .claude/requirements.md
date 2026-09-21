# Habit Tracker PWA — Contexto del Proyecto

## Objetivo
Crear una app web (PWA) para el seguimiento de hábitos personales, instalable en el celular como si fuera una app nativa y accesible también desde computadora. El propósito es ayudarme a ser más organizado y a mantener mis hábitos en el tiempo mediante gamificación (rachas y puntos).

## Contexto de uso
- Proyecto de uso personal, un solo usuario (yo), pero desplegado públicamente, por lo que necesita autenticación real para que nadie más pueda acceder.
- Prioridad en la experiencia de celular (mobile-first): el problema actual es que las plantillas tipo Google Sheets son incómodas de usar en el teléfono.
- Tengo un celular Android (no iPhone).

## Referencia visual (inspiración de diseño, no de estructura de datos)
Revisé capturas de un habit tracker hecho en Google Sheets que sirven de inspiración visual:
- Encabezado con mes, número de hábitos, hábitos completados y barra de progreso general en %.
- Grilla semanal con checkboxes: una columna por día, agrupada por semanas con un color distinto por semana (morado, azul, turquesa, rosa, verde).
- Fila de porcentaje de cumplimiento por día debajo de la grilla.
- Gráfica de línea de "estado mental" (ánimo/motivación) a lo largo del tiempo.
- Sección de análisis con gráfica de barras horizontales mostrando el % de cumplimiento por hábito individual.
- Versión de task tracker: gráficos de dona (donut) por día de la semana mostrando % de tareas completadas, con lista de tareas debajo de cada día.
- Barras de "mindset check-in" (energía, foco, motivación) por día.

La idea es lograr un nivel visual similar (colorido, con varias gráficas reactivas), pero pensado mobile-first desde el inicio, no encajonado en la estructura de una hoja de cálculo.

## Requerimientos funcionales
- Diseño responsivo, utilizable en computadora y celular.
- Instalable como PWA (manifest + service worker).
- Visualmente atractivo, minimalista pero no demasiado simple, con variedad de colores.
- Gráficas reactivas que respondan a la interacción del usuario (no estáticas).
- Desplegado y accesible desde cualquier dispositivo.
- Simple de implementar y mantener (proyecto personal, sin equipo detrás).
- Autenticación por correo (registro de usuario) — aunque solo yo lo voy a usar, el login es por privacidad, no para soportar multiusuario real.
- Agregar y editar hábitos.
- Marcar hábitos cumplidos por día.
- Sistema de rachas estilo Duolingo (detalle abajo).
- Gráficas y estadísticas semanales, mensuales y anuales.
- Task tracker de tareas — fuera del alcance del MVP, pero dejar la base preparada para agregarlo después, junto con otras funciones futuras de crecimiento y mejora personal.
- Monitor de progreso diario, semanal, mensual y anual.
- Exportar datos en CSV o JSON como respaldo.
- Notificaciones push para recordatorios (evitar perder la racha y cumplir metas). Soy olvidadizo, así que esto es importante, no solo un extra.

## Zona horaria y corte de día
- Todo el sistema debe operar en hora de Bolivia (UTC-4), sin importar desde qué dispositivo/zona horaria se acceda.
- El día inicia a las 00:00 y termina a las 23:59 hora boliviana.

## Sistema de rachas (estilo Duolingo)
- Racha diaria.
- Se puede "congelar" la racha con protectores, máximo 2 protectores acumulables a la vez.
- Los protectores se activan automáticamente cuando el sistema detecta que se rompió la racha, siempre que haya al menos uno disponible.
- Los protectores se compran con puntos (no hay microtransacciones con dinero real).

## Sistema de puntos
- Hábitos principales (máximo 3, los más importantes a cumplir): 10 puntos por día cumplido.
- Hábitos secundarios: 5 puntos por día cumplido.
- Bono por día perfecto (100% de hábitos activos cumplidos ese día): +5 puntos.
- Bono por racha de 7 días sin usar protector: +20 puntos.
- Bono por racha de 30 días sin usar protector: +100 puntos.
- Costo de un protector de racha: 150 puntos (aprox. una semana de esfuerzo razonable, no perfecto).
- Los puntos son una sola bolsa compartida entre protectores y recompensas (obliga a decidir entre protegerse o darse un gusto).

## Sistema de recompensas
Los puntos también sirven para "comprar" recompensas personales como refuerzo positivo. Esto es especialmente relevante porque gastar dinero en gustos personales suele generarme culpa, y el sistema ayuda a sentir que el gasto está "ganado".

Niveles sugeridos:
- Pequeña (50-80 pts, cada 2-4 días aprox.): ej. ver anime, jugar videojuego una tarde.
- Mediana (150-250 pts, ~1 semana aprox.): ej. comida que me gusta, delivery.
- Grande (500-700 pts, ~1 mes de constancia aprox.): ej. cine con palomitas (~100 Bs).

Las recompensas deben ser configurables por mí (catálogo propio), no una lista fija. El canje de recompensas es una acción manual (a diferencia del protector, que es automático), para que sea un momento consciente de "me lo gané".

## Stack tecnológico definido
- Firebase como plataforma principal: Firestore (base de datos), Firebase Auth (autenticación por correo), Firebase Hosting (despliegue), Firebase Cloud Messaging (notificaciones push).
- Gráficas: librería tipo Chart.js o Recharts para las visualizaciones reactivas.
- Frontend: a definir/confirmar (se evaluó mantenerlo ligero dado que es un proyecto personal, aunque también domino Angular por mi trabajo).

## Fuera de alcance del MVP (fase futura)
- Task tracker de tareas.
- Otras funciones relacionadas a crecimiento y mejora personal.
- Recordatorios push más avanzados/personalizados (la base debe quedar lista, pero afinar esto es fase 2).