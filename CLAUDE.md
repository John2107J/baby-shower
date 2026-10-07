# CLAUDE.md — Proyecto: Invitación y Lista de Regalos de Baby Shower

> Este archivo es la fuente de verdad del proyecto. Leelo completo antes de escribir una sola línea de código y volvé a consultarlo ante cualquier duda.

---

## 0. REGLAS DE TRABAJO (LAS MÁS IMPORTANTES)

1. **Este es un proyecto real, en producción, con personas reales.** Se trata con la rigurosidad de un sistema profesional: arquitectura, seguridad, pruebas y documentación.
2. **NO decidas nada por tu cuenta.** Si hay cualquier duda, ambigüedad o más de una forma razonable de hacer algo (tecnología, librería, estructura, textos, diseño, reglas de negocio), **detenete y preguntale al dueño del proyecto** antes de continuar. No asumas, no improvises, no elijas "lo más común".
3. **No dejes nada al azar.** Todo comportamiento debe estar definido, validado y probado. Si un caso borde no está especificado en este archivo, preguntalo.
4. **Antes de implementar algo no trivial**, presentá un plan corto (qué archivos tocás, qué impacto tiene, qué riesgos hay) y esperá confirmación.
5. **Cambios pequeños y revisables.** Un cambio = un propósito. Nada de refactors escondidos dentro de una feature.
6. **Nunca instales una dependencia nueva sin preguntar.** Explicá para qué, alternativas, y peso/mantenimiento.
7. **Nunca ejecutes acciones destructivas o irreversibles sin confirmación** (borrar datos, `prisma migrate reset`, `git push --force`, borrar ramas, modificar la base de producción).
8. **Si algo falla, no lo ocultes ni lo "parches" en silencio.** Reportá el error, la causa raíz y las opciones.
9. **Idioma:** conversá con el dueño en **español rioplatense/neutro**. El código (nombres de variables, funciones, commits) va en **inglés**. Los textos visibles para el usuario final van en **español (Argentina)**.

---

## 1. DESCRIPCIÓN DEL PROYECTO

Sitio web público para un baby shower. Cada familia o persona invitada recibe **un único link personalizado** (por WhatsApp o Gmail). Desde ese link puede:

- Ver la **invitación formal** con su(s) nombre(s).
- **Confirmar asistencia**.
- Entrar a la **lista de regalos** elegida por los padres para: llevar un regalo, o aportar dinero (parcial o total) por transferencia a un alias/CBU.

Los **padres** tienen un panel privado donde cargan regalos, ven confirmaciones, aportes y nombres, y generan los links para enviar.

El sitio debe estar **online 24/7** para que cualquiera con su link pueda entrar en cualquier momento.

---

## 2. STACK TECNOLÓGICO (CONFIRMADO)

| Capa | Tecnología |
|---|---|
| Framework fullstack | **Next.js (App Router) + TypeScript (strict)** |
| Estilos | **Tailwind CSS** |
| Base de datos | **PostgreSQL en Neon** |
| Almacenamiento de imágenes | **Vercel Blob** (fotos de regalos subidas desde el panel) |
| Tests | **Vitest** |
| CI | **GitHub Actions** (lint + typecheck + tests en cada push/PR) |
| ORM | **Prisma** |
| Autenticación (panel padres) | **Auth.js** con credenciales |
| Validación | **Zod** (en todo input externo) |
| Hosting | **Vercel** conectado al repo de GitHub |
| Repositorio | **GitHub público** |
| Pagos | **Sin pasarela.** Solo mostrar alias/CBU. El invitado declara su aporte. |

> Cualquier tecnología fuera de esta tabla requiere aprobación previa.

---

## 3. REGLAS DE NEGOCIO

### 3.1 Evento
Datos únicos del evento, editables solo desde el panel de padres:
- Nombre de la bebé (**protagonista visual de la invitación**).
- Fecha (día, mes) y hora.
- Dirección escrita: **calle y número** (además de localidad/ciudad).
- Punto GPS / link de Google Maps (opcional), con botón "Cómo llegar".
- Alias y/o CBU para aportes, y nombre del titular.

