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
| `README.md` | Resumen, comandos y dónde está cada cosa |
| `eslint.config.mjs`, `vitest.config.mts` | ESLint y pruebas |
| `tests/` | Pruebas automáticas (`carpeta-temporal.ts`: los archivos van a una carpeta temporal) |
| `L-ARecurso 8/` | Recursos de marca (arte original) |
| `scripts/verificar-admin.mjs` | Verifica que el panel no pueda quedar expuesto (corre solo antes de `npm run build`; con una dirección prueba el sitio publicado) |
| `src/proxy.ts`, `src/lib/admin-acceso.ts` | Muralla de entrada y regla única de acceso del panel (404 en /admin y /api/admin fuera de la máquina local; nunca en Vercel) |
| `scripts/generar-figuras.mjs` | Genera el catálogo de figuras decorativas del editor (`src/lib/figuras-datos.ts`) |
| `scripts/generar-iconos.mjs` | Genera el catálogo de iconos del editor (`src/lib/iconos-datos.ts`) |
| `Doc/` | Esta carpeta: documentación y sesiones |
| `Doc/protocolo-admin.md` | Por qué el panel nunca está en el sitio publicado, y qué hacer al agregarle algo |
| `Doc/base-de-datos.md`, `Doc/base-de-datos-esquema.sql` | Plan de la base de datos (Supabase) y borrador del esquema SQL (sin ejecutar) |
| `Doc/anuncios-google/` | Imágenes de referencia con los lugares posibles para anuncios de Google (no implementado) |

---

## `content/` — Datos (lo que se edita)
| Ruta | Notas |
|---|---|
| `content/ediciones/NN.json` | Una edición por archivo (el nombre es el id). 01–13 de ejemplo; **14** = N.º 10 «Los Azufres» (55 págs.); **15** = edición demo resumida (24 págs.) |
| `content/ediciones/muestra-bienvenida.json` | Edición de muestra (`"muestra": true`): solo se hojea en /bienvenida; no sale en archivo, buscador ni numeración |
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
| `/temas`, `/temas/[tema]` | `app/temas/` + `lib/temas.ts` | Páginas agrupadas en Historia, Sabor, Gente y Paisajes |
| `/suscribirse`, `/baja` | `app/suscribirse`, `app/baja` | Alta y baja del newsletter |
| `/proyecto` | `app/proyecto/page.tsx` | Presentación del proyecto (para atraer colaboradores y marcas) |
| `/bienvenida` | `app/bienvenida/page.tsx` | Presentación para quien llega por primera vez (el proxy lo manda aquí una vez; cookie `acomdi-bienvenida`): muestra hojeable, cupones, anunciantes, preguntas |
| `/admin` | `app/admin/page.tsx` | Panel: resumen (publicadas, borradores, vistas y clics de 7 días, suscriptores), ediciones en lista o portadas (`ListaEdiciones.tsx`) con estado de color y datos; «+ Nueva edición» y «Edición resumida» arriba (`AccionesPanel.tsx`, `ResumenEdicion.tsx`); continuar donde lo dejaste (`ContinuarEditando.tsx`) y cambios sin subir (`lib/git-estado.ts`). Barra de arriba y menú lateral con submenús para /admin, /admin/clics y /admin/newsletter (`MarcoAdmin.tsx`, en `admin/layout.tsx`) |
| `/admin/[id]` | `app/admin/[id]/page.tsx` | Editor de una edición |
| `/admin/clics`, `/admin/newsletter` | `app/admin/clics`, `app/admin/newsletter` | Estadística de clics y suscriptores/correo |
| `/admin/anunciantes` | `app/admin/anunciantes` (`PanelAnunciantes.tsx`; lógica `lib/anunciantes.ts`) | Anunciantes (privado: `content/anunciantes.json`): páginas, enlaces, vencimiento, vistas/clics y tasa; páginas de publicidad sin anunciante |
| `/admin/anunciantes/[id]/reporte` | `app/admin/anunciantes/[id]/reporte` | Reporte imprimible / PDF para mandar al anunciante (sin el menú del panel) |
| `/api/admin/rapido` | `app/api/admin/rapido/route.ts` | Ediciones y títulos de páginas para el buscador rápido del panel (Ctrl+K, `BuscadorRapido.tsx`) |
| `/admin/calendario` | `app/admin/calendario/page.tsx` | Calendario de publicación: el mes, si cada semana tiene edición y las próximas 8 semanas |
| `/admin/ajustes` | `app/admin/ajustes` (`PanelAjustes.tsx`; lógica `lib/ajustes.ts`) | Variables de entorno en un solo lugar; guarda en `.env.local` con copia previa; las que abren el panel son solo lectura |
| `/admin/medios` | `app/admin/medios` (`PanelMedios.tsx`) | Biblioteca de medios: peso, dónde se usa, «sin uso» (también revisa código, plantillas y «Mis elementos») y quitar |
| `/admin/papelera` | `app/admin/papelera` (`BotonRecuperar.tsx`) | Ediciones y medios borrados, con «Recuperar» |
| `/api/admin/*` | `app/api/admin/...` | Ediciones, medios, plantillas, clics, suscriptores (solo en local) |
| `/api/clic`, `/api/vista`, `/api/suscribir`, `/api/baja` | `app/api/...` | Registro de clics y vistas, y newsletter (públicos) |
| `opengraph-image` | `app/bienvenida/opengraph-image.tsx`, `app/ediciones/[id]/[pagina]/opengraph-image.tsx` (lógica `lib/og.tsx`) | Imagen al compartir el enlace (1200 × 630, JPEG) |
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
| `accesibilidad.ts` | Revisor de accesibilidad (contraste, textos, descripciones, enlaces) |
| `catalogo-iconos.ts`, `figuras-datos.ts` | Iconos + figuras decorativas (un solo catálogo para el elemento «icono») |
| `medios-uso.ts` | Dónde se usa cada archivo de /media |
| `clics.ts`, `vistas.ts`, `suscriptores.ts`, `newsletter.ts` | Clics, vistas, suscriptores y correo de cada edición |
| `animaciones.ts`, `transiciones.ts`, `iconos-datos.ts` | Catálogos del editor |

