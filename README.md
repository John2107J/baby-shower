# Baby Shower — Invitación y lista de regalos

Sitio web para un baby shower: cada invitado recibe un link personalizado para ver la invitación, confirmar asistencia y elegir un regalo (llevarlo o aportar dinero).

> Proyecto en construcción. Las reglas, el stack y las decisiones del proyecto están en [`CLAUDE.md`](./CLAUDE.md).

## Stack

Next.js (App Router) + TypeScript · Tailwind CSS · PostgreSQL (Neon) + Prisma · Auth.js · Zod · Vercel Blob · Vitest · Vercel

## Seguridad

Este repositorio es **público**. Nunca se commitean secretos, archivos `.env` ni datos reales de invitados o del evento.

## Requisitos

- Node.js 24 (ver `.nvmrc`)
- npm 11

## Puesta en marcha local

```bash
npm ci
cp .env.example .env.local   # completar valores locales (nunca commitear)
npm run db:migrate           # aplica las migraciones a la base local
npm run dev                  # http://localhost:3000
```

## Scripts

| Script                            | Qué hace                                                                   |
| --------------------------------- | -------------------------------------------------------------------------- |
| `npm run dev`                     | Servidor de desarrollo                                                     |
| `npm run build`                   | Build de producción                                                        |
| `npm run lint`                    | ESLint                                                                     |
| `npm run typecheck`               | `tsc --noEmit`                                                             |
| `npm run format` / `format:check` | Prettier                                                                   |
| `npm test`                        | Tests con Vitest                                                           |
| `npm run check`                   | Lint + typecheck + formato + tests (lo mismo que corre CI, salvo el build) |

## CI

GitHub Actions (`.github/workflows/ci.yml`) corre en cada push a `main` y en cada Pull Request: lint, typecheck, formato, tests unitarios, tests de integración (contra un Postgres descartable creado solo para el job) y build. Tiene permisos de solo lectura y no usa secretos.

## Invitación pública

- `/i/<token>`: invitación personal con confirmación de asistencia (1 a 6 personas), editable hasta las 23:59 del día anterior al evento.
- Un link inválido o una IP bloqueada ven la misma página "no encontrada".
- `/i/<token>/regalos`: lista de regalos pública. Barra por unidad, "Yo lo llevo" (una unidad) y "Aportar dinero" (alias/CBU y aporte declarado, pendiente de confirmación de los padres). Cada invitado ve solo lo que eligió él; nunca nombres ni montos de otros. Cierra junto con la confirmación (23:59 del día anterior).
- Vista previa en WhatsApp: imagen con el moño y el nombre de la bebé (`/i/<token>/opengraph-image`), sin datos de invitados.
- `/` muestra un mensaje neutro para quien entra sin link.

## Panel de los papás

- `/admin/evento`: datos del evento. `/admin/regalos`: lista de regalos con foto, link de la tienda, precio y cantidad.
- `/admin/confirmaciones`: cuántas personas vienen, cuántas invitaciones no vienen y cuántas faltan responder, con la lista (pendientes primero).
- `/admin/invitaciones`: invitaciones de 1 a 5 nombres con su link personal (`/i/<token>`, 256 bits), copiar link, editar nombres, regenerar link y borrar (solo sin actividad). En Vercel los links usan el dominio de producción (`VERCEL_PROJECT_PRODUCTION_URL`).
- Fotos: en producción se guardan en Vercel Blob (Vercel crea `BLOB_STORE_ID` al conectar el Blob Store; los stores viejos usan `BLOB_READ_WRITE_TOKEN`). En desarrollo, sin esas variables, se guardan en `.dev-uploads/`.

- Una cuenta compartida. Se crea o se resetea la contraseña con `npm run admin:set-password -- <email>` (la contraseña se escribe oculta, mínimo 12 caracteres). No hay registro público ni recuperación por email.
- Login en `/admin/login`. Sesión de 8 horas. Bloqueo de 15 minutos tras 5 intentos fallidos (por IP y por email).
