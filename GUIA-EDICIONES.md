# Cómo armar una edición

## Con el panel (recomendado)

1. `npm run dev` y abre **http://localhost:3000/admin** (el puerto que use tu servidor).
2. **Nueva edición**: elige identificador, número, fecha y tema. Puedes empezar en blanco o copiando otra edición.
3. En el editor: las **páginas, con miniaturas en vivo**, están a la izquierda (una miniatura se actualiza mientras editas la
   página; los reportajes y demás plantillas con formulario muestran una tarjeta con su tipo). Cambia la vista con los botones
   ☰ lista / ▤ miniaturas / ▦ miniaturas grandes. **Arrastra una página para reordenarla**: una línea terracota marca dónde
   caerá (también al final de la lista); desde el teclado, **Alt + ↑ / ↓** sobre la página elegida. Al reordenar, insertar,
   duplicar o quitar páginas, los enlaces a números de página (de la portada y de los elementos de las páginas en blanco) se
   corrigen para que sigan apuntando a la misma página. En las miniaturas los videos se sustituyen por un marcador.
   La lista de páginas está a la izquierda, el formulario al centro y la **vista previa** a la derecha.
   - Agrega páginas con una plantilla, y muévelas, duplícalas o quítalas. Los enlaces entre páginas (`enlace` y
     destacados de la portada) se corrigen solos cuando cambia la numeración.
   - Cada página tiene su **Transición** (cómo entra al avanzar) y sus bloques de contenido.
   - **Subir** en cualquier campo de imagen o video guarda el archivo en `public/media/<edición>/`
     (jpg, png, webp, gif, avif, mp4, webm; hasta 60 MB). Los archivos ya subidos salen como sugerencias al escribir.
   - **Guardar** (o Ctrl+S) escribe `content/ediciones/<id>.json`. La vista previa se actualiza al guardar.
   - El interruptor **Borrador / Publicada** decide si la edición sale en el sitio.
4. Para publicar: `git add . && git commit && git push` y Vercel despliega.

El panel **solo funciona en desarrollo y desde tu propio equipo** (en producción responde 404), porque escribe archivos
del proyecto. Variables opcionales: `ADMIN_ENABLED=true` (activarlo fuera de desarrollo) y `ADMIN_ALLOW_REMOTE=true`
(permitir otros equipos de la red). Úsalas solo si sabes lo que haces: el panel no tiene contraseña.

## Páginas en blanco (lienzo)

La página **"Página en blanco"** es la principal: una hoja vacía donde compones libremente.

- **Agregar elementos**: arrastra un botón de la barra (Titular, Párrafo, Etiqueta, Imagen, Video, Rectángulo, Círculo,
  Línea) a la hoja, o haz clic para que aparezca. También puedes **soltar imágenes o videos desde tu equipo** sobre la hoja:
  se suben solos y la imagen conserva su proporción.
- **Vista (zoom y posición)**: la barra "Vista" sobre la hoja controla cómo la ves mientras trabajas (no cambia lo que se
  publica). **− / lista / +** acercan y alejan (10 % a 400 %; 100 % = una unidad por píxel); **Ajustar al ancho** (Ctrl+0) y
  **Hoja entera** la encuadran; **Ctrl + rueda** (o pellizco en el trackpad) hace zoom hacia el cursor; la **rueda** desplaza
  la hoja (con Mayús, de lado). Para moverla: **mantén Espacio** y arrastra, usa la herramienta **✋ Mano** (tecla H), el
  botón central del ratón, o arrastra el fondo gris. **⛶ Pantalla completa** da todo el espacio a la hoja y a las propiedades
  (Ctrl+S sigue guardando). Ctrl y + / − también hacen zoom. El tamaño real de la hoja (alto) se cambia en "Hoja", sin elegir elementos.
- **Mover**: arrastra el elemento (hay guías magenta de alineación con los bordes, el centro y los otros elementos; Alt las
  desactiva). Flechas = 1 unidad, Mayús + flechas = 10.
- **Redimensionar**: tiradores de las esquinas y los lados (Mayús en una esquina conserva la proporción). **Girar**: el círculo
  de arriba (Mayús = de 15° en 15°).
