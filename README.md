# Bitácora de proyectos · Rubén Alexander

Blog personal con archivo de proyectos, documentación en Markdown y un panel privado para crear, editar y eliminar proyectos.

## Tecnologías

- **React 19 y TypeScript**: componentes, formularios y estado de la interfaz.
- **Vinext / Vite**: App Router compatible con Next.js, compilación y ejecución en Cloudflare Workers.
- **Cloudflare D1 (SQLite)**: persistencia de los proyectos y la documentación.
- **Drizzle**: esquema tipado y migraciones SQL.
- **Sites**: publicación del sitio y autenticación con ChatGPT.

Esta versión reemplaza las plantillas HTML y el JavaScript que modificaba el DOM por componentes React. Conserva la apariencia, las rutas existentes y la base de datos del sitio.

## Funcionalidades

- Portada y archivo con búsqueda por nombre, categoría o descripción.
- Documentación por proyecto con índice de secciones.
- Panel `/admin` para crear, editar, guardar borradores y publicar proyectos.
- Vista previa de Markdown: títulos, listas, negrita, código y enlaces.
- Eliminación con confirmación y borrado del contenido del documento.
- Control de versiones para impedir que una pestaña antigua sobrescriba o restaure un proyecto eliminado.
- Descarga de una copia SQL de la base de datos, disponible solo para el propietario.

## Estructura

```text
app/
  page.tsx                  Portada
  [...path]/page.tsx         Archivo y documentación; conserva rutas .html
  admin/page.tsx             Acceso protegido al editor
  api/projects/             Lectura, creación, edición y eliminación
  api/export/               Copia SQL para el propietario
  chatgpt-auth.ts            Integración de autenticación de Sites
components/
  site-shell.tsx            Navegación y pie de página
  project-list.tsx           Archivo y búsqueda
  project-document.tsx      Documento e índice
  project-editor.tsx        Editor React
  markdown.tsx              Renderizado seguro como elementos React
lib/
  projects.ts               Persistencia, validación y autorización
  owner.ts                  Configuración del propietario
  seeds.ts                  Contenido inicial, anterior al panel
  types.ts                  Tipos compartidos
  api.ts                    Cliente HTTP
 db/schema.ts               Esquema Drizzle
 drizzle/                   Migraciones SQL versionadas
 tests/                     Pruebas de renderizado, permisos y SQLite
```

## Preparar el entorno local

Requisitos: Node.js 22.13 o posterior y npm. Python 3 es necesario únicamente para la prueba de SQLite.

```bash
npm ci
cp .dev.vars.example .dev.vars
npm run build
```

El archivo `.dev.vars` configura `OWNER_EMAIL=seedy@sites.test`, que coincide con la identidad simulada del starter en desarrollo local. No se sube a Git. No copies esta identidad a producción.

Aplica las migraciones **solo en tu base local** y en orden:

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_flowery_rocket_raccoon.sql
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0001_shiny_james_howlett.sql
npm run dev
```

Abre la URL indicada por el servidor en `localhost` o `127.0.0.1`. En el entorno portátil, el starter simula el inicio de sesión local; utiliza el enlace normal de inicio de sesión al entrar en `/admin`. El modo administrado de Sites conserva la autenticación proporcionada por la plataforma.

`npm start` ejecuta la compilación mediante Wrangler; no reproduce por sí solo el inicio de sesión local del servidor de desarrollo.

## Base de datos y copias

Las migraciones crean una tabla `projects` con nombre, resumen, categoría, documentación, estado de publicación, revisión y fecha de actualización. El indicador `deleted` permite mantener una marca de eliminación después de vaciar los campos de contenido. Esto impide que reaparezcan las entradas iniciales o que una pestaña antigua las restaure.

Los tres proyectos originales se conservan como contenido inicial en `lib/seeds.ts`. Las filas de D1 prevalecen sobre ese contenido. La base local y la base alojada son independientes.

**Este repositorio contiene el esquema, las migraciones y el contenido inicial; no contiene una copia automática de los datos privados introducidos en el panel.** Para descargar todos los registros actuales, entra en `/admin` y pulsa **Descargar copia de la base de datos (.sql)**. La copia incluye borradores y marcas de eliminación; guárdala de forma privada.

Para restaurar una copia en una base local con las migraciones aplicadas:

```bash
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file /ruta/bitacora-backup.sql
```

La restauración reemplaza los registros con el mismo ID. No borra otros proyectos existentes. No ejecutes esta operación sobre producción sin revisar la copia y el destino.

## Autenticación y publicación

El despliegue actual usa autenticación y control de acceso de Sites. Los endpoints comprueban la identidad del propietario en el servidor; las escrituras requieren además un origen coincidente y JSON. `OWNER_EMAIL` permite configurar el propietario; en producción, si no se configura, se usa la cuenta del autor del sitio.

GitHub almacena el código; no ejecuta Cloudflare D1 ni proporciona la autenticación de Sites. **GitHub Pages no sirve para alojar el panel y la API.** Para alojarlo fuera de Sites hay que provisionar D1, configurar el Worker e integrar autenticación de confianza. No expongas directamente el Worker confiando en cabeceras de identidad que un cliente pueda falsificar.

La configuración `.openai/hosting.json` conserva la identidad del sitio y el binding lógico `DB`. No incluye credenciales. Publicar la versión React en el mismo sitio conserva su base D1; no es necesario migrar los datos existentes.

## Validación

```bash
npm run typecheck
npm test
npm run test:db
npm run build
```

Las pruebas comprueban el renderizado seguro de Markdown, los enlaces, el índice, los permisos, las migraciones, los conflictos entre revisiones y la eliminación de proyectos originales y nuevos. La compilación no sustituye una revisión visual en navegador.