### 3.2 Invitación
- Cada invitación tiene **de 1 a 5 nombres** (una familia = una sola invitación).
- Cada invitación tiene un **token único, aleatorio e imposible de adivinar** (mínimo 128 bits de entropía, generado con un CSPRNG). URL: `/i/[token]`.
- La invitación muestra: nombre(s) de los invitados, nombre de la bebé, fecha, hora, dirección, botón de mapa, bloque de confirmación de asistencia y un **botón/link destacado a la lista de regalos**.
- Debe verse bien primero en **celular** (mobile-first).
- Debe incluir **Open Graph / Twitter Cards** para que el link se previsualice bien en WhatsApp. La preview **no debe revelar** datos privados de los invitados.

### 3.3 Confirmación de asistencia (RSVP)
- El invitado indica: asistirá / no asistirá, y **cuántas personas** asistirán (máximo = cantidad de nombres de su invitación, salvo que el dueño decida otra cosa — *preguntar*).
- Puede modificar su respuesta (*pendiente confirmar hasta cuándo*).
- Los padres ven todas las respuestas en el panel.

### 3.4 Lista de regalos
Cada regalo cargado por los padres tiene:
- Nombre.
- Foto (subida por los padres desde el panel; se guarda en Vercel Blob).
- **Link al producto** que quieren los padres (los invitados lo ven y los redirige a ese producto; abrir en pestaña nueva con `rel="noopener noreferrer"`).
- **Foto y link son dos campos separados**, pero en la UI (panel y vista pública) se muestran **juntos/cercanos** para que se vea la relación entre la imagen y la tienda.
- Precio de referencia.
- **Cantidad ("¿Cuántos?")**: cuántas unidades de ese producto aceptan. Ejemplos: *Cochecito → hasta 2*, *Cuna → solo 1*.

El invitado puede, por cada regalo:
- **"Yo lo llevo"**: reserva una unidad. Si la cantidad total ya está cubierta, ya no se puede elegir.
- **"Aportar dinero"**: parcial o total. El monto máximo está **topeado a lo que falta** para completar el regalo. El invitado ve el alias/CBU, transfiere por fuera del sitio y **registra "aporto $X"**.

### 3.5 PRIVACIDAD (REGLA CRÍTICA)

| Dato | Padres (panel) | Invitados (público) |
|---|---|---|
| Nombres de quién aportó / reservó | ✅ Ver | ❌ **Nunca** |
| Montos individuales de aportes | ✅ Ver | ❌ **Nunca** |
| Barra de progreso por regalo | ✅ | ✅ |
| Cuánto **falta** para completar un regalo | ✅ | ✅ |
| Unidades disponibles / "completo" | ✅ | ✅ |
| Respuestas de RSVP de otros invitados | ✅ | ❌ |

- El invitado **solo** ve el progreso agregado y lo que falta. Nunca el detalle de quién ni cuánto aportó cada persona.
- Esta separación se implementa **en el servidor** (DTOs/serializadores distintos para público y admin). **Jamás** se envía al navegador del invitado un dato que luego se "oculta" con CSS o JS.
- Un invitado solo puede ver y modificar **sus propios** registros (los asociados a su token).
- Agregar tests automatizados que verifiquen que las respuestas públicas **no contienen** nombres ni montos individuales.

### 3.6 Concurrencia
- Reservas y aportes se ejecutan en **transacciones de base de datos** con control de concurrencia (bloqueo de fila o equivalente) para que dos personas no tomen la última unidad ni excedan el tope al mismo tiempo.
- Todas las validaciones de tope/stock se hacen **en el servidor**, nunca confiando en el cliente.
- Las operaciones deben ser **idempotentes** frente a doble clic o reintentos.

### 3.7 Aportes declarados
- El sistema **no verifica** transferencias reales (no hay pasarela). El aporte es una declaración del invitado.
- Los padres pueden **confirmar, editar o anular** un aporte desde el panel (*pendiente definir si el progreso cuenta aportes "sin confirmar"*).

---

## 4. MODELO DE DATOS (BORRADOR — validar con el dueño antes de migrar)

