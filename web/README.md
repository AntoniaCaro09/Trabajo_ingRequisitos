# Panel web – App Mantenimiento Planta

Panel para administradores y supervisores. No hay correo ni contraseña: al abrir la página se elige el rol (Administrador o Supervisor) y "Cambiar de rol" vuelve a esa pantalla.
Sin configurar nada funciona con datos de ejemplo (el menú dice "Datos de ejemplo").

## Abrirlo
Abre la carpeta `web` en VS Code, instala la extensión **Live Server** y haz clic derecho en `index.html` > Open with Live Server.
Necesita internet (fuente Inter, códigos QR y librería de Supabase).

## Conectarlo a la base de datos (Supabase, PostgreSQL)
1. Crear el proyecto en supabase.com y ejecutar en el SQL Editor los scripts de `database/schema` en orden (001 a 025).
2. Completar `js/config.js`: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (solo la llave pública) y `USUARIO_ID` (id de un usuario supervisor o administrador, creador de las OT).
3. Habilitar en Supabase políticas de acceso (Row Level Security) para leer `equipos`, `reportes_anomalias`, `ordenes_trabajo`, `areas` y `usuarios`, y para insertar, modificar y borrar en `equipos` (y para insertar en `ordenes_trabajo`). Si falta una política, la web avisa que no hay permiso. Sin políticas, las listas aparecen vacías.
4. La lista de técnicos sale de los usuarios activos con el rol `TECNICO` (en `usuario_roles` o en `usuario_empresa_roles`). Hay que asignar ese rol a los técnicos y permitir su lectura (y la de `roles`) en las políticas.
5. Nunca subir a GitHub la llave `service_role`.

## Estructura
- `index.html`: estructura de la página
- `css/styles.css`: estilos (paleta Industrial Field Ops)
- `js/config.js`: datos de conexión
- `js/datos.js`: único archivo que habla con la base (consultas y datos de ejemplo)
- `js/app.js`: pantallas
