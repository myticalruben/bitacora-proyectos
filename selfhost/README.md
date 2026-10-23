# Alojamiento propio en Ubuntu / Proxmox

Esta carpeta ejecuta la misma interfaz React con un servidor Node.js y SQLite en tu máquina virtual. No requiere D1, una cuenta de Cloudflare ni autenticación de Sites. La versión de Sites del directorio raíz se conserva.

## Requisitos y diseño

- Node.js 24 dentro de la imagen Docker.
- Docker Engine y el complemento Docker Compose en la VM Ubuntu.
- Git para descargar este repositorio.
- El sitio y la API comparten el puerto 3000; SQLite es un archivo en un volumen persistente, sin puerto de red.
- Un único administrador con contraseña scrypt y sesión HttpOnly de 8 horas. No hay registro público.
- Las cabeceras de identidad de Sites no conceden acceso.
- Los documentos se mantienen en SQLite; las actualizaciones del contenedor conservan el volumen.

## 1. Descargar el código

En la VM, como tu usuario normal:

```bash
git clone https://github.com/myticalruben/bitacora-proyectos.git
cd bitacora-proyectos/selfhost
cp .env.example .env
chmod 600 .env
```

Si ya tienes el repositorio, actualízalo en vez de clonarlo de nuevo. No se necesitan paquetes npm en el Ubuntu anfitrión: la compilación se realiza en Docker.

## 2. Construir y elegir una contraseña

```bash
sudo docker compose build
sudo docker compose run --rm --no-deps web node scripts/password.mjs
```

El comando pide una contraseña de 14 caracteres o más sin mostrarla. Copia **solo el hash generado** en `ADMIN_PASSWORD_HASH` dentro de `.env`. No compartas tu contraseña ni subas `.env` a GitHub.

```bash
nano .env
```

Para la primera prueba en tu LAN:

```text
APP_ORIGIN=http://10.0.0.114:3000
ADMIN_PASSWORD_HASH=scrypt:...hash generado...
BIND_ADDRESS=10.0.0.114
PORT=3000
```

`APP_ORIGIN` debe coincidir exactamente con la dirección del navegador, sin barra final. La cookie usa `Secure` automáticamente cuando el origen es HTTPS. HTTP es solo para la primera prueba en la red local de confianza.

## 3. Recuperar los proyectos actuales (opcional, antes del arranque)

Desde el panel del sitio antiguo, descarga **Descargar copia de la base de datos (.sql)**. Copia ese archivo privado desde tu PC a la VM:

```bash
scp /ruta/bitacora-backup.sql ruben@10.0.0.114:~/bitacora-backup.sql
```

En la VM y desde `selfhost/`:

```bash
sudo docker compose run --rm --no-deps -v "$HOME/bitacora-backup.sql:/tmp/backup.sql:ro" web node scripts/import.mjs /tmp/backup.sql
```

Importa únicamente copias SQL propias de confianza: el comando procesa instrucciones SQL. Reemplaza los proyectos con el mismo ID, conserva borradores y marcas de eliminación y no importa sesiones ni contraseñas. Si no importas nada, la nueva base empieza vacía y puedes crear proyectos desde el panel. No se borra la base antigua.

## 4. Arrancar y verificar en tu red

```bash
sudo docker compose up -d
sudo docker compose ps
sudo docker compose logs --tail=50 web
curl http://10.0.0.114:3000/api/health
```

Desde tu computadora:

- Blog: `http://10.0.0.114:3000`
- Entrada privada: `http://10.0.0.114:3000/admin`

El enlace Administrar y los enlaces de edición solo aparecen después de iniciar sesión. Los datos de borradores, la descarga de copias y todas las escrituras requieren una sesión válida. Se limitan los intentos de acceso a 8 cada 15 minutos; el límite es global para proteger también las conexiones detrás de un proxy.

## 5. Actualizar y hacer copias

Para actualizar, desde el repositorio:

```bash
git pull
cd selfhost
sudo docker compose up -d --build
```

Si ya estás en `selfhost`, ejecuta `git pull` y después el último comando. No uses `docker compose down -v`: esa opción elimina el volumen de datos.

Descarga copias SQL desde el panel y guárdalas fuera de esta VM. Las copias contienen proyectos, borradores y marcas de eliminación; no incluyen sesiones ni el hash de la contraseña. Prueba las restauraciones antes de necesitarlas. Las copias de Proxmox son una protección adicional, no sustituyen la copia de los documentos fuera del servidor.

Para restaurar una copia, detén primero la aplicación con `sudo docker compose stop web`, ejecuta el comando de importación anterior y vuelve a arrancar con `sudo docker compose up -d`.

Cambiar `ADMIN_PASSWORD_HASH` y recrear el contenedor invalida las sesiones anteriores.

## 6. Acceso desde internet: siguiente etapa

Todavía no se configura dominio, router ni túnel. No redirijas puertos hacia Proxmox ni hacia la base de datos. Al publicar, colocaremos un proxy HTTPS o un túnel delante de la aplicación, cambiaremos `APP_ORIGIN` al dominio HTTPS y restringiremos `BIND_ADDRESS` a la dirección apropiada. El proxy debe preservar la cabecera Host del dominio público. Las cookies seguras y la comprobación de origen dependen de esa configuración.

## Añadir los proyectos usb-automount y nvim al portafolio

Las fichas de ambos repositorios, con resumen, tecnologías, decisiones, instrucciones y límites documentados, se incluyen en `content/portfolio-projects.json`.

Después de actualizar el repositorio, ejecuta desde `selfhost/`:

```bash
sudo docker compose build
sudo docker compose run --rm --no-deps web node scripts/add-portfolio-projects.mjs
sudo docker compose up -d
```

El comando añade ambos proyectos como publicados en la base SQLite del volumen existente. No requiere contraseña en la línea de comandos. No modifica otros registros y, si encuentra el mismo identificador o título, conserva el proyecto existente. Volver a ejecutarlo no duplica las entradas ni restablece proyectos borrados o editados. Después puedes editar su documentación desde `/admin`.

Las fichas reflejan el código revisado el 23 de octubre de 2026; no se sincronizan automáticamente cuando cambian los repositorios originales. Las comprobaciones de Nix declaradas y las pruebas referidas por los READMEs se distinguen de las pruebas realizadas para esta página.

## Desarrollo y comprobaciones

Fuera de Docker necesitas Node.js 24:

```bash
cd selfhost
npm ci
npm test
npm run build
```

Las pruebas HTTP comprueban acceso anónimo, suplantación de cabeceras de Sites, inicio y cierre de sesión, protección de origen, borradores, cambios concurrentes, exportación, eliminación y persistencia al reabrir SQLite. La compilación no sustituye una revisión visual ni una prueba del contenedor en la VM.