- **Event**: id, babyName, startsAt (con zona horaria `America/Argentina/Buenos_Aires`), streetAddress, city, mapsUrl, latitude?, longitude?, paymentAlias, paymentCbu, paymentHolderName.
- **Invitation**: id, token (único, indexado), guestNames (1–5), rsvpStatus, rsvpAttendeesCount, rsvpUpdatedAt, createdAt, sentVia?.
- **Gift**: id, title, imageUrl, productUrl, referencePrice, quantity (≥1), status/derivado, sortOrder, createdAt.
- **GiftClaim** (reserva "Yo lo llevo"): id, giftId, invitationId, units, createdAt.
- **Contribution** (aporte de dinero): id, giftId, invitationId, amount, status (declarado/confirmado/anulado), createdAt.
- **AdminUser**: id, email, passwordHash, createdAt.

> Las reglas exactas de cómo se combinan unidades reservadas con aportes de dinero para calcular "lo que falta" están en **Decisiones pendientes (sección 9)**. No implementes ese cálculo hasta que el dueño responda.

---

## 5. ARQUITECTURA Y CALIDAD DE CÓDIGO

### 5.1 Modularización
Estructura por **dominio/feature**, con separación clara de capas:

```
src/
  app/                  # Rutas Next.js (solo composición, sin lógica de negocio)
    (public)/i/[token]/ # Invitación y regalos
    (admin)/admin/      # Panel de padres (protegido)
    api/                # Route handlers delgados
  modules/
    event/
    invitation/
    gift/
    contribution/
    rsvp/
    auth/
      (cada módulo: domain/, services/, repositories/, schemas/, dto/, tests/)
  lib/                  # Utilidades transversales (db, logger, errores, config)
  components/           # UI reutilizable
prisma/
  schema.prisma
  migrations/
docs/
```

Reglas:
- **Rutas y componentes no contienen lógica de negocio.** La lógica vive en `services`; el acceso a datos en `repositories`.
- Los módulos **no se importan "cruzado" de forma caótica**; dependencias explícitas y en una sola dirección.
- Funciones pequeñas, con una sola responsabilidad. Sin código duplicado. Sin "números mágicos" (usar constantes con nombre).
- TypeScript `strict: true`. **Prohibido `any`** salvo justificación escrita y aprobada.
- Manejo de errores explícito y consistente (errores tipados de dominio, mensajes claros al usuario, detalle técnico solo en logs).
- Nada de `console.log` sueltos: usar un logger central que **nunca registre datos sensibles**.

### 5.2 Convenciones
- ESLint + Prettier + `tsc --noEmit` deben pasar siempre.
- Nombres en inglés, descriptivos. Comentarios solo para explicar el *por qué*.
- Dinero: guardar en **centavos como entero** (nunca `float`) y formatear como ARS en la capa de presentación.
- Fechas: guardar en UTC, mostrar en `America/Argentina/Buenos_Aires`.

---

## 6. SEGURIDAD (NO NEGOCIABLE)

**Secretos y repositorio público**
- El repo es **público**: **jamás** commitear secretos, `.env`, claves, URLs de base de datos, tokens ni datos reales de invitados.
- `.env*` en `.gitignore` desde el primer commit. Mantener un `.env.example` con nombres de variables y **sin valores reales**.
- Las variables secretas viven solo en Vercel y en el entorno local. Si algo sensible se filtra a Git, avisar de inmediato (hay que rotar la credencial; borrar el commit no alcanza).
- Antes de cada commit, verificar que no haya datos personales ni secretos en el diff.

**Aplicación**
- Validar con **Zod** todo input (body, query, params) en el servidor. Rechazar lo desconocido.
- Acceso a la base **solo desde el servidor** vía Prisma (consultas parametrizadas). Ninguna credencial de BD expuesta al cliente.
- Si se usa Supabase: no exponer la clave `anon` ni habilitar acceso directo desde el navegador; evaluar RLS como defensa extra (*preguntar*).
- **Autorización por recurso**: cada endpoint verifica que el token/sesión tenga derecho sobre ese recurso (prevención de IDOR).
- Panel de padres: contraseñas con hash fuerte (argon2id o bcrypt con costo adecuado — *preguntar cuál*), cookies `HttpOnly`, `Secure`, `SameSite`, protección CSRF, y **límite de intentos de login**.
- **Rate limiting** en: login, confirmación de asistencia, reservas y aportes, y búsqueda por token (anti fuerza bruta).
- Tokens de invitación: comparación segura, sin enumeración (respuesta idéntica para token inexistente), y `noindex` para que los buscadores no los indexen (`robots`, `X-Robots-Tag`).
- Cabeceras de seguridad: CSP, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, HSTS.
- Subida de imágenes: validar tipo real, tamaño máximo, y renombrar archivos. Nunca confiar en el nombre o MIME enviado por el cliente.
- Escapar/sanear todo texto ingresado por usuarios (React escapa por defecto; **prohibido `dangerouslySetInnerHTML`** sin aprobación).
- Los links de productos cargados por los padres: validar que sean `http(s)`, y abrir con `rel="noopener noreferrer"`.
- Logs y errores **sin datos personales ni stack traces** hacia el usuario final.
- Auditar dependencias (`npm audit`) y mantenerlas actualizadas, previa consulta.

