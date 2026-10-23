# ACOM-Di · Revista de Acámbaro — Índice de archivos

## Raíz del proyecto
| Archivo | Descripción |
|---|---|
| `package.json` | Next.js 16, React 19, Tailwind v4, TipTap (texto con formato en el editor) |
| `next.config.ts` | Configuración de Next.js |
| `postcss.config.mjs` | Plugin de Tailwind v4 |
| `tsconfig.json` | TypeScript |
| `CLAUDE.md` | Instrucciones para el asistente IA (incluye dónde va la documentación) |
| `GUIA-EDICIONES.md` | Guía para quien arma ediciones (panel, lienzo, plantillas, identificadores, revisor, resumen) |
| `PRESENTACION.md` | Texto de presentación del proyecto |
| `README.md` | Resumen y comandos |
| `L-ARecurso 8/` | Recursos de marca (arte original) |
| `scripts/generar-iconos.mjs` | Genera el catálogo de iconos del editor (`src/lib/iconos-datos.ts`) |
| `Doc/` | Esta carpeta: documentación y sesiones |
| `Doc/anuncios-google/` | Imágenes de referencia con los lugares posibles para anuncios de Google (no implementado) |

---

## `content/` — Datos (lo que se edita)
| Ruta | Notas |
|---|---|
| `content/ediciones/NN.json` | Una edición por archivo (el nombre es el id). 01–13 de ejemplo; **14** = N.º 10 «Los Azufres» (55 págs.); **15** = edición demo resumida (24 págs.) |
| `content/plantillas/` | Plantillas de página guardadas por el usuario (se comparten entre ediciones) |
| `content/elementos/` | «Mis elementos»: grupos de elementos guardados por el usuario (se comparten entre ediciones; sus imágenes en `public/media/_plantillas/el-<id>/`) |
| `content/clics.json`, `content/vistas.json` | Conteo de clics en enlaces y de vistas por página (estadísticas) |
| `content/suscriptores.json` | Suscriptores del newsletter |
| `content/papelera/` | Borradores borrados desde el panel (recuperables) |
| `content/respaldos/<id>/` | Versiones anteriores de cada edición (una copia antes de guardar, como mucho cada 3 min; las últimas 40). No se sube al repositorio |

## `public/`
| Ruta | Notas |
|---|---|
| `public/brand/` | Logotipo (`logo.svg` para fondo claro, `logo-claro.svg` para modo oscuro, igual al de AcambaGo), emblema, logos «ACOM-Di informa» y cabecera móvil |
| `public/media/<edición>/` | Fotos, logos y arte de cada edición (`media/14/` ≈ 65 archivos) |
| `public/media/_plantillas/` | Imágenes copiadas de las plantillas guardadas |

---

## `src/app/` — Rutas (App Router)
| Ruta | Archivo | Notas |
|---|---|---|
| `/` | `app/page.tsx` | Inicio: última edición, portada en miniatura |
| `/ediciones` | `app/ediciones/page.tsx` | Lista de ediciones publicadas |
| `/ediciones/[id]` | `app/ediciones/[id]/page.tsx` | Entrada a una edición |
| `/ediciones/[id]/[pagina]` | `app/ediciones/[id]/[pagina]/page.tsx` | Lector: una página de la edición (giro, móvil) |
| `/buscar` | `app/buscar/page.tsx` | Búsqueda en todas las ediciones (excluye anuncios) |
| `/suscribirse`, `/baja` | `app/suscribirse`, `app/baja` | Alta y baja del newsletter |
| `/proyecto` | `app/proyecto/page.tsx` | Presentación del proyecto (para atraer colaboradores y marcas) |
| `/admin` | `app/admin/page.tsx` | Panel: lista de ediciones, nueva edición, **armar edición resumida** (`ResumenEdicion.tsx`) |
| `/admin/[id]` | `app/admin/[id]/page.tsx` | Editor de una edición |
| `/admin/clics`, `/admin/newsletter` | `app/admin/clics`, `app/admin/newsletter` | Estadística de clics y suscriptores/correo |
| `/api/admin/*` | `app/api/admin/...` | Ediciones, medios, plantillas, clics, suscriptores (solo en local) |
| `/api/clic`, `/api/vista`, `/api/suscribir`, `/api/baja` | `app/api/...` | Registro de clics y vistas, y newsletter (públicos) |
| `globals.css` | `app/globals.css` | Variables de color (modo claro/oscuro), `.paleta-clara`, contenedores del lienzo |
| `layout.tsx` | `app/layout.tsx` | Raíz: fuentes, script del tema (claro/oscuro) |

