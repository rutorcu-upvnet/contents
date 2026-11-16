# Navegación por pasos

El script `quartz/components/scripts/step-navigation-init.inline.ts` se incluye
en el layout compartido de Quartz. Escucha el evento `nav`, inicializa los
botones de la página y limpia sus manejadores antes de la siguiente navegación
SPA. No es necesario añadir una etiqueta `script` a los archivos Markdown.
Los enlaces a secciones activan el paso que contiene el destino, tanto al
navegar entre páginas como al seleccionar un apartado de la página actual.

Las páginas con pasos deben incluir `quartz/static/step-navigation.css` mediante
una ruta relativa a la página y usar la estructura `step-container`, `step`,
`prevBtn`, `nextBtn`, `currentStep` y `totalSteps`.

Para comprobarlo, inicia el sitio con `npx quartz build --serve`, navega desde
la portada a una página con pasos, usa los botones y repite en otra página sin
recargar el navegador.
