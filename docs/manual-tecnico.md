# Manual técnico

## Puesta en marcha local

1. Node 24 (`.nvmrc`) y PostgreSQL.
2. `cp .env.example .env.local` y completar las variables (ver comentarios en el archivo).
3. `npm ci`, `npm run db:deploy` y `npm run admin:set-password -- <email>` (o `/admin/crear-cuenta` con `ADMIN_SETUP_CODE`).
4. `npm run dev`.

## Producción (Vercel + Neon)

- **Despliegue:** automático en Vercel con cada merge a `main`.
- **Variables en Vercel:** `DATABASE_URL` y `DATABASE_URL_UNPOOLED` (integración de Neon), `AUTH_SECRET`, Blob (`BLOB_STORE_ID` o `BLOB_READ_WRITE_TOKEN`). `ADMIN_SETUP_CODE` solo hace falta si no existe la cuenta del panel.
- **Migraciones:** después de cada merge que traiga una migración, desde tu computadora con `.env.local` apuntando a producción: `git pull` y `npm run db:deploy`. **Nunca** `prisma migrate reset` ni `prisma migrate dev` contra producción.
- **El sitio debe correr en Vercel:** los límites por IP confían en las cabeceras que Vercel completa (`docs/seguridad.md`).

## Comprobaciones

| Comando                        | Qué hace                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `npm run check`                | Lint, tipos, formato y tests unitarios.                                                                                                    |
| `npm run test:integration`     | Tests contra una base **descartable** (`TEST_DATABASE_URL`).                                                                               |
| `npm run test:load`            | 120 invitados a la vez contra la base descartable: verifica que no se pase ningún tope.                                                    |
| `npm run load:http -- <token>` | Tráfico a las páginas de un servidor **local** (`LOAD_BASE_URL`, por defecto `http://localhost:3000`). Se niega a correr contra otro host. |

Resultado de referencia (servidor local de desarrollo, no representa a Vercel): 120 reservas y aportes simultáneos en menos de 1 s sin pasar ningún tope; 600 pedidos de páginas con 50 a la vez, todos con respuesta 200.

## Respaldos de la base

Hacé un respaldo **antes de enviar las invitaciones** y **después del evento**, y guardalo fuera del repositorio (la carpeta `backups/` está ignorada por Git). Contiene datos reales: tratalo como privado.

1. Instalá el cliente de PostgreSQL (`pg_dump`) en una versión igual o mayor a la de la base de Neon.
2. Con la conexión **directa** (`DATABASE_URL_UNPOOLED` de Vercel/Neon):

   ```sh
   mkdir -p backups
   pg_dump "$DATABASE_URL_UNPOOLED" --format=custom --no-owner --file "backups/baby-shower-$(date +%F).dump"
   ```

3. Para restaurar en una base **vacía** (por ejemplo, una rama nueva de Neon), nunca sobre producción sin pensarlo dos veces:

   ```sh
   pg_restore --no-owner --dbname "<url-de-la-base-vacía>" backups/baby-shower-AAAA-MM-DD.dump
   ```

Neon además guarda un historial que permite restaurar la base a un momento anterior (cuánto tiempo hacia atrás depende del plan: revisalo en la consola de Neon). Es útil ante un error reciente, pero no reemplaza al respaldo propio.

Las **fotos de los regalos** están en Vercel Blob, no en la base: si querés conservarlas, descargalas desde el panel de Vercel (Storage → Blob).

## Después del evento

Los pasos son manuales a propósito: nada se borra solo.

1. **Respaldo** de la base (sección anterior).
2. **Resumen para los agradecimientos:** `npm run export:summary` (con `.env.local` apuntando a producción). Crea `exports/resumen-AAAA-MM-DD.csv` con cada invitación, su asistencia, qué regalo lleva y sus aportes. Solo lee la base; la carpeta `exports/` está ignorada por Git.
3. **Borrar los datos de los invitados** (nombres, respuestas, reservas, aportes; los links dejan de funcionar). Revisá antes que el resumen y el respaldo estén bien. Desde una consola SQL conectada a producción (por ejemplo, el editor SQL de Neon):

   ```sql
   BEGIN;
   DELETE FROM "Contribution";
   DELETE FROM "GiftClaim";
   DELETE FROM "Invitation";
   DELETE FROM "RateLimitBucket";
   COMMIT;
   ```

   Opcional, para no dejar datos del evento (dirección, alias/CBU) ni regalos:

   ```sql
   BEGIN;
   DELETE FROM "Gift";
   DELETE FROM "Event";
   COMMIT;
   ```

   y borrar las fotos desde Vercel Blob.

4. Pasar el repositorio a **privado**, como decidió el dueño.

## A futuro: varios eventos

Decisión 67 del `CLAUDE.md`: después de este evento se puede evaluar llevar el sitio a varios baby showers. No está implementado: requiere cambiar el modelo de datos (eventos por cuenta), los permisos, los links y la privacidad entre eventos, y se planifica como un proyecto aparte.