## `src/components/` — Interfaz
| Archivo | Descripción |
|---|---|
| `Lienzo.tsx` | Dibuja páginas de lienzo (800 × alto); `LienzoResponsivo` + `LienzoApilado` (columna del celular; `movil: ocultar \| solo`) |
| `PageFlow.tsx`, `PageTurner.tsx` | Giro de página y navegación inferior (escritorio; en celular `PageFlow` se apaga) |
| `MuestraHojeable.tsx` | Marco de «Hojéala aquí» en la bienvenida (carga la edición de muestra al pulsar; se adapta a PC y celular) |
| `Revelar.tsx` | Hace que una sección suba y aparezca al entrar en pantalla (respeta «reducir movimiento») |
| `FlujoMovil.tsx` + `lib/flujo-actions.tsx` | Scroll continuo en celular: agrega las páginas siguientes debajo (acción de servidor que dibuja cada página) |
| `plantillas.tsx` | Páginas del lector por plantilla; barra superior del lector |
| `Masthead.tsx`, `Footer.tsx` | Cabecera (buscador largo, botón de tema) y pie |
| `Logo.tsx`, `ThemeToggle.tsx` | Logotipo con versión oscura; botón claro/oscuro |
| `CompartirPagina.tsx` | Compartir la página que se lee (barra del lector) |
| `SeguirLeyendo.tsx`, `RegistrarLectura.tsx` + `lib/lectura.ts` | «Seguir leyendo»: última página, solo en el navegador del lector |
| `EdicionesRelacionadas.tsx` | Otras ediciones al terminar una (por temas en común) |
| `SaltarContenido.tsx` | Enlace «Saltar al contenido» (teclado y lectores de pantalla) |
| `lib/imagen.ts` | Tamaños adaptados de las fotos (`srcset` con `/_next/image`) y foto a precargar |
| `PortadaMini.tsx`, `Ticker.tsx`, `Bloques.tsx`, `Placeholder.tsx` | Portadas pequeñas, cinta y bloques de las plantillas clásicas |
| `CarruselEdiciones.tsx` | Carrusel «cover flow» de las ediciones anteriores en celular (portada central grande, laterales giradas, puntos) |
| `admin/TiraPaginas.tsx` | Tira de miniaturas de las páginas bajo la hoja (estilo Canva) |
| `admin/VistaPreviaLector.tsx` | Vista previa a pantalla completa como la verá el lector (celular, tableta, computadora) |
| `lib/errores-simples.ts` | Traduce errores técnicos a avisos claros (`mensajeSimple`) |
| `lib/plantillas-extra.ts` | 8 plantillas de secciones: carta, entrevista, agenda, receta, directorio, lugar, foto completa, dos columnas |
| `lib/color-en-punto.ts`, `admin/CuentagotasHoja.tsx` | Cuentagotas que solo toma colores de la hoja editable |
| `lib/colores-foto.ts`, `admin/PaletaColores.tsx` | Selector de color estilo Canva y colores principales de cada foto (k-medias en un lienzo invisible) |
| `Doc/analisis-edicion-modelismo.md` | Análisis del editor armando una edición de 10 páginas: errores, tropiezos y carencias |
| `admin/MenuContextual.tsx`, `app/admin/FilaEdicion.tsx` | Menú del clic derecho (elementos, fondo, páginas y ediciones) |
| `lib/ejemplos.ts` | Detecta textos de plantilla sin cambiar y fotos sin archivo (los marca el editor y los cuenta la revisión) |
| `lib/asistente-edicion.ts` | Secciones del asistente opcional de «Nueva edición» (cada una → una plantilla integrada) |
| `admin/RecorridoEditor.tsx`, `admin/AyudaEditor.tsx`, `lib/ayuda-editor.ts` | Recorrido guiado de bienvenida (resalta piezas con `data-tour`) y panel de ayuda con búsqueda y «Muéstrame dónde» |
| `admin/BarraContextual.tsx`, `admin/MenuSuperior.tsx` | Barra sobre la hoja según lo seleccionado y menús de la barra superior del editor (estilo Canva) |
| `admin/BibliotecaMedios.tsx` | Biblioteca de medios (elegir y ordenar fotos y videos) |
| `EnlaceMedido.tsx`, `ContarVistas.tsx`, `FormSuscripcion.tsx`, `AnimacionesLienzo.tsx` | Clics medidos, formulario, animaciones de entrada |
| `admin/Editor.tsx` | Editor de edición (barra, páginas, identificador de página, revisor) |
| `admin/EditorLienzo.tsx`, `InspectorLienzo.tsx` | Editor de hoja y propiedades de elementos (enlace «Lleva a», «En el celular») |
| `admin/Versiones.tsx` | Historial: lista las versiones anteriores del servidor y carga una en el editor |
| `admin/RevisorDiseno.tsx` | Revisor de diseño (datos + medición visual en marcos ocultos) |
| `admin/PlantillasModal.tsx` | Cuadro de plantillas (pestañas: Iniciales, Publicidad, Noticias y cómic, Mis plantillas) |
| `admin/OrdenColumna.tsx`, `VistaCelular.tsx`, `PanelPaginas.tsx`, `BibliotecaLienzo.tsx` | Orden en el celular, vista previa móvil, lista de páginas, biblioteca |
| `admin/EditorTexto.tsx`, `textoEnriquecido.ts`, `Reglas.tsx`, `campos.tsx`, `portapapeles.ts` | Texto con formato (TipTap), reglas, campos, copiar/pegar |
