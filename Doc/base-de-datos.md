# Plan de la base de datos (Supabase)

> Estado: **plan** (23-10-2026). Todavía no existe el proyecto de Supabase ni se cambió código. Aquí queda lo decidido, el diseño y el orden de trabajo
> para que, cuando se cree la cuenta, todo esté listo para conectarse. El borrador del esquema SQL está en `Doc/base-de-datos-esquema.sql` (sin ejecutar).

## 1. Decisiones tomadas

| Tema | Decisión |
|---|---|
| Servicio | **Supabase** (Postgres + Storage). Ya se usa en otros proyectos. |
| Qué se guarda | Ediciones y sus versiones · fotos y videos · estadísticas (clics, vistas) y suscriptores · plantillas y «Mis elementos». |
| Panel de administración | **Sigue solo en tu computadora** y escribe directo en la base. El sitio publicado solo lee (y registra clics, vistas y altas por funciones acotadas). `/admin` nunca está en línea (ver el protocolo del panel). |
| Modelo de la edición | **Un documento JSON por edición** (columna `jsonb` con sus páginas), como hoy. No se parte en tablas de páginas y elementos. |
| Cuándo | Aún no se crea el Supabase: primero se **prepara** el proyecto (capa de datos, esquema, migración) para que el cambio sea un interruptor. |

## 2. Qué hay hoy y dónde (inventario)

| Dato | Hoy | Tamaño | Quién escribe |
|---|---|---|---|
| Ediciones | `content/ediciones/NN.json` (16 archivos) | 1,9 MB | panel local |
| Versiones anteriores | `content/respaldos/<id>/*.json` (privado) | — | panel local, al guardar |
| Borradores borrados | `content/papelera/` (privado) | — | panel local |
| Fotos y videos | `public/media/<id>/…` (165 archivos) | 57 MB | panel local (subir) |
| Plantillas de página | `content/plantillas/*.json` + `public/media/_plantillas/` | — | panel local |
| «Mis elementos» | `content/elementos/*.json` | — | panel local |
| Clics | `content/clics.json` (privado) | — | sitio (`/api/clic`) |
| Vistas de página | `content/vistas.json` (privado) | — | sitio (`/api/vista`) |
| Suscriptores | `content/suscriptores.json` (privado) | — | sitio (`/api/suscribir`, `/api/baja`) |

Problema de fondo: en Vercel el disco es de solo lectura, así que clics, vistas y altas **no se guardan** en línea (hoy solo funciona con webhooks), y las fotos
(57 MB) y las ediciones viajan por GitHub.

## 3. Arquitectura

```
                     ┌────────────────────────────┐
   Panel (local) ───►│  Supabase                  │◄─── Sitio publicado (Vercel)
   clave de servicio │  Postgres  +  Storage      │     clave pública (anon): solo lectura de
   solo en .env.local│  (RLS activado en todo)    │     lo publicado + funciones de estadísticas
                     └────────────────────────────┘
```

- **Escritura de contenido** (ediciones, versiones, plantillas, fotos): solo desde el panel local con la **clave de servicio** (`SUPABASE_SERVICE_ROLE_KEY`),
  que vive únicamente en `.env.local`. **Nunca va a Vercel ni al repositorio.** El verificador del panel debe fallar si aparece en un archivo que se sube o se usa en una ruta pública.
- **Lectura pública**: el sitio usa la clave pública (anon). Las políticas de seguridad (RLS) solo dejan ver ediciones **publicadas** (y ya programadas), sin borradas.
  Los borradores, las versiones, los suscriptores y las estadísticas **no** se pueden leer con la clave pública.
- **Estadísticas y suscripción en línea**: el sitio llama a funciones de Postgres (`registrar_clic`, `registrar_vista`, `suscribir`, `dar_de_baja`) que validan por dentro y
  solo hacen lo suyo (sumar un contador, agregar un correo). Así se evita poner una clave con permisos amplios en Vercel.
- **Fotos y videos**: Storage, bucket público `media`. En las ediciones **no cambian las rutas** (`/media/05/estacion.jpg`): `next.config.ts` las reenvía al bucket
  (`rewrites`). Cero cambios en los JSON de las ediciones y en las páginas ya hechas.
- **Cache**: el sitio mantiene `revalidate = 60` y las páginas estáticas de la edición; al publicar o editar, el panel puede avisar al sitio (revalidación por etiqueta con
  un secreto) para ver el cambio al momento. Sin ese aviso, el cambio se ve en 60 s.
- **Modo sin conexión**: el panel y el sitio siguen funcionando con archivos (driver `archivos`) mientras no haya Supabase o cuando se quiera trabajar sin internet.

## 4. Esquema (resumen)