- **Escribir**: doble clic en un texto y escribe sobre la hoja (Esc termina). También hay un cuadro de texto en las propiedades.
  Admite `**negrita**` y `*cursiva*`.
- **Texto con varios estilos en la misma caja**: doble clic en un texto y selecciona una parte; la barra que aparece sobre la
  caja permite cambiar, solo para la selección: **tipografía**, **tamaño** (− / lista / +), **negrita**, **cursiva**,
  **subrayado**, **tachado**, **color** y **resaltado** (paleta o color libre), y "Formato" quita todo el formato de la
  selección. Ctrl+B / I / U también funcionan. **Listo** o Esc terminan. Lo que no tenga formato propio usa el de la caja
  (propiedades de la derecha). Si un texto ya tiene formato por partes, las propiedades muestran "Quitar el formato por
  partes" para volver a texto plano. El texto se guarda en `contenido` (párrafos de tramos: `texto`, `negrita`, `cursiva`,
  `subrayado`, `tachado`, `color`, `fondo`, `fuente`, `tam`) y `texto` conserva la versión plana.
- **Tipografías** (18, en 5 categorías): Serif (Playfair Display, Source Serif, Lora, Merriweather, Libre Baskerville,
  Cormorant Garamond, Roboto Slab), Sans (Inter, Montserrat, Poppins, Raleway), Titulares (DM Serif Display, Abril Fatface,
  Bebas Neue, Oswald), Manuscritas (Caveat, Pacifico) y Monoespaciada (IBM Plex Mono). El selector de grosor ofrece solo los
  que cada tipografía realmente tiene. Para añadir otra: `src/app/fuentes.ts` (cargarla con `next/font`, con opciones literales,
  sin `...spread`) y `FUENTES` / `FUENTES_INFO` en `src/lib/esquema.ts`.
- **Iconos** (botón **✦ Iconos**): biblioteca de 197 iconos vectoriales con búsqueda en español (acentos opcionales) y 8
  categorías: lugares y viajes, comida y bebida, naturaleza, cultura y arte, personas y social, comunicación, flechas y signos,
  y redes sociales (Facebook, Instagram, YouTube, WhatsApp, X, TikTok, Spotify, Telegram, Pinterest, Google Maps, Tripadvisor).
  Clic para agregarlo o arrástralo a la hoja. Son elementos normales: se mueven, escalan sin perder nitidez, giran, se agrupan,
  llevan **color**, **grosor del trazo** (los de línea), descripción para accesibilidad y **enlace** (un icono de Instagram
  puede llevar a tu perfil). "Cambiar…" en sus propiedades sustituye el icono sin perder su posición ni su estilo. Para añadir
  más, edita la tabla de `scripts/generar-iconos.mjs` y ejecuta `node scripts/generar-iconos.mjs` (genera
  `src/lib/iconos-datos.ts`). Iconos de línea: Lucide (ISC); marcas: Simple Icons (CC0), que pertenecen a sus titulares.
- **Moldes para fotos** (botón **◍ Moldes**): 22 marcos que recortan una foto, un video o una forma: círculo, óvalo, esquinas
  redondas, píldora, arco, esquinas cortadas, paralelogramo, etiqueta, triángulos, rombo, pentágono, hexágono, octágono,
  estrellas, destello, sello, corazón, cruz y flecha. Cómo usarlos: (1) con una foto, video o forma **seleccionada**, clic en el
  molde se lo aplica; (2) sin selección, clic o arrastre a la hoja crea un **marco para foto** (o una forma de color, a tu
  elección); (3) **arrastra un molde sobre algo ya colocado** y se lo aplica; (4) **suelta una foto desde tu equipo sobre un
  marco** y lo rellena conservando su forma y tamaño. En las propiedades de fotos, videos y formas hay también un selector
  "Molde (marco)". Si hay molde, las "esquinas redondas" y el borde de las formas no se aplican.
- **Propiedades** (columna derecha): tipografía, tamaño, color, alineación, fondo, opacidad, esquinas redondas, enlace a
  otra página o a una dirección externa, etc. Sin nada seleccionado ves las de la hoja: color de fondo, alto, transición.
