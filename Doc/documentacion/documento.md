# ACOM-Di · Revista de Acámbaro — Documentación técnica

## Qué es
Revista digital semanal sobre Acámbaro (Guanajuato). Se lee página por página como una revista (giro de página en escritorio, columna en
el celular). **Una sola persona arma cada edición** desde un panel local con editor de lienzo, sin escribir código. La versión
publicada (Vercel, privada por ahora) sirve como demo para atraer colaboradores y marcas.

## Stack
- **Framework:** Next.js 16 (App Router, Turbopack), React 19, TypeScript.
- **Estilos:** Tailwind CSS v4 con variables CSS (`--paper`, `--ink`, `--terracota`…) y modo oscuro por clase `dark` en `<html>`.
- **Texto con formato en el editor:** TipTap.
- **Datos:** archivos JSON en `content/` (sin base de datos). El panel solo existe en la computadora de quien publica.
- **Deploy:** Vercel desde GitHub (`git push`); el panel de administración no se despliega.
- **Fuentes:** Playfair Display (títulos), Source Serif 4 (texto), Inter (interfaz) vía `next/font`.
- **Paleta (misma que AcambaGo):** `#068562` acento, `#013f4a`, `#49c59f`, fondo `#f1f5f9`, tinta `#1e293b`.

## Comandos
```
npm run dev     # servidor de desarrollo (en el equipo de quien publica se usa localhost:3000)
npm run build   # build de producción (verifica tipos y compilación)
npx tsc --noEmit
```

## Variables de entorno (opcionales)
Ver `credenciales.md`. Nombres usados en el código: `ADMIN_ENABLED`, `ADMIN_ALLOW_REMOTE`, `CLICS_WEBHOOK_URL`,
`SUSCRIPCION_WEBHOOK_URL`, `NEXT_PUBLIC_SITE_URL`.

---

## Modelo de datos (edición)
Archivo `content/ediciones/NN.json`:
```json
{ "fecha": "2026-11-02", "tema": "Los Azufres, Michoacán", "publicada": true, "numeroFijo": true, "paginas": [ … ] }
```
- **Número de edición:** automático (`lib/numeracion.ts`). Se asigna al publicar por primera vez, a continuación de la última
  publicada, y queda fijo aunque se desactive. Los borradores muestran el número previsto.
- **Página de lienzo:** `plantilla: "lienzo"`, hoja de 800 de ancho y `alto` (normal 1100; más alto para cómics), `fondo`, `titulo`,
  `seccion` (`"Publicidad"` marca anuncios: se excluyen de la búsqueda y el editor avisa de anuncios seguidos), `ancla`.
- **Elementos** (`texto`, `imagen`, `video`, `forma`, `icono`): `x, y, w, h, rot, opacidad`, `enlace`, `animacion`, `molde`, `movil`.
  Textos con `contenido` (tramos con negrita/cursiva/color) o `texto` plano; `fondo` + `relleno` dan un bloque de color.
- **Celular:** por página, `movil: "escala"` (toda la hoja reducida; bueno para anuncios) o `"apilar"` (columna de arriba abajo, con
  `ordenMovil`). Por elemento: `movil: "ocultar"` (no aparece en la columna) o `"solo"` (solo aparece en la columna; no se dibuja
  en la hoja de escritorio). Las fotos apaisadas (≥ 1.4) van a todo el ancho; los logos anchos van centrados a ~58 %.