## `src/lib/` — Lógica
| Archivo | Descripción |
|---|---|
| `esquema.ts` | **Tipos y constantes** del modelo (Edición, Página, Elemento, colores, fuentes, movil, `ancla`) |
| `ediciones.ts` | Lectura y **validación** de ediciones; `resolverReferencias` (identificadores `#x` y `{p:x}`, `{n}`) |
| `numeracion.ts` | Número de edición automático (fijo al publicar) |
| `admin.ts` | Lectura/escritura de ediciones desde el panel (`crearEdicion`, `crearResumen`, borrar, guardar) |
| `resumen.ts` | `construirResumen`: arma una edición con páginas elegidas y ajusta índice, portada y enlaces |
| `referencias.ts` | Referencias `{n}` / `{p:ancla}` en textos (lector y editor) |
| `revision.ts` | Revisión de **datos** del revisor de diseño (anuncios seguidos, enlaces/textos de ejemplo, imágenes sin alt) |
| `plantillas.ts` | Plantillas guardadas (copia sus imágenes, quita ids y enlaces a páginas) |
| `plantillas-base.ts` | 6 plantillas iniciales |
| `plantillas-anuncio.ts` | 7 plantillas de publicidad |
| `plantillas-editorial.ts` | 3 **collages de anuncios** + 3 plantillas de noticias y cómic |
| `busqueda.ts` | Índice de búsqueda |
| `clics.ts`, `vistas.ts`, `suscriptores.ts`, `newsletter.ts` | Clics, vistas, suscriptores y correo de cada edición |
| `animaciones.ts`, `transiciones.ts`, `iconos-datos.ts` | Catálogos del editor |

## `src/components/` — Interfaz
| Archivo | Descripción |
|---|---|
| `Lienzo.tsx` | Dibuja páginas de lienzo (800 × alto); `LienzoResponsivo` + `LienzoApilado` (columna del celular; `movil: ocultar \| solo`) |
| `PageFlow.tsx`, `PageTurner.tsx` | Giro de página y navegación inferior (escritorio; en celular `PageFlow` se apaga) |
| `FlujoMovil.tsx` + `lib/flujo-actions.tsx` | Scroll continuo en celular: agrega las páginas siguientes debajo (acción de servidor que dibuja cada página) |
| `plantillas.tsx` | Páginas del lector por plantilla; barra superior del lector |
| `Masthead.tsx`, `Footer.tsx` | Cabecera (buscador largo, botón de tema) y pie |
| `Logo.tsx`, `ThemeToggle.tsx` | Logotipo con versión oscura; botón claro/oscuro |
| `PortadaMini.tsx`, `Ticker.tsx`, `Bloques.tsx`, `Placeholder.tsx` | Portadas pequeñas, cinta y bloques de las plantillas clásicas |
| `CarruselEdiciones.tsx` | Carrusel «cover flow» de las ediciones anteriores en celular (portada central grande, laterales giradas, puntos) |
| `EnlaceMedido.tsx`, `ContarVistas.tsx`, `FormSuscripcion.tsx`, `AnimacionesLienzo.tsx` | Clics medidos, formulario, animaciones de entrada |
| `admin/Editor.tsx` | Editor de edición (barra, páginas, identificador de página, revisor) |
| `admin/EditorLienzo.tsx`, `InspectorLienzo.tsx` | Editor de hoja y propiedades de elementos (enlace «Lleva a», «En el celular») |
| `admin/Versiones.tsx` | Historial: lista las versiones anteriores del servidor y carga una en el editor |
| `admin/RevisorDiseno.tsx` | Revisor de diseño (datos + medición visual en marcos ocultos) |
| `admin/PlantillasModal.tsx` | Cuadro de plantillas (pestañas: Iniciales, Publicidad, Noticias y cómic, Mis plantillas) |
| `admin/OrdenColumna.tsx`, `VistaCelular.tsx`, `PanelPaginas.tsx`, `BibliotecaLienzo.tsx` | Orden en el celular, vista previa móvil, lista de páginas, biblioteca |
| `admin/EditorTexto.tsx`, `textoEnriquecido.ts`, `Reglas.tsx`, `campos.tsx`, `portapapeles.ts` | Texto con formato (TipTap), reglas, campos, copiar/pegar |