| Tabla | Para qué | Columnas clave |
|---|---|---|
| `ediciones` | Una fila por edición | `id` (texto: «14»), `numero`, `numero_fijo`, `fecha`, `tema`, `publicada`, `publicar_en`, `maestra jsonb`, `paginas jsonb`, `rev int`, `creada`, `actualizada`, `borrada_en` (papelera) |
| `ediciones_versiones` | Respaldos al guardar (reemplaza `content/respaldos/`) | `edicion_id`, `creada`, `datos jsonb` (edición completa), `motivo` |
| `medios` | Un registro por archivo de Storage | `ruta` («/media/05/x.jpg»), `carpeta`, `nombre`, `tipo`, `bytes`, `ancho`, `alto`, `creado` |
| `plantillas` | Plantillas de página | `id`, `nombre`, `descripcion`, `pagina jsonb`, `creada` |
| `elementos_guardados` | «Mis elementos» | `id`, `nombre`, `creada`, `w`, `h`, `elementos jsonb` |
| `clics_dia` | Clics por elemento y día | `edicion_id`, `elemento`, `url`, `dia`, `total`, `pagina`, `etiqueta`, `anuncio` |
| `vistas_dia` | Vistas por página y día | `edicion_id`, `pagina`, `dia`, `total` |
| `suscriptores` | Newsletter | `email` (único, sin distinguir mayúsculas), `token`, `alta`, `baja_en`, `origen` |

Notas de diseño:
- **`rev`** sustituye a la «marca» (fecha del archivo) que hoy detecta cambios hechos desde otra pestaña: `guardarEdicion` hace `UPDATE … WHERE id = $1 AND rev = $esperada` y, si no
  actualiza nada, devuelve el conflicto (409) como ahora.
- **Papelera** = `borrada_en` (borrado lógico); una edición publicada sigue sin poderse borrar desde el panel.
- **Versiones**: se conservan las últimas N por edición (hoy hay un máximo y un espacio mínimo entre respaldos; se mantiene la misma regla).
- **Contadores atómicos** (`INSERT … ON CONFLICT DO UPDATE SET total = total + 1`): resuelven lo que el archivo JSON no puede en un servidor sin estado.
  Los clics y las vistas se guardan **por día**, sin datos del visitante; la regla de «un mismo visitante cuenta una vez cada 10 minutos» pasa al navegador (sessionStorage), porque la memoria del servidor no sirve en Vercel.
- **Validación**: sigue en la aplicación (`validarEdicion`); la base guarda lo ya validado. En la base solo hay comprobaciones sencillas (tipos, `jsonb_typeof(paginas) = 'array'`).
- **Ids de edición** siguen siendo texto corto (compatibles con las rutas `/ediciones/14/3`).

## 5. Seguridad

1. **RLS activado en todas las tablas** desde la primera migración (sin políticas = nadie accede con la clave pública).
2. Políticas de lectura pública: `ediciones` (publicada, ya programada y no borrada), `medios` (solo metadatos de lo publicado, opcional).
3. Sin acceso público directo a: `ediciones_versiones`, `plantillas`, `elementos_guardados`, `clics_dia`, `vistas_dia`, `suscriptores`.
4. Funciones `SECURITY DEFINER` con `search_path` fijo para estadísticas y suscripción; validan que la edición esté publicada y que la página/elemento existan.
5. Storage: bucket `media` **público de lectura**, escritura solo con la clave de servicio (local).
6. Claves: `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` (públicas por diseño) pueden ir en Vercel; `SUPABASE_SERVICE_ROLE_KEY` solo en `.env.local`.
7. **El verificador del panel (`scripts/verificar-admin.mjs`) se amplía**: falla si `SUPABASE_SERVICE_ROLE_KEY` aparece en archivos que se suben, en `vercel.json` o en código que no sea del panel/scripts locales.
8. Copias de seguridad: las diarias de Supabase (según plan) **más** un script local `scripts/exportar-datos.mjs` que baja todo a archivos (las ediciones siguen pudiendo vivir como JSON en el repositorio como respaldo en frío).
9. Los correos de suscriptores son datos personales: nunca en el repositorio ni en el CSV público; el aviso de privacidad del sitio debe decir dónde se guardan.

## 6. Capa de datos en el código (lo que se prepara antes de tener Supabase)

Hoy casi todo usa funciones **síncronas** de archivos (`getEdiciones`, `leerCrudo`, `guardarEdicion`, `leerClics`, …). Con una base de datos son **asíncronas**.
Plan: una interfaz única y dos «drivers», elegidos con `DATOS_DRIVER=archivos|supabase` (por omisión `archivos`, así nada cambia hasta que se active).

```
src/lib/datos/
  tipos.ts          interfaz Repositorio (ediciones, versiones, medios, plantillas, elementos, estadisticas, suscriptores)
  archivos.ts       lo que hoy hace content/ y public/media (envuelve el código actual)
  supabase.ts       la misma interfaz sobre Supabase (se escribe cuando exista el proyecto)
  index.ts          elige el driver y lo exporta
```

Funciones a pasar a la interfaz (todas `async`): `ediciones.ts` (`getEdiciones`, `getEdicion`, `getPublicadas`, `getUltima`), `admin.ts` (`listarEdicionesAdmin`, `leerCrudo`, `guardarEdicion`,
`crearEdicion`, `crearResumen`, `borrarBorrador`, `listarRespaldos`, `leerRespaldo`, `marcaEdicion` → `rev`, medios), `clics.ts`, `vistas.ts`, `suscriptores.ts`, `plantillas.ts`, `elementos-guardados.ts`.
Páginas que las usan: `app/page.tsx`, `app/ediciones/**`, `app/proyecto`, `app/buscar`, `app/newsletter`, y el panel (`app/admin/**` y `app/api/**`). Los componentes de cliente no cambian (reciben datos ya cargados).