**Datos personales**
- Mínima recolección: solo lo necesario (nombres, asistencia, aportes).
- El panel de admin es la única vía para ver nombres y montos.

---

## 7. FLUJO DE GIT Y GITHUB

- El repositorio ya existe en GitHub (público). **Preguntar la URL y la rama principal** antes del primer commit.
- Ramas: `main` (siempre desplegable) + ramas de trabajo `feat/…`, `fix/…`, `chore/…`. **Nunca commitear directo a `main`** salvo que el dueño lo indique.
- **Conventional Commits** en inglés: `feat:`, `fix:`, `refactor:`, `test:`, `docs:`, `chore:`.
- Todo cambio entra por **Pull Request** con descripción de qué cambia, por qué, y cómo se probó.
- **No hacer `push` ni abrir PR sin que el dueño lo apruebe.** Mostrar el diff y esperar el visto bueno.
- Nunca usar `--force`, ni reescribir historia compartida, ni `--no-verify`.
- Cada migración de base de datos se commitea con su PR y se explica su impacto.

---

## 8. PRUEBAS Y DEFINICIÓN DE "TERMINADO"

Una tarea está terminada **solo si**:
1. Cumple las reglas de este archivo (negocio, privacidad, seguridad).
2. Tiene **tests** (unitarios para servicios; integración para reservas/aportes con concurrencia; tests de privacidad en respuestas públicas).
3. `lint`, `typecheck` y tests pasan.
4. Se probó el flujo completo en **vista móvil**.
5. Se actualizó la documentación (`README`, `docs/`) si cambió algo relevante.
6. No hay secretos ni datos personales en el diff.
7. El dueño revisó y aprobó.

Casos que **siempre** deben probarse: dos reservas simultáneas de la última unidad; aporte mayor a lo que falta; aporte en cero o negativo; doble clic; token inválido; invitación con 1 y con 5 nombres; regalo con cantidad 1 y cantidad >1; que el público no reciba nombres/montos.

---

## 9. DECISIONES PENDIENTES (PREGUNTARLAS ANTES DE IMPLEMENTAR)

Estas decisiones **no están tomadas**. Presentalas al dueño de a una o en grupo, con opciones y tu recomendación, y esperá respuesta:

1. ~~**Base de datos:** ¿Supabase o Neon?~~ → **Resuelto: Neon** (ver sección 12).
2. **Cálculo del progreso:** si un regalo tiene cantidad 2 y precio unitario $X, ¿el total a cubrir es 2×X? ¿Cómo se combinan "yo lo llevo" (unidades) con "aporto dinero" (monto) en una misma barra y en el "falta"?
3. **Aportes sin confirmar:** ¿cuentan para la barra de progreso apenas el invitado los declara, o solo cuando los padres los confirman?
4. **Si ya se completó un regalo:** ¿se oculta, queda visible como "completo", o se muestra al final?
5. **RSVP:** ¿máximo de asistentes = cantidad de nombres de la invitación? ¿Hasta qué fecha se puede modificar la respuesta?
6. **Panel de padres:** ¿cuántas cuentas (una o dos, una por cada padre)? ¿Cómo se crean y se recuperan las contraseñas?
7. ~~**Imágenes de regalos:**~~ → **Resuelto: se suben al sistema y se guardan en Vercel Blob** (ver sección 12).
8. **Dominio:** ¿se usará dominio propio o el de Vercel?
9. **Diseño:** estilo visual, paleta de colores, tipografías, y foto/ilustración para la invitación. *No inventar: pedir referencias.*
10. **Textos de la invitación** (saludo, fórmulas, mensajes de WhatsApp y Gmail): los redacta el dueño o se proponen para su aprobación.
11. **Hash de contraseñas** (argon2id vs bcrypt) y estrategia de **rate limiting** (¿servicio externo o en base de datos?).
12. **Datos reales** del evento: nombre de la bebé, fecha, hora, dirección, alias/CBU. Pedirlos; no usar datos inventados fuera de entornos de prueba claramente marcados.