- **Imágenes:** `credito` (autor y licencia; `{creditos}` en un texto junta los de toda la edición) y `enfoque` {x,y} en % (punto que queda a la vista con «cubrir»; `object-position`).
- **Texto sobre la imagen:** `globos[]` en una imagen (`x,y,w,h` en % de la imagen, `texto`, `tam` en % del ancho de la imagen, `forma` globo/pensamiento/recuadro/sonido/tapa, `cola`, `fondo`, `color`, `fuente`, `mayusculas`). Los dibuja `components/Globos.tsx` (unidades `cqw`); en el editor se arrastran y redimensionan desde el lienzo y el panel del inspector.
- **Imágenes decoradas:** `filtro` (FILTROS_IMAGEN), `capa` (CAPAS_IMAGEN), `sombra` (SOMBRAS), `borde`/`colorBorde`; la sombra va en un envoltorio exterior para no recortarse con el molde. **Bloques listos:** `lib/bloques.ts` (BLOQUES, `elementosBloque`: ids nuevos y `grupo` común), pestaña «Bloques» de `BibliotecaLienzo`; soltar `bloque:id`.
- **Capas bloqueadas y ocultas:** `bloqueado` (solo editor; `EditorLienzo` lo excluye de selección múltiple, marquesina, teclado y borrado; `PropsEdicion.bloqueado` quita el cursor de mover) y `oculto` (no se dibuja: `LienzoVista` y `LienzoApilado` lo filtran; `busqueda.ts` lo ignora).
- **Elementos repetidos:** `maestra: { elementos, capa? }` en la edición y `sinMaestra` en la página; `aplicarMaestra` (en `lib/esquema.ts`) los agrega a cada página de lienzo al leer (ids `m-…`, `capa` encima/debajo; en el celular los de la parte alta de la hoja primero, el resto al final) antes de resolver `{n}`. En el editor: `Editor.tsx` (modo `editandoMaestra`, `paginaMaestra`, `repetirEnTodas`, `dejarEnEstaPagina`) y `EditorLienzo` (`fantasma`, `onMover`, `repetidos`). Excluidos del buscador (`esRepetido`).
- **Subida de fotos:** `guardarMedio` (`lib/admin.ts`) optimiza con `sharp` (carga perezosa): máx. 2000 px, sin metadatos, JPEG/WebP q82, PNG opaco → WebP, `original=1` para no tocarla; devuelve `{ src, optimizado? }`.
- **Mis elementos:** `lib/elementos-guardados.ts` (`listarElementos`, `guardarElemento`, `renombrarElemento`, `borrarElemento`) guarda en `content/elementos/<id>.json` `{nombre, creada, w, h, elementos}` (esquina en 0,0; validado envolviéndolos en una página de lienzo; sin enlaces a páginas ni `{p:…}`; imágenes copiadas con `copiarMedios` de `plantillas.ts` a `public/media/_plantillas/el-<id>/`). Rutas `GET/POST /api/admin/elementos` y `PUT/DELETE /api/admin/elementos/[id]`. En el editor: herramienta «Míos» del riel (modo `mios` de `BibliotecaLienzo`), botón ☆, `agregarMio` (ids nuevos + un grupo nuevo), soltar `mio:<id>`.
- **Interactivos:** `comparar` {src, alt?, antes?, despues?} en una imagen (la principal es el «antes») → `components/ComparadorImagen.tsx` (cliente; dos fotos y un `<input type="range">` invisible encima; `estatico` en editor y miniaturas). `revelar` (texto de la tapa, 1–80) en cualquier elemento → `components/RevelarAlTocar.tsx` (cliente; contenido `visibility:hidden` + botón de tapa; no en editor ni miniaturas). `[data-sin-giro]` evita que `PageFlow` tome el deslizamiento táctil como giro de página.
- **Parallax de fotos:** `parallax` (`suave|medio|fuerte`, `PARALLAX` en `lib/esquema.ts` con la escala). En `Lienzo.tsx` la foto va en un envoltorio `.fx-par` ya ampliado (solo en el sitio y la vista previa; no en el editor ni en miniaturas); `ParallaxLienzo.tsx` (cliente, montado junto a `AnimacionesLienzo` en `plantillas.tsx`) lo desplaza con `translate3d` según la posición del marco en pantalla (IntersectionObserver + scroll con rAF); máximo = (escala−1)/2 × alto del marco. `prefers-reduced-motion`: sin movimiento ni ampliación (CSS).
- **Texto que se escribe:** efectos de entrada `letras` y `palabras` (`lib/animaciones.ts`, `esEfectoTexto`; lógica en `lib/animaciones-texto.ts`, `animarTexto`). No se toca el texto de React: se anima un clon superpuesto partido en piezas (`inline-block`, WAAPI con retraso escalonado) y al terminar se retira; `duracion` = tiempo total (vacío = según el largo), `retraso` = espera inicial. Lo usan `AnimacionesLienzo` (sitio) y «Probar» del editor; en un elemento que no es texto cae a un fundido.
- **Botones y efectos:** un botón es un texto con `boton: true`, `fondo`, `radio`, `borde`/`colorBorde`, `enlace`; los estilos listos están en `BOTONES` (`lib/esquema.ts`, `elementoBoton`) y salen en la pestaña «Botones» de `BibliotecaLienzo`. Todo elemento admite `hover` (subir, acercar, inclinar, brillo, encoger) y `bucle` (flotar, latir, balancear, brillar), definidos en `lib/animaciones.ts` y dibujados con CSS (`.fx-h`, `.fx-b` en `globals.css`; solo en el sitio y la vista previa, no en el editor ni en miniaturas). La entrada suma `cortina` y `difuminar`.
- **Espacio en el celular:** `espacioMovil` (0–400) fija el espacio antes de un elemento en la columna; si falta se calcula del hueco que tenía en la hoja.
- **Validación:** `lib/ediciones.ts` (`validarEdicion`; estricta en el panel, `tolerante` en el sitio: una página con error se sustituye por un aviso y una edición dañada se omite). Los errores dicen página y campo. Los colores solo pueden ser de la paleta
  (`papel, papel2, tinta, tintaSuave, blanco, terracota, ocre, oliva, indigo`) o hexadecimales (no `rgba`).

