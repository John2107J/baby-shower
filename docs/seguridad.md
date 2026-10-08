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

## Revisión de seguridad (Fase 7)

Revisión completa del código (permisos, aislamiento entre invitados, privacidad, concurrencia, validaciones, límites, sesión, logs y cabeceras), más una revisión independiente. Sin hallazgos críticos ni graves.

**Corregido:**

- Cambiar la contraseña (`npm run admin:set-password`) **cierra todas las sesiones abiertas** del panel: cada sesión guarda la "versión" de la contraseña y `requireAdmin()` la compara con la base en cada pedido.
- La tabla de límites de intentos se **limpia sola**: aproximadamente 1 de cada 100 intentos borra los registros de más de un día.
- El filtro de la CSP ya no excluye páginas cuyo nombre solo _empieza_ con "api".

**Riesgos aceptados por el dueño:**

- **Metadatos de las fotos de regalos** (por ejemplo, GPS): no se borran. Las fotos se descargan de las tiendas, no se sacan en casa.
- **Montos deducibles:** quien recargue la lista justo antes y después de un aporte ajeno podría deducir el monto (nunca el nombre). Es consecuencia de mostrar "lo que falta" (decisiones 39 y 42).
- **Optimizador de imágenes:** acepta fotos de cualquier cuenta de Vercel Blob (`*.public.blob.vercel-storage.com`). A lo sumo, un tercero gastaría cuota de optimización.
- **IP del visitante:** los límites por IP confían en `x-real-ip`/`x-forwarded-for`, que Vercel completa y no se pueden falsificar allí. **El sitio debe correr en Vercel**; detrás de otro proxy habría que revisarlo.
