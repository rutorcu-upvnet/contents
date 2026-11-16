# Quartz v4

## Añadir asignaturas

El contenido del sitio está en `content/`. La portada `content/index.md` enlaza
al índice de cada asignatura. Por ejemplo:

```text
content/
  index.md
  firmware-embedded-systems/
    index.md
    chapter-1/
      index.md
      chapter-1-step-1.md
    img/
```

Para añadir una asignatura, crea una carpeta con su `index.md`, organiza los
temas en subcarpetas y añade un enlace desde la portada. El explorador refleja
automáticamente estas carpetas. Los enlaces Markdown y las imágenes deben usar
rutas relativas al archivo que los contiene, por ejemplo `../img/figura.png` o
`../chapter-2/index.md`. Las páginas con navegación por pasos cargan su CSS
desde `quartz/static`; la ruta debe tener en cuenta la profundidad de la página.
El script de navegación se carga automáticamente en todas las páginas.

Para probar el sitio, instala las dependencias con `npm ci` y ejecuta
`npx quartz build --serve`. Las páginas antiguas de los capítulos tienen
redirecciones mediante `aliases` en su frontmatter.

> “[One] who works with the door open gets all kinds of interruptions, but [they] also occasionally gets clues as to what the world is and what might be important.” — Richard Hamming

Quartz is a set of tools that helps you publish your [digital garden](https://jzhao.xyz/posts/networked-thought) and notes as a website for free.

🔗 Read the documentation and get started: https://quartz.jzhao.xyz/

[Join the Discord Community](https://discord.gg/cRFFHYye7t)

## Sponsors

<p align="center">
  <a href="https://github.com/sponsors/jackyzha0">
    <img src="https://cdn.jsdelivr.net/gh/jackyzha0/jackyzha0/sponsorkit/sponsors.svg" />
  </a>
</p>