## Números de página automáticos (identificadores)
- Cada página puede tener `ancla` (ej. `editorial`). Un enlace `"#editorial"` lleva a esa página aunque se mueva.
- En los textos: `{p:editorial}` → número de esa página; `{p:editorial:2}` → `03`; `{n}` / `{n:2}` → número de la propia página.
- Se resuelve **al leer** la edición (`resolverReferencias`); el archivo guarda las referencias. Un identificador inexistente
  lanza un error que lista los que hay. Las ediciones 14 y 15 ya usan esto en portada, índice y pies.

## Funciones del panel (`/admin`)
- **Editor de lienzo:** arrastrar elementos, inspector de propiedades, texto enriquecido, reglas/guías, imán, grupos, deshacer.
- **Plantillas** (▤): 6 iniciales, 10 de publicidad (incluye 3 collages de varias marcas), 3 de noticias y cómic, y las propias.
- **Revisor de diseño** (✓): datos (anuncios seguidos, enlaces `example.com`, textos de relleno, imágenes sin descripción) y
  medición visual por página en escritorio y celular (letra < 9.5 px, desborde horizontal, posibles choques de texto). Los choques
  son **«posibles»**: la medición dio falsos avisos en pruebas.
- **Armar edición resumida:** elegir y ordenar páginas de otra edición; `lib/resumen.ts` reacomoda el índice, la portada y los enlaces.
- **Orden en el celular**, **vista previa móvil**, publicación programada, numeración automática, clics y newsletter (ver guía).

## Mejoras del editor (23-10-2026)
- **Lista antes de publicar:** `listaAntesDePublicar` y nuevas comprobaciones de `revisarDatos` (`lib/revision.ts`: página vacía, imagen sin archivo, texto vacío, elementos ocultos, enlace a edición no publicada); se muestra arriba del revisor (`RevisorDiseno.tsx`) y `Editor.tsx` la consulta al publicar (`confirmarPublicacion`).
- **Biblioteca de medios:** `BibliotecaMedios.tsx` exporta `GaleriaMedios` (columnas tipo mampostería, búsqueda, pestañas Imágenes/Videos) y el modal (modo elegir en `CampoArchivo` y modo gestionar en la barra); la herramienta **Subidos** del riel (`BibliotecaLienzo` modo `subidos`) usa la misma galería, y `EditorLienzo.colocarSubido` agrega la foto a la hoja (clic o arrastre `subido:<ruta>`); `lib/medios-uso.ts` (dónde se usa cada ruta de /media, función pura) y en `lib/admin.ts` `bibliotecaMedios` / `borrarMedio` (a `content/papelera-medios/`; solo si ninguna edición guardada lo usa). Rutas: `GET /api/admin/medios?todos=1`, `DELETE /api/admin/medios`.
- **Sombras y degradados:** campos `sombraTexto`, `degradado`, `anguloDegradado` (`lib/esquema.ts`: `SOMBRAS_TEXTO`, `DEGRADADOS`; validados en `ediciones.ts`; dibujados en `Lienzo.tsx`; con degradado la sombra va como `filter`).
- **Dos pestañas:** `marcaEdicion` (mtime del archivo) y `guardarEdicion(id, datos, base)` → 409 si la marca no coincide; `PUT` con cabecera `x-marca` (o `?forzar=1`), `GET /api/admin/ediciones/[id]` devuelve la marca; `Editor.tsx` la consulta y muestra el aviso (`cambioAjeno`).