Puntos delicados:
- `generateStaticParams` y el sitio necesitan la base **al compilar** en Vercel (hay que poner las claves públicas allí).
- El buscador (`lib/busqueda.ts`) hoy recorre todas las ediciones en memoria: sigue igual (carga las publicadas) o pasa a una búsqueda de texto de Postgres más adelante.
- Las funciones de ayuda que hoy leen ediciones «de pasada» (índice, resumen, numeración) se revisan una por una.

## 7. Migración de datos (script `scripts/migrar-a-supabase.mjs`)

Idempotente (se puede repetir sin duplicar) y con modo de prueba (`--simular`):
1. Ediciones: lee `content/ediciones/*.json`, valida con el mismo `validarEdicion`, hace `upsert`.
2. Versiones: `content/respaldos/**` → `ediciones_versiones` (conservando fecha).
3. Papelera: `content/papelera/*.json` → `ediciones` con `borrada_en`.
4. Medios: sube cada archivo de `public/media/**` a Storage (con tipo de contenido y la misma ruta) y crea su fila en `medios`.
5. Plantillas y «Mis elementos»: sus JSON → tablas.
6. Clics, vistas y suscriptores: si existen los archivos, los convierte a las tablas por día / por correo.
7. Verificación: cuenta filas y archivos en ambos lados, compara una suma de comprobación de cada edición y reporta diferencias.
**Reversible**: el driver `archivos` y los archivos originales siguen intactos hasta que se decida retirarlos.

## 8. Fases y orden de trabajo

**Fase 0 — Preparar (ahora, sin cuenta de Supabase)**
- [x] Decisiones (este documento).
- [ ] Esquema SQL revisado y guardado como migración (`supabase/migrations/0001_inicial.sql`).
- [ ] Interfaz `Repositorio` y driver `archivos` (refactor a `async`, sin cambiar el comportamiento); pruebas.
- [ ] Variables nuevas en `Doc/credenciales.md`; regla del verificador sobre la clave de servicio.
- [ ] Script de migración (en modo simulación contra archivos).
- [ ] Cerrar el protocolo del panel (documento, `CLAUDE.md`, `git rm --cached content/vistas.json`).

**Fase 1 — Crear el proyecto (cuando lo decidas)**: cuenta, proyecto, región, claves, aplicar la migración, crear el bucket `media`.
**Fase 2 — Lectura**: migrar datos; driver `supabase` de lectura; el sitio publicado lee de Supabase; comparar con el sitio actual página por página.
**Fase 3 — Escritura del panel**: guardar, versiones, publicar, plantillas y «Mis elementos» en Supabase; conflicto por `rev`.
**Fase 4 — Estadísticas y newsletter en línea**: funciones de Postgres; clics, vistas y altas funcionando en Vercel; panel de estadísticas leyendo de la base.
**Fase 5 — Fotos y videos**: Storage + reenvío `/media`; subida desde el panel; quitar los 57 MB del repositorio.
**Fase 6 — Retirar archivos**: dejar `content/` y `public/media` solo como respaldo exportado; documentar restauración.

## 9. Riesgos y preguntas abiertas

- **Plan gratuito de Supabase**: el proyecto se **pausa tras ~1 semana sin actividad** y tiene límites (base ≈ 500 MB, Storage ≈ 1 GB, transferencia ≈ 5 GB al mes). 57 MB de fotos y 2 MB de ediciones caben, pero una revista pública
  no debería pausarse: probablemente convenga el plan de pago (o una visita programada que lo mantenga despierto, que no es una solución seria). **Decidir cuando se cree la cuenta.**
- **Región** del proyecto (más cercana a los lectores: Norteamérica) y **nombre** del proyecto.
- **Transferencia de fotos**: servirlas desde Supabase gasta transferencia; alternativa: dejar las fotos en Vercel/GitHub y solo mover datos (decidido lo contrario: mover todo, pero se puede revisar).
- **Latencia en el panel**: guardar pasa a ser una llamada de red (≈100–300 ms); el autoguardado cada 3 s ya lo tolera.
- **Trabajo sin internet**: se resuelve con el driver `archivos` (mantener el código funcionando con ambos).
- **Versiones**: cada una es la edición completa (~100–400 KB); con un máximo de ~20 por edición son pocos MB. Si crece, comprimir o guardar solo diferencias.
- **Más de un editor a la vez**: hoy basta el aviso de «otra pestaña»; con base de datos se puede añadir bloqueo por edición, pero no hace falta aún.
- **¿Se quiere que las ediciones sigan en el repositorio (JSON) como respaldo en frío?** Recomendado: sí, exportadas con `scripts/exportar-datos.mjs`, no editadas a mano.
