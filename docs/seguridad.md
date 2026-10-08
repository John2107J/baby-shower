# Seguridad

Resumen de las medidas del sitio y del estado de las dependencias. Las reglas completas están en `CLAUDE.md` (secciones 3.5, 3.6 y 6).

## Cabeceras

- **Content-Security-Policy con nonce** (`src/proxy.ts`): cada respuesta lleva un valor aleatorio nuevo (128 bits) y el navegador solo ejecuta scripts que lo tengan. Next.js se lo agrega a sus propios scripts. Un script o un `onerror=` inyectado en el HTML no se ejecuta.
  - Por eso todas las páginas se generan en cada visita (`connection()` en `src/app/layout.tsx`).
  - Los estilos _inline_ siguen permitidos (barras de progreso, animaciones): no pueden ejecutar código.
  - En desarrollo se agrega `'unsafe-eval'`, que necesitan las herramientas de React; en producción no.
- **Fijas en todas las respuestas** (`next.config.ts`): HSTS (2 años), `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, `Permissions-Policy` y `X-Robots-Tag: noindex, nofollow, noarchive`.

## `npm audit`

Estado al cerrar la Fase 7. **Ninguna vulnerabilidad afecta al código que corre en el sitio.**

| Paquete                                | Llega por                          | Se usa en                         | Por qué no afecta                                                                                                                                        | Arreglo                                  |
| -------------------------------------- | ---------------------------------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- |
| `braces` (y `micromatch`, `fast-glob`) | `eslint-config-next`               | Solo lint, en desarrollo y CI     | No se instala en producción ni procesa datos de usuarios.                                                                                                | Cuando `eslint-config-next` actualice.   |
| `mysql2`                               | CLI de `prisma`                    | Migraciones (`prisma migrate`)    | La base es PostgreSQL: el código de MySQL nunca se ejecuta. No está en el paquete que se publica en Vercel (verificado en `.next/server/**/*.nft.json`). | Prisma 7.x corregido o Prisma 8 estable. |
| `deepmerge-ts`                         | `@prisma/config` (CLI de `prisma`) | Leer `prisma.config.ts` al migrar | Solo procesa nuestra propia configuración, nunca datos externos. Tampoco se publica en Vercel.                                                           | Ídem.                                    |

`npm audit fix --force` **no** se debe usar: baja Prisma a la versión 6 y rompe el proyecto.

**Volver a revisar** con `npm audit` y `npm outdated` antes de enviar las invitaciones y antes de cualquier actualización de dependencias (siempre con aprobación del dueño, `CLAUDE.md` §0.6).