- **Revisor de accesibilidad:** `lib/accesibilidad.ts` (`revisarAccesibilidad`, `contraste`: contraste WCAG con el fondo estimado por lo que se dibuja debajo —cuadros, degradados, fondo propio, fondo de la página, con la paleta clara—, tamaño, descripciones, enlaces, objetivos táctiles, contenido que desaparece, páginas sin título). Los avisos (`Aviso`, ahora con `grupo`, `elemento` y `arreglo`) se muestran en la pestaña «Accesibilidad» de `RevisorDiseno.tsx`; `Editor.tsx` aplica el arreglo (`onArreglar`). Los puntos de `listaAntesDePublicar` correspondientes son sugerencias.
- **Zoom y recorte de fotos:** campo `zoom` (1–5) en la imagen, junto a `enfoque`; `Lienzo.tsx` lo dibuja con un envoltorio `transform: scale(zoom)` cuyo `transform-origin` es el enfoque (el mismo punto de `object-position`, de modo que el enfoque recorre toda la foto acercada). `lib/recorte.ts` (`desplazarEnfoque`) convierte un arrastre en cambio de enfoque; `EditorLienzo` tiene el modo `recortando` (botón del inspector o doble clic; arrastre con `empezarRecorte`, barra de zoom, Esc).
- **Quitar fondo:** `lib/quitar-fondo.ts` (distancia de color + relleno desde los bordes + suavizado de la máscara; sin servicios externos) y `components/admin/QuitarFondo.tsx` (modal con vista previa sobre damero; aplica en tamaño completo hasta 2000 px y sube un PNG nuevo con `subir`).
- **Figuras decorativas:** `scripts/generar-figuras.mjs` genera `src/lib/figuras-datos.ts` (`FIGURAS`, ids `fig-…`, con `caja` = tamaño del dibujo, `ajuste: "estirar"` para marcos, `trazoBase`, `ancho`; todo calculado o dibujado ahí, sin material de terceros). `lib/catalogo-iconos.ts` junta iconos y figuras en `CATALOGO` (lo usan `IconoSvg`, la validación, el inspector, el portapapeles y `elementoIcono`, que da a cada figura su proporción). Panel «Figuras» en `BibliotecaLienzo.tsx` (modo `figuras`) y herramienta del riel en `EditorLienzo.tsx`.
- **Buscar y reemplazar:** `lib/buscar-reemplazar.ts` (lógica pura: `buscarEnEdicion`, `reemplazarEnEdicion`; recorre textos —por tramos si hay `contenido`, y recalcula `texto`—, globos, alt, crédito, enlaces, títulos, tema y la `maestra`; omite enlaces que quedarían inválidos) y `components/admin/BuscarReemplazar.tsx` (modal), enlazado en `Editor.tsx` (botón 🔎, Ctrl+Alt+H, deshacer de un paso con `reemplazoAnterior`).
- **Animación de salida:** campo `salida {efecto, duracion?, despues?}` (`lib/animaciones.ts`: `fotogramasSalida`, `opcionesSalida`, `DESPUES_DEFECTO`; validado en `ediciones.ts`). En el sitio, `Lienzo.tsx` pone `data-salida`/`data-sal-*` en el envoltorio y `AnimacionesLienzo.tsx` programa la salida (tras la entrada, o al aparecer si no hay) y deja el elemento en opacidad 0. La prueba del editor está en `EditorLienzo.reproducir`.
- **Copiar y pegar estilo:** `lib/estilo.ts` (`camposDeEstilo`, `copiarEstilo`, `aplicarEstilo`: solo campos compartidos por tipo; lo ausente en el origen se quita) y, en `EditorLienzo.tsx`, `copiarEstiloSel`/`pegarEstiloSel` (botones 🖌/🎨, Ctrl+Alt+C/V; se guarda en `localStorage` `revista:estilo`).
- **Vista previa del movimiento:** `pruebaBucle` y `pruebaHover` (`lib/animaciones.ts`) repiten con `Element.animate` lo que en el sitio hace el CSS (`.fx-b`, `.fx-h`); `EditorLienzo.probarMovimiento` las lanza sobre el elemento seleccionado y el inspector las llama al elegir el efecto o con «▶ Ver el movimiento». Si se cambia un valor en `globals.css`, hay que cambiarlo también ahí.