- **Selección múltiple**: Mayús o Ctrl + clic agrega o quita elementos; arrastrar sobre la hoja vacía dibuja un rectángulo que
  selecciona lo que toca (con Mayús suma a lo ya seleccionado); Ctrl+A selecciona todo; Esc limpia. Al arrastrar uno de los
  seleccionados se mueve todo el grupo (con imanes sobre el conjunto). Ctrl+D, Supr, las flechas y Frente/Atrás también actúan
  sobre todo el grupo. Tamaño, giro y propiedades se editan con un solo elemento seleccionado.
- **Reglas, cuadrícula y guías** (barra "Vista", junto a Mano): **▭ Reglas** muestra una regla arriba y otra a la izquierda, en
  unidades de la hoja; siguen el zoom y el desplazamiento, resaltan el ancho de la hoja, marcan en terracota la posición del
  puntero y la extensión de lo seleccionado. **▦ Cuadrícula** dibuja líneas cada 5, 10, 20, 25, 40, 50 o 100 unidades (la
  lista "u"; con una línea más marcada cada 5 espacios; se oculta sola si quedara demasiado densa; atajo Ctrl + ').
  **🧲 Imán** hace que al mover o redimensionar, el borde se acerque a las líneas de la cuadrícula (Alt lo desactiva
  temporalmente; los elementos girados no se ajustan al redimensionar). **Guías**: arrastra desde una regla hacia la hoja
  para crear una guía (vertical desde la regla de arriba, horizontal desde la de la izquierda); muestra su posición al
  arrastrar, se mueve arrastrándola y se quita llevándola de vuelta a la regla o fuera de la hoja; **✕ Guías (N)** quita todas.
  Las guías **atraen** a los elementos como los demás imanes, **se guardan con la página** (`"guias": {"v": [...], "h": [...]}`)
  y no aparecen en el sitio publicado. Reglas, cuadrícula, paso e imán se recuerdan entre páginas y sesiones.
- **Celular** (pestaña **📱 Celular** del panel de la derecha, junto a "Propiedades"): vista previa en vivo (sin guardar) de la
  página en un teléfono —Galaxy S 360, iPhone SE 375, iPhone 14 390, Pixel 412 o tableta 768— dibujada con el mismo código que
  el sitio publicado. La pestaña se mantiene al cambiar de página. Cada página elige cómo se adapta a pantallas de **640 px o
  menos** (en "En el celular" de las propiedades de la hoja, o con los botones de la propia pestaña):
  - **Reducir la hoja entera**: la hoja se encoge tal cual (es lo que tienen las páginas hechas antes de este cambio). El texto se encoge con ella, así que la pestaña avisa
    cuántos textos quedarían por debajo de 11 px.
  - **Apilar en columna** (por defecto en las **páginas en blanco nuevas** y en las ediciones nuevas; las páginas que ya existían no cambian): los elementos se colocan de arriba abajo (y de izquierda a derecha) en una columna con texto
    legible (un texto de 24 unidades mide ~17 px en un teléfono). El texto ocupa todo el ancho y crece según lo necesite; las
    imágenes conservan su proporción; los elementos pequeños (iconos, sellos) se alinean a la izquierda, centro o derecha según
    estaban en la hoja; los titulares muy grandes se comprimen para caber. Las **formas gruesas con elementos encima** (un banner,
    una tarjeta) se convierten en **secciones**: sus elementos quedan agrupados sobre ese color, así el texto claro sigue
    legible; un banner de ancho completo ocupa todo el ancho de la pantalla. Las formas gruesas sin nada encima se omiten, y las
    líneas finas se conservan como separadores. En pantallas grandes la hoja no cambia.
  - Cada elemento puede **mostrarse u ocultarse** en la columna desde su panel "En el celular" (Automático / Siempre mostrar /
    Ocultar en el celular).
  El diseño se elige por el **ancho del contenedor**, no de la ventana. Las plantillas iniciales ya vienen en modo columna.
  En el JSON: `"movil": "apilar"` en la página y `"movil": "ocultar"` (o `"mostrar"`) en un elemento. Los gestos táctiles
  funcionan: deslizar a los lados, o hacia arriba al final de la página, pasa de página.
- **Animaciones de entrada** (panel "Animación de entrada" de cada elemento): 9 efectos —aparecer, subir, bajar, desde la
  izquierda, desde la derecha, zoom, girar, rebotar y revelar (de izquierda a derecha)— con **duración** (50–6000 ms, por
  defecto 700) y **retraso** (0–20000 ms). Se reproducen **cuando el elemento entra en pantalla** en la página publicada: al
  abrir o pasar a la página, para lo que ya se ve, y al hacer scroll, para lo que queda más abajo en páginas altas. **▶ Probar**
  la reproduce en la hoja (elegir un efecto ya la prueba); sin nada seleccionado, **▶ Probar las animaciones de la página** lanza
  todas con sus retrasos. Con varios elementos seleccionados, **Animar en cascada** aplica el mismo efecto de arriba abajo con una
  pausa creciente (p. ej. 150 ms entre uno y otro). Se respeta "reducir movimiento" del sistema (todo aparece sin animar) y, sin
  JavaScript, todo se muestra normal. Las animaciones se copian con el elemento (copiar/pegar, plantillas) y varias plantillas
  iniciales las traen de ejemplo. En el JSON: `"animacion": { "efecto": "subir", "duracion": 700, "retraso": 200 }`.
- **Copiar, cortar y pegar** (Ctrl+C / Ctrl+X / Ctrl+V, o los botones **⧉ Copiar**, **✂ Cortar**, **▣ Pegar**): selecciona uno o
  varios elementos, cópialos y pégalos en **otra página, otra edición o incluso otra pestaña del panel**, porque viajan por
  el portapapeles del sistema. Al pegar, los elementos reciben ids nuevos y los grupos se renuevan (la copia de un grupo es un
  grupo nuevo). Si ya hay una copia en el mismo sitio se desplaza 20 unidades cada vez para que no queden encimadas;
  **Ctrl+Mayús+V** pega exactamente donde estaban. Al pegar en **otra edición** se quitan los enlaces a números de página (allí
  no significarían lo mismo); los enlaces externos se conservan. Un solo Ctrl+Z deshace todo lo pegado. Con **Ctrl+A** y copiar
  llevas el contenido entero de una página a otra. Además puedes **pegar una captura o imagen** (se sube y se coloca) y **pegar
  texto** copiado de otro sitio (se convierte en un cuadro de texto). Dentro de un campo de texto o mientras escribes sobre la
  hoja, copiar y pegar funcionan como siempre. Lo copiado que no sea válido se ignora con un aviso.
- **Escalar y girar varios a la vez**: con dos o más elementos seleccionados aparece un recuadro punteado con tiradores.
  Las **esquinas** escalan todo el conjunto en proporción (incluido el tamaño del texto, el relleno, los bordes y las esquinas
  redondas); los **lados** solo estiran las cajas (los elementos girados solo se desplazan). El borde opuesto al tirador queda
  fijo. El círculo de arriba **gira el conjunto** alrededor de su centro (Mayús = de 15° en 15°). Todo se deshace con Ctrl+Z.
- **Agrupar** (Ctrl+G) une la selección de forma permanente: al hacer clic en cualquiera se selecciona el grupo entero, y se
  mueve, escala y gira junto. **Doble clic** en un elemento del grupo lo selecciona solo (para editarlo; en un texto, además
  lo abre para escribir); "Seleccionar el grupo" lo vuelve a tomar completo. **Desagrupar**: Ctrl+Mayús+G. Duplicar un grupo
  crea un grupo nuevo. En la lista de capas los elementos agrupados llevan ⛓.
- **Alinear y distribuir** (panel "Alinear", al seleccionar algo): izquierda, centro, derecha, arriba, medio y abajo. Con dos o
  más elementos alinea respecto al conjunto; marca "Alinear respecto a la hoja" para usar los bordes de la hoja (con un solo
  elemento siempre es respecto a la hoja). **Distribuir** horizontal o vertical (3 o más) deja el mismo hueco entre ellos y no
  mueve el primero ni el último. Los elementos girados se alinean por el contorno de su silueta.
- **Capas**: lista de elementos, el de arriba queda al frente. Ctrl+Z / Ctrl+Y deshacen y rehacen; Ctrl+D duplica; Supr elimina.
- La hoja mide **800 unidades de ancho**; en pantalla escala al ancho disponible (máx. 900 px). Usa 22 o más para el cuerpo de
  texto, porque en el celular se reduce. Lo que ves en el editor es lo que se publica.

- **Orden en la columna del celular**: en la pestaña 📱 (modo **Apilar**) aparece el panel "Orden en la columna". Arrastra los
  bloques o usa ↑ ↓ para decidir qué va primero en el celular; una sección (fondo de color con elementos encima) se mueve
  entera y sus elementos se ordenan dentro. 🚫 oculta un elemento en el celular y, en "Fuera de la columna", **Mostrar** lo
  devuelve. Al hacer clic en una fila se selecciona ese elemento en la hoja. Lo que añadas después de ordenar va al final.
  **Restablecer** vuelve al orden por posición (de arriba abajo). Se guarda en la página como `ordenMovil` (lista de ids).

Las plantillas anteriores (portada, índice, reportaje, galería, cita, video, libre) siguen disponibles en el selector
"Agregar página" y se pueden combinar con las páginas en blanco.

## Plantillas de página

Botón **▤ Plantillas** (en la barra lateral y junto a "Duplicar"). Abre un cuadro con miniaturas en vivo:

- **Iniciales** (6, de solo lectura): portada de revista, reportaje con foto grande, cita destacada, galería de 4 fotos, foto en
  marco redondo y contraportada con redes. Todas usan la hoja de 800 × 1100.
- **Mis plantillas**: las que guardas tú. Se guardan en `content/plantillas/` y se comparten entre **todas** las ediciones.
  Se pueden renombrar (✎) y eliminar (✕); eliminar una no cambia las ediciones que ya la usaron.
- **Guardar la página actual como plantilla**: escribe un nombre y "Guardar plantilla". Se guarda con lo que ves en pantalla
  (aunque no hayas guardado la edición). Sus imágenes se **copian** a `public/media/_plantillas/<id>/`, así la plantilla no se
  rompe si luego cambias o borras la edición de origen. Los enlaces a números de página de esa edición se quitan (los enlaces a
  direcciones externas sí se conservan).
- **Usar una plantilla**: "Agregar como página nueva" la inserta después de la actual; "Usar en esta página" reemplaza el
  contenido de la actual (pide confirmación, conserva su título, sección, resumen y lugar en el índice, y se puede deshacer
  cerrando sin guardar). La copia es independiente: modificarla no altera la plantilla.

Para respaldar o llevar tus plantillas a otro equipo, copia `content/plantillas/` y `public/media/_plantillas/`.

## A mano

Todo lo que hace el panel se puede editar directamente en el JSON, como se explica abajo.

Cada edición es **un archivo JSON** en `content/ediciones/`. El nombre del archivo es su identificador
(`02.json` → `/ediciones/02`). El sitio siempre abre en la **última edición publicada** (por `fecha`).

## Publicar una edición nueva (semanal)

1. Copia `content/ediciones/01.json` a `02.json`.
2. Cambia `numero`, `fecha` (AAAA-MM-DD), `tema` y las páginas.
3. Pon las imágenes/videos en `public/media/02/` y refiérelos como `"/media/02/foto.jpg"`.
4. `"publicada": false` = borrador: no aparece en el archivo ni como última edición, pero se puede ver
   entrando directo a `/ediciones/02/1`. Cámbialo a `true` (o quítalo) para publicar.
   **Publicación programada**: en el panel, el selector "Publicación" junto al tema tiene Borrador / Publicada ya /
   Programada…; al elegir Programada pones fecha y hora (**hora de Ciudad de México**). En el JSON es
   `"publicarEn": "2026-10-20T09:00"` con `"publicada": true`. Hasta esa hora la edición no aparece en el archivo ni como
   última edición (igual que un borrador, sigue siendo accesible por su enlace directo); llegada la hora aparece sola. El
   sitio se refresca cada minuto (`revalidate`), así que funciona en Vercel sin volver a desplegar; en un hosting
   100 % estático habría que desplegar de nuevo después de la hora.
   **Número de edición automático**: ya no se escribe a mano. Una edición recibe su número la **primera vez que se
   publica** (o se programa), el siguiente al más alto ya asignado, y **lo conserva para siempre**, aunque después la
   desactives o la pases a borrador (queda como «Desactivada · conserva la N.º 02»). El panel lista primero las
   **Ediciones** (publicadas, programadas y desactivadas, de la más nueva a la más antigua) y después los **Borradores**.
   Los borradores que nunca se publicaron **no cuentan como edición**: muestran un número tenue («será la N.º 03 al
   publicarse») y se reacomodan solos al borrar o publicar otro. El botón **Borrar** aparece en borradores y en ediciones
   desactivadas (una publicada primero se desactiva); el archivo pasa a `content/papelera/` y se puede recuperar. En el
   JSON, `numero` y `"numeroFijo": true` los gestiona el panel al guardar; el sitio usa esos valores. Ojo: si en los
   textos de una página escribiste «N.º 05» a mano, no se actualiza solo.
5. Despliega (git push → Vercel). Si algo está mal escrito, el error dice qué edición, qué página y qué campo.

## Estructura

```json
{
  "numero": "02",
  "fecha": "2026-10-16",
  "tema": "Título del número",
  "publicada": true,
  "paginas": [ { "plantilla": "portada", "transicion": "izquierda", "...": "..." } ]
}
```

El **orden de `paginas` es el orden de lectura**. Los números de página (para enlaces) empiezan en 1.

## Transición (`transicion`)

Cómo **entra** esa página cuando se avanza. Al retroceder se usa la opuesta automáticamente.
Si no se pone, es `"izquierda"`.

| Valor | Efecto |
|---|---|
| `izquierda` | La hoja actual se pasa hacia la izquierda (como un libro) |
| `derecha` | La hoja se pasa hacia la derecha |
| `arriba` | La hoja se levanta hacia arriba |
| `abajo` | La hoja cae hacia abajo |
| `fundido` | La hoja se desvanece |

El arrastre con el ratón sigue la hoja en vivo en `izquierda` y `derecha`; en las demás, arrastrar
a un lado activa la animación al soltar.

## Plantillas (`plantilla`)

Campos comunes (opcionales salvo los marcados): `titulo`, `seccion`, `bajada`, `autor`, `lectura` (minutos),
`fecha` (texto libre), `tono`, `enIndice` (`false` = no sale en el índice ni en la cinta).

| Plantilla | Para qué | Campos propios |
|---|---|---|
| `portada` | Primera página | **`titulo`**, `bajada`, `imagen`, `enlace` (n.º de página del reportaje principal), `destacados` |
| `indice` | Lista automática de las páginas | `agenda` (lista de eventos) |
| `reportaje` | Texto largo | **`titulo`**, `imagen` (principal), `bloques` |
| `galeria` | Fotos en cuadrícula | **`titulo`**, **`imagenes`**, `columnas` (2 o 3), `bloques` |
| `cita` | Página completa con una frase | **`texto`**, `autor`, `tono` (color de fondo) |
| `video` | Video protagonista | **`titulo`**, **`video`**, `bloques` |
| `libre` | Cualquier combinación de bloques | `bloques` |

`destacados`: `[{ "titulo": "...", "seccion": "...", "pagina": 4, "tono": "ocre", "autor": "...", "lectura": 7 }]`

## Bloques (`bloques`)

Van dentro de `reportaje`, `galeria`, `video` y `libre`, en el orden en que se escriben.

| `tipo` | Campos |
|---|---|
| `texto` | `parrafos` (lista), `capitular` (true/false; el primer texto de un reportaje la lleva por defecto). Admite `**negrita**` y `*cursiva*` |
| `subtitulo` | `texto` |
| `imagen` | `src`, `alt`, `pie`, `proporcion`, `ancho`, `tono` |
| `gif` | igual que `imagen` (ruta a un .gif o .webp animado) |
| `video` | `src` (archivo), `youtube` o `vimeo` (solo el ID), `poster`, `pie`, `ancho`, `animado` |
| `cita` | `texto`, `autor` |
| `lista` | `items`, `ordenada` |
| `galeria` | `imagenes`, `columnas` |
| `agenda` | `eventos`: `[{ "dia": "17", "mes": "OCT", "titulo": "...", "lugar": "..." }]` |
| `separador` | — |
| `suscripcion` | `titulo`, `texto` |

- `ancho`: `columna` (por defecto), `ancho` (más ancho que el texto) o `completo` (de borde a borde).
- `proporcion`: `16/9`, `16/10`, `21/9`, `4/3`, `1/1`, `3/4`. Si no se pone y hay `src`, la imagen mantiene su forma.
- Sin `src`, las imágenes muestran una ilustración provisional del `tono` (`terracota`, `ocre`, `oliva`, `indigo`, `tinta`).
- `video` con `"animado": true` y un `src` se reproduce solo, mudo y en bucle: úsalo en lugar de gifs pesados.
- Las rutas deben empezar con `/` (archivo en `public/`) o `https://`.

## Newsletter

- **Alta**: la página `/suscribirse`, el bloque `suscripcion` y el pie del sitio tienen el formulario. En una página en
  blanco, selecciona un botón o imagen y en Enlace → "Formulario de suscripción (newsletter)" (o `"enlace": "/suscribirse"`;
  los enlaces pueden ser rutas del sitio que empiecen con `/`).
- **Dónde se guardan**: `content/suscriptores.json` (privado, no está en `public/`; respáldalo). Repetir un correo no lo
  duplica. Un campo trampa oculto frena a los bots.
- **Hosting de solo lectura** (Vercel): no puede escribir ese archivo. Define la variable `SUSCRIPCION_WEBHOOK_URL` y cada
  alta se enviará por POST (`{"email","fecha"}`) a esa dirección (Zapier, Make, una hoja de cálculo, tu servicio de correo…).
  Sin webhook en ese tipo de hosting el formulario avisa que no pudo guardar.
- **Panel** `/admin/newsletter`: lista de suscriptores (buscar, quitar, **Exportar CSV** con `enlace_baja` personal) y el
  **correo de la edición**: eliges edición, escribes el texto de presentación y copias el HTML o lo descargas; trae cabecera,
  botón "Leer la edición" y la lista de páginas con título. Escribe antes la dirección pública del sitio (se recuerda).
  El HTML lleva `{{enlace_baja}}` donde cada herramienta debe poner el enlace de baja personal.
- **Baja**: `/baja?t=<token>` pide un clic de confirmación y borra al suscriptor.
- **Envío**: la revista no manda correos por sí sola; pega el HTML en tu herramienta (Mailchimp, Brevo, Buttondown, Gmail con
  combinación de correspondencia…) y envía a la lista exportada.

## Consejos

- **Gifs**: pesan mucho. Conviértelos a MP4/WebM corto con `"animado": true` siempre que puedas.
- **Videos largos**: súbelos a YouTube o Vimeo y usa solo el ID.
- **Imágenes**: ~1600 px de ancho y comprimidas (≤ 300 KB) para que el giro de página sea fluido.
- Se puede ver el cambio recargando la página en `npm run dev`; no hace falta reiniciar.

## Búsqueda

- Hay un cuadro **Buscar** en la cabecera de todo el sitio y la página `/buscar?q=…`.
- Busca en el texto de todas las páginas de las ediciones **publicadas** (títulos, textos de las páginas en blanco,
  bloques, agenda, pies de foto y descripciones de imágenes). No incluye borradores, desactivadas ni programadas
  que aún no llegan a su hora.
- Ignora mayúsculas y acentos; con varias palabras, la página debe contener todas. Los resultados salen ordenados por
  relevancia (un título pesa más que un párrafo) y muestran un fragmento con lo buscado resaltado.
- Es una búsqueda en el servidor: no necesita configurar nada ni servicios externos.