---

## 10. PLAN DE TRABAJO (FASES)

Avanzar **una fase por vez** y pedir aprobación antes de pasar a la siguiente:

1. **Fundación:** inicializar Next.js + TS strict + Tailwind + ESLint/Prettier, estructura modular, `.gitignore`, `.env.example`, CI básico (lint + typecheck + tests), conexión a Vercel y a la base de datos.
2. **Datos y autenticación:** esquema Prisma, migraciones, login del panel de padres con medidas de seguridad.
3. **Panel de padres:** datos del evento, alta/edición de regalos (nombre, foto, link, precio, cantidad), alta de invitaciones (1–5 nombres) y generación de links.
4. **Invitación pública:** página `/i/[token]`, mapa, RSVP, Open Graph.
5. **Lista de regalos pública:** reservas, aportes, barra de progreso y "falta", con transacciones y privacidad estricta.
6. **Compartir:** botones de WhatsApp (`wa.me`) y Gmail con mensaje y link armados.
7. **Endurecimiento:** revisión de seguridad, pruebas de carga ligeras, pruebas en celulares reales, documentación final.

---

## 11. CÓMO DEBÉS COMPORTARTE AL EMPEZAR

1. Leé este archivo completo.
2. Resumile al dueño lo que entendiste del proyecto, en pocas líneas, para confirmar que está alineado.
3. Preguntá las **decisiones pendientes** de la sección 9 que bloqueen la Fase 1.
4. Proponé el plan de la Fase 1 y **esperá aprobación** antes de crear archivos o instalar nada.

> Recordatorio final: ante la duda, **preguntá**. Nunca decidas por el dueño.

---

## 12. DECISIONES TOMADAS (REGISTRO)

| # | Decisión | Detalle |
|---|---|---|
| 1 | Base de datos | **Neon** (PostgreSQL). Integración nativa con Vercel y ramas de base para previews. |
| 2 | Imágenes de regalos | **Vercel Blob** vía `@vercel/blob` (se instala en la Fase 3). Validar tipo real, tamaño máximo y renombrar archivos. No se usan URLs de imágenes externas (hotlinking). |
| 3 | Foto vs. link del producto | Dos campos separados, mostrados juntos en la UI. |
| 4 | Tests | **Vitest**. |
| 5 | CI | **GitHub Actions**: lint + typecheck + tests. Sin secretos en logs; permisos mínimos (`contents: read`). No despliega (eso lo hace Vercel). |
| 6 | Flujo Git | `main` creada con un commit inicial (autorizado por el dueño). El resto entra por rama de trabajo + Pull Request. Claude opera GitHub informando cada acción (crear rama, commit, push, PR). |
| 7 | Node | Versión a confirmar por el dueño (`node -v` en su máquina); se fija en `.nvmrc` y `engines`. |
| 8 | Datos del evento | El dueño entregó los **datos reales** del evento. **No se commitean** (repo público): se cargan en la base desde el panel o con un seed local ignorado por Git. |

### 12.1 Guía de diseño (referencia entregada por los padres)

- Temática: **moños**. Paleta elegida por los padres; requisito explícito: **que no tenga "aspecto de IA"**.
- La imagen de referencia **no se sube al repo** (contiene datos reales).
- Estética: fondo papel crema con textura sutil; nombre de la bebé en caligrafía rosa viejo (protagonista); textos en sans redondeada marrón grisáceo cálido; mayúsculas espaciadas para etiquetas; líneas finas rosadas, pin de ubicación y corazones pequeños como separadores; ilustraciones en acuarela (moño rosa central, flores silvestres con hojas verde salvia).
- Prohibido: degradados, emojis, tarjetas con sombra, glassmorphism, bordes redondeados por todos lados, tipografías genéricas.
- Pendiente: origen y licencia de las ilustraciones, tipografías exactas, ubicación de los nombres de invitados, ciudad de la dirección y revisión de textos ("sabes" vs. "sabés").