## Publicidad y clics
Los enlaces de los elementos (https, `mailto:`, `tel:`, WhatsApp y rutas del sitio) se miden (`/api/clic`, `content/clics.json`; opcional `CLICS_WEBHOOK_URL`, con campo `evento`). Las vistas de página (`ContarVistas` en el layout de la edición → `/api/vista` → `content/vistas.json`, `lib/vistas.ts`) alimentan `/admin/clics` (tasa = clics ÷ vistas de la página). El selector «Lleva a» (`SelectorDestino` en `InspectorLienzo.tsx`) arma el destino; `GET /api/admin/ediciones` lista las ediciones. El campo de elemento `dato {fecha, fuente?, dias?}` lo usa `revisarDatos(paginas, fecha)` (`lib/revision.ts`) para el aviso «Dato desactualizado». Los anuncios llevan
`seccion: "Publicidad"`. Las marcas de la edición 14 usan logos y fotos descargados de Wikimedia Commons (créditos en la página de
créditos); las marcas propias (AcambaGo, Erudito Galery, Josman/Fercadi) y sus textos de oferta son de ejemplo.

## Modo oscuro
Clase `dark` en `<html>` (script `next/script` en `layout.tsx`; elección en `localStorage.theme`, si no hay, la del sistema).
Las **hojas de la revista** siguen claras: `.paleta-clara` restaura la paleta clara dentro de ellas. El logo oscuro es el de AcambaGo.

## Lector
- Escritorio (≥ 640 px): las páginas se pasan con scroll/arrastre/flechas y giro de hoja (`PageFlow`) y navegación inferior (`PageTurner`).
- **Celular (< 640 px): scroll continuo, sin giro de hoja.** `PageFlow` se apaga (`matchMedia`) y `FlujoMovil` (cliente) agrega debajo la página siguiente cuando el final queda a ~1400 px, hasta el final de la edición. Cada página se dibuja en el servidor con la acción `cargarPaginaFlujo` (`lib/flujo-actions.tsx`, usa `CuerpoLienzo` de `plantillas.tsx`) para que sus componentes de cliente funcionen. Mientras se lee, `history.replaceState` cambia la URL a la página visible (un enlace o recarga cae ahí y sigue desde ahí), y se ajustan el contador `[data-contador]` y el título. Encadena páginas de **cualquier tipo** (`CuerpoFlujo` en `plantillas.tsx`: lienzo en hoja de 900 px y las plantillas clásicas por su `Cuerpo…`); si la acción no devuelve la página, «Continuar →»; al final, «Fin de la edición». Las páginas sin contador arriba (clásicas) muestran una pastilla fija «n / total». **las páginas lejanas se descargan** (más de 3 pantallas arriba o 4 abajo: se cambian por un espacio de la misma altura y se redibujan al acercarse; la primera no) para que una edición larga no acumule nodos ni imágenes; `PageTurner` se oculta en celular; hay un enlace «↑ Página anterior» arriba. `AnimacionesLienzo` y `ParallaxLienzo` reclaman sus elementos (`data-anim-obs`, `data-par-obs`) para que cada página agregada no vuelva a animar las anteriores.
- Contenedor `@container pagina (max-width: 640px)` decide escritorio vs celular por el ancho de la hoja, no de la ventana.
- Probar siempre a **360 px** (ancho real de un teléfono común).
