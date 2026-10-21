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

## Publicidad y clics
Los enlaces externos de los elementos se miden (`/api/clic`, `content/clics.json`; opcional `CLICS_WEBHOOK_URL`). Los anuncios llevan
`seccion: "Publicidad"`. Las marcas de la edición 14 usan logos y fotos descargados de Wikimedia Commons (créditos en la página de
créditos); las marcas propias (AcambaGo, Erudito Galery, Josman/Fercadi) y sus textos de oferta son de ejemplo.

## Modo oscuro
Clase `dark` en `<html>` (script `next/script` en `layout.tsx`; elección en `localStorage.theme`, si no hay, la del sistema).
Las **hojas de la revista** siguen claras: `.paleta-clara` restaura la paleta clara dentro de ellas. El logo oscuro es el de AcambaGo.

## Lector
- Escritorio (≥ 640 px): las páginas se pasan con scroll/arrastre/flechas y giro de hoja (`PageFlow`) y navegación inferior (`PageTurner`).
- **Celular (< 640 px): scroll continuo, sin giro de hoja.** `PageFlow` se apaga (`matchMedia`) y `FlujoMovil` (cliente) agrega debajo la página siguiente cuando el final queda a ~1400 px, hasta el final de la edición. Cada página se dibuja en el servidor con la acción `cargarPaginaFlujo` (`lib/flujo-actions.tsx`, usa `CuerpoLienzo` de `plantillas.tsx`) para que sus componentes de cliente funcionen. Mientras se lee, `history.replaceState` cambia la URL a la página visible (un enlace o recarga cae ahí y sigue desde ahí), y se ajustan el contador `[data-contador]` y el título. Solo encadena páginas de tipo `lienzo`: si la siguiente es de plantilla clásica, termina con «Continuar →»; al final, «Fin de la edición». `PageTurner` se oculta en celular en las páginas de lienzo; hay un enlace «↑ Página anterior» arriba. `AnimacionesLienzo` y `ParallaxLienzo` reclaman sus elementos (`data-anim-obs`, `data-par-obs`) para que cada página agregada no vuelva a animar las anteriores.
- Contenedor `@container pagina (max-width: 640px)` decide escritorio vs celular por el ancho de la hoja, no de la ventana.
- Probar siempre a **360 px** (ancho real de un teléfono común).
