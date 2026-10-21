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
- **Publicidad** (10): anuncios de página completa, mosaicos, campaña, patrocinado, cupones, patrocinadores y tres **collages de
  varias marcas** (banner + dos cuadros + banner, columna alta + cuatro anuncios, tres bandas) con separaciones delgadas.
- **Noticias y cómic** (3): noticias con cifra destacada, noticias con fotos y cómic a página completa (hoja más alta, 1640).
  Sus pies de página usan `{n:2}` (ver «Números de página que se corrigen solos»).
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

## Números de página que se corrigen solos

Al agregar, quitar o mover páginas, el índice, los pies de página y los enlaces a páginas dejan de coincidir si escribiste los
números a mano. Para evitarlo:

1. **Ponle un identificador a la página** (campo «Identificador de la página», arriba de la hoja): `editorial`, `noticias`,
   `cupones`… Solo minúsculas, números, `-` y `_`. Cada uno debe ser único en la edición (al duplicar una página, la copia nace sin él).
2. **Enlaces:** en «Lleva a» elige la página; si tiene identificador queda guardado como `#editorial` y sigue a la página aunque
   la muevas. (Los enlaces por número, como `3`, también funcionan, pero el editor solo los corrige al arrastrar páginas.)
3. **Números dentro de un texto:** escribe en cualquier texto
   - `{p:editorial}` → el número de la página con ese identificador (por ejemplo `3`);
   - `{p:editorial:2}` → el mismo con ceros a la izquierda (`03`), como en el índice;
   - `{n}` / `{n:2}` → el número de la página donde está el texto (para los pies: `Edición Los Azufres · {n:2}`).

En la hoja del editor esos números se ven ya resueltos (un identificador que no existe se muestra como «?»). El archivo guarda las referencias tal cual; el número real se calcula al leer la edición (sitio, búsqueda y vista previa). Si
un texto o enlace apunta a un identificador que no existe, la edición muestra un error que dice cuál y cuáles hay. Las
plantillas guardadas no conservan identificadores ni enlaces por identificador, y cambian `{p:…}` por «—».
Las ediciones 14 y 15 ya usan esto en la portada, el índice y los pies de página.

## Créditos de las imágenes

En el inspector de cada imagen, **Crédito (autor y licencia)**, por ejemplo «Foto: Ana Pérez, CC BY-SA 4.0». En la página de créditos escribe
**`{creditos}`** en un texto y se reemplaza por todos los créditos de la edición, sin repetir y en orden de aparición, separados por «; ». Así no
hay que armar a mano la lista cada vez. (El revisor avisa de fotos sin crédito solo en ediciones que ya usan créditos.)

## Enfoque de las fotos

Las fotos con ajuste «Cubrir» se recortan para llenar su caja. En **Enfoque horizontal / vertical (%)** eliges qué parte debe quedar a la vista
(50 / 50 = centro; por ejemplo vertical 20 % para no cortar una cabeza que está arriba).

## Bloques listos

En el **riel de herramientas** (a la izquierda de la hoja), **Bloques** abre 9 bloques ya compuestos con vista previa: **Comercio** (tarjeta de producto, cupón de descuento, llamada a la acción,
datos de contacto con iconos), **Datos y citas** (cifra grande, testimonio), **Eventos y pasos** (evento con fecha, tres pasos) y **Estructura** (encabezado de
sección). Clic para ponerlo al centro de la hoja o arrástralo a donde lo quieras. Salen **agrupados** (se mueven juntos; doble clic entra a una pieza, y el
botón de agrupar del panel los separa). Cambia los textos de guía y suelta tus fotos sobre los marcadores de color; los botones traen su efecto y piden enlace.

## Filtros y decoración de imágenes

En el panel **Imagen**: **Filtro de color** (blanco y negro, sepia, cálido, frío, más brillante, más oscura, más contraste, desenfocada), **Capa encima**
(oscura, clara o degradado oscuro arriba/abajo, útil para leer un texto puesto sobre la foto), **Sombra** (suave o marcada) y **Grosor / Color del borde**.
Se combinan con los moldes y las esquinas redondas.

## Botones prediseñados

En el **riel de herramientas** (a la izquierda de la hoja), **Botones** abre una biblioteca de 14 estilos con vista previa viva (pasa el cursor para ver su efecto): básicos (sólido,
contorno, píldora, con flecha, enlace simple), redes y contacto (WhatsApp, Instagram, Facebook, Llamar, Cómo llegar, Escríbenos) y llamativos (oferta
que late, suscríbete que brilla, etiqueta «Nuevo»). Clic o arrastre a la hoja. Después: doble clic para escribir el texto, **Lleva a** (panel Enlace)
para decir a dónde va, y colores, esquinas redondas y borde en el panel **Texto**. Un botón nace sin enlace; el **revisor de diseño** avisa si te lo
dejas así. (Cualquier texto con fondo se puede convertir en botón: esquinas redondas, borde y «Es un botón».)

## Mis elementos (guardar y reutilizar)

Para volver a usar algo que armaste (el anuncio de un cliente, una firma, un sello, un encabezado…): **selecciona uno o varios elementos** en la hoja y pulsa **☆** (arriba de la hoja)
o abre **Míos** en el riel de herramientas y pulsa **Guardar la selección**; escribe un nombre. Desde entonces aparece en **Míos**, en **cualquier edición**: clic para ponerlo en medio de
la hoja o arrástralo a donde lo quieras (entra como un grupo nuevo: se mueve junto, doble clic entra a una pieza). Con **✎** cambias el nombre y con **✕** lo borras (las ediciones donde ya
lo usaste no cambian). Las imágenes se copian aparte, así que siguen funcionando aunque cambies o borres la edición de origen; se quitan los enlaces a números de página y los
`{p:…}` (los enlaces a direcciones externas se conservan).

## Interactivos: antes y después, y revelar al tocar

- **Antes y después** (imagen → panel **Imagen** → **Segunda imagen**): elige otra foto y la imagen se vuelve un **deslizador**. La foto principal (Archivo) es el «antes», a la
  izquierda, y la segunda es el «después», a la derecha; las dos deben tener el mismo tamaño o encuadre. Puedes cambiar los **rótulos** («Antes» / «Después»). Se mueve con
  el ratón, el dedo o las flechas del teclado, y en el celular no gira la página mientras lo deslizas. En el editor se ve a la mitad y no responde (para no estorbar al editar).
- **Revelar al tocar** (cualquier elemento → panel **Revelar al tocar**): escribe el texto de la tapa (p. ej. «Toca para ver la respuesta») y el elemento queda tapado hasta que el
  lector lo toca; luego se queda a la vista. Sirve para la respuesta de una trivia, un cupón, un dato curioso. Si el elemento lleva enlace, tocar la tapa solo la quita (no navega).
  En el editor se ve normal y con la etiqueta «Se revela al tocar».
- No hay «acordeón» (secciones que se abren y empujan lo de abajo): la hoja tiene posiciones fijas. Para preguntas y respuestas usa **Revelar al tocar** en cada respuesta.

## Efectos de movimiento

En el panel de cada elemento, **Efectos de movimiento** (se ven en el sitio publicado y en la vista previa, no mientras editas):
- **Al pasar el cursor:** se levanta con sombra, acerca (en una foto, el zoom queda dentro de su marco), se inclina, se ilumina o se hunde.
- **Movimiento continuo:** flota, late, se balancea o parpadea con un brillo. Se apaga solo si el lector pidió menos animaciones en su equipo.
- En una **foto**, **Parallax al hacer scroll** (suave, medio o marcado): la imagen se mueve más lento que la página, dentro de su marco (se amplía un poco para poder moverse,
  12 %, 22 % o 35 %; funciona mejor en fotos grandes y anchas). Los globos de texto, la capa y el borde no se mueven; solo la foto. Se apaga si el lector pidió menos animaciones.
- Además, la **animación de entrada** suma **Cortina** (de arriba hacia abajo) y **Difuminar** (de borroso a nítido), y, solo en los **textos**,
  **Texto letra por letra** y **Texto palabra por palabra**: el texto se va escribiendo al entrar en pantalla. Su **Duración** es el tiempo de toda la escritura
  (déjala vacía y se calcula según lo largo que sea el texto); el **Retraso** es la espera antes de empezar. **▶ Probar** lo muestra en la hoja. Si el lector pidió
  menos animaciones en su equipo, el texto aparece completo de una vez.

## Editar con el dedo (tableta o celular)

Con la pantalla táctil, un dedo mueve y redimensiona elementos (los tiradores se agrandan en pantallas táctiles); un dedo sobre el fondo gris desplaza la
hoja, y **dos dedos hacen zoom y desplazan** (pellizco). Mientras haces el pellizco no se mueve ningún elemento.

## El panel de la derecha (propiedades)

El inspector está dividido en **paneles plegables**: pulsa el título de uno para abrirlo o cerrarlo, o usa **Abrir todo / Plegar todo** (arriba del panel). El navegador
recuerda cuáles dejaste abiertos. Con un elemento seleccionado, de arriba abajo:
- **Texto / Imagen / Video / Icono / Forma:** lo propio del elemento (siempre a mano). El texto se divide en **Texto** y **Fondo y borde** (fondo, esquinas, borde,
  «es un botón»); la imagen en **Imagen** y **Estilo de la imagen** (molde, filtro, capa, sombra, borde); además **Texto sobre la imagen** (globos).
- **Posición y tamaño** (X, Y, ancho, alto, giro, opacidad), **Enlace**, **Animación de entrada**, **Efectos de movimiento** y **En el celular**.
  Los que no usas empiezan cerrados y, cuando están cerrados, muestran en una línea lo que tienen (p. ej. «Subir», «Página 16», «Solo celular»); si el elemento ya tiene
  un valor ahí (un enlace, una animación…), el panel empieza abierto.
- Sin nada seleccionado, el panel es el de **Esta página**: Hoja abierta; Animaciones, Transición e Índice cerrados.

## Autoguardado, recuperación y versiones

- **Autoguardar** (casilla arriba): guarda solo, unos 3 segundos después de cada cambio. Viene **activo en los borradores** y **apagado en las ediciones publicadas**
  (para que un cambio a medias no llegue al sitio sin que lo revises); puedes cambiarlo y se recuerda en este navegador. Arriba se lee «Guardado a las 10:56».
  Si un autoguardado falla (por ejemplo, un color no válido), avisa y no reintenta hasta que cambies algo.
- **Recuperación:** mientras hay cambios sin guardar, el navegador conserva una copia. Si se cierra la pestaña o se cae el equipo, al volver a abrir la edición
  sale un aviso con **Recuperarlos** o **Descartarlos** (la copia no se borra mientras decides). Se limpia sola al guardar.
- **↶ Versiones:** antes de sobrescribir el archivo, el servidor guarda la versión anterior (como mucho una cada 3 minutos, las últimas 40, en `content/respaldos/`).
  **Restaurar** carga en el editor las páginas, el tema y la fecha de esa versión; no cambia si la edición está publicada y no se escribe hasta que se guarde.

## Dónde está cada cosa en el editor

De arriba abajo, la **hoja** es lo principal y lo demás se aparta para no estorbar:

- **Barra de arriba:** guardar, revisar el diseño y abrir la edición. Debajo, una franja resume la edición (N.º, fecha, tema y si es borrador o
  publicada); **✎ Datos de la edición** despliega los campos para cambiarlos (en una edición nueva sin tema ya salen abiertos).
- **A la izquierda:** las páginas. Abajo, **Agregar una página** (elige el tipo y pulsa «+ Agregar después de la N»), más **Plantillas** e **Índice**.
- **Sobre la hoja:** el título de la página con sus acciones (subir, bajar, plantillas, duplicar, quitar) y, plegado, el **⚙ Identificador** de la página.
  Después, la ayuda rápida (ⓘ) y a la derecha copiar / cortar / pegar / seleccionar todo / deshacer.
- **Riel de herramientas** (a la izquierda de la hoja, con icono y nombre; en pantallas angostas va en fila sobre la hoja): **Texto** (titular, párrafo, etiqueta),
  **Imagen** y **Video** (se agregan al instante), **Formas** (rectángulo, círculo, línea), **Bloques**, **Botones**, **Iconos**, **Moldes** y **Logo**. Las que tienen
  opciones abren un **panel** junto al riel (clic en una pieza para agregarla o arrástrala a la hoja; la hoja se reajusta sola); vuelve a pulsar la herramienta o ✕ para cerrarlo.
- **Debajo de la hoja** (siempre a la vista): zoom, ajustar, mano, reglas, cuadrícula e imán. Al abrir una página la hoja aparece **entera y centrada**
  (como en Canva); cambia el zoom o pulsa **Ancho** / **Entera** / **100 %** cuando quieras. Si eliges «Ancho», se recuerda al cambiar de página.
- **A la derecha:** propiedades del elemento (o de la hoja si no hay nada elegido) y la pestaña **Celular**.
- Una página en blanco muestra una guía con los primeros pasos (+ Titular, + Párrafo, + Imagen, Usar una plantilla). **ⓘ Ayuda rápida** resume los atajos.

## Generar el índice

En la lista de páginas, el botón **☰ Generar índice** crea la página «Contenido» con una fila por página (número + título, los dos con enlace). Pone un
identificador a las páginas que no lo tengan, y usa `{p:identificador:2}` y `#identificador`, así que si después mueves, agregas o quitas páginas los
números y enlaces se corrigen solos. Entran las páginas con título y «Mostrar en el índice»; quedan fuera la portada, los anuncios y cualquier índice.
Si hay más de 18 se hacen varias páginas. Se inserta después de la portada; si lo vuelves a pulsar, rehace el índice generado en el mismo lugar
(pide confirmación). Un índice armado a mano (sección «Contenido») no se toca, pero tampoco se lista.

## Texto sobre la imagen (globos, rótulos y traducciones)

Selecciona una imagen y abre el panel **Texto sobre la imagen**. Con **+ Globo**, **+ Recuadro** o **+ Parche** pones texto con letra de verdad
encima de la imagen (se puede editar, cambiar de tamaño y escala con la imagen, también en el celular).

- **Globo de diálogo / pensamiento / recuadro (narración) / sonido:** con su cola, fondo, color y letra (por defecto Comic Neue).
- **Parche liso:** un rectángulo del color que quieras para **tapar el texto original** de una imagen; encima pones un globo con la traducción.
- Con la imagen seleccionada sola, arrastra cada globo en la hoja para moverlo y usa el cuadrito de su esquina para cambiar el tamaño.
  También puedes escribir X, Y, ancho, alto (en % de la imagen) y el tamaño de letra (% del ancho de la imagen).
- Los botones numerados eligen el globo; **Duplicar** y **Quitar** actúan sobre el seleccionado.

## Muchas páginas

- En «Lleva a» aparece un buscador (por número, título o identificador) cuando la edición tiene más de 12 páginas.
- Si la edición no tiene identificadores, el botón **Poner identificador a las N páginas que no lo tienen** (arriba de la hoja) los genera a partir de los
  títulos, sin tocar los que ya existen.
- Los elementos marcados «Solo en el celular» aparecen en el editor con borde punteado y la etiqueta «Solo en el celular».

## Espacio en la columna del celular

En páginas «apilar», el hueco entre elementos sale de la distancia que tenían en la hoja. Si uno queda demasiado separado (o pegado), selecciónalo y
en **En el celular → Espacio antes de este elemento** escribe un número (0–400; vacío = automático).

## Si una página tiene un error

En el sitio, una página con un dato inválido (por ejemplo un color mal escrito) se muestra como «Esta página no está disponible» y **no** tumba la edición
(en desarrollo muestra el motivo; el panel sigue avisando al guardar). Una edición con errores generales (fecha, tema) se omite del sitio y
el motivo se escribe en la consola del servidor.

## Armar una edición resumida

En la lista de ediciones del panel (`/admin`), sección **Armar edición resumida** (debajo de «Nueva edición»):

1. Elige la edición de la que tomarás páginas.
2. Marca las páginas, o usa los **atajos por sección** (por ejemplo «Publicidad» o «Noticias») para marcar o quitar todas.
3. En la columna derecha ordénalas con ↑ ↓ o quítalas con ✕. Si quedan anuncios seguidos, el panel lo avisa.
4. Escribe identificador, fecha y tema, y pulsa **Crear edición resumida**. Queda como borrador.

Qué se ajusta solo:

- **Índice** (página con filas «número + título» enlazadas): se quitan las entradas de páginas que no incluiste y las demás suben sin
  dejar huecos. Los números salen bien si el índice usa identificadores (`{p:identificador:2}`; ver «Números de página que se corrigen solos»).
- **Portada** (entradas «P. n · título · frase»): una entrada que apuntaba a una página quitada pasa a apuntar a otra página
  incluida (la primera con contenido que no se repita).
- **Enlaces** a páginas: se renumeran los que siguen y se quitan los que llevaban a páginas que ya no están.
- **Textos con `{p:…}`** de páginas quitadas quedan como «—» (el panel lo avisa para que los revises).

Al terminar el panel muestra qué se ajustó. Las ediciones antiguas con números escritos a mano en el índice también funcionan,
pero conviene migrarlas a identificadores para que cualquier cambio posterior se corrija solo.

## Revisor de diseño

Botón **✓ Revisar diseño** (arriba, junto a «Abrir edición»). Busca problemas antes de publicar:

- **Datos (al instante, con lo que ves en pantalla):** anuncios seguidos; enlaces a `example.com` y textos de relleno sin
  reemplazar («Nombre y apellido», «000 000», «lorem ipsum»…); imágenes sin descripción (texto alternativo).
- **Visual (unos segundos por página, sobre la última versión **guardada**):** abre cada página en un marco invisible con ancho de
  computadora y con 360 px de celular y mide lo que se dibuja:
  - (Se miden también las páginas «escala», como los anuncios; los textos invisibles —opacidad 0— o repetidos a propósito se ignoran.)
  - posibles choques entre textos (*Revisar*): confírmalos a ojo con **Ir →**; la medición puede marcar textos que solo se tocan,
    y en una prueba real dio algunos falsos avisos;
  - páginas más anchas que la pantalla del celular (*Corregir*);
  - letra menor de 9.5 px en el celular (*Revisar* si baja de 6.5 px, si no *Sugerencia*): sirve para decidir si una página
    «escala» debe pasar a «apilar».
- La revisión visual mide **3 páginas a la vez** (una edición de 24 páginas tarda unos 2 minutos). Cada hallazgo trae **Ir →**, que abre esa página. «Revisar solo la página N» repite la revisión visual de la página abierta
  (más rápido al ir corrigiendo).

Límites: compara texto con texto (no detecta texto encima de una foto ni texto cortado dentro de un cuadro) y las páginas que
no son de lienzo solo pasan la revisión de datos. Si hay cambios sin guardar, guarda antes de la revisión visual.

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

## Publicidad y conteo de clics

- En el editor, **Plantillas → Publicidad** trae siete formatos de anuncio (página completa, dos medias, mosaico de 4, campaña de temporada, contenido patrocinado, cupones y «Con el apoyo de»). Todas llevan la etiqueta «Publicidad» y la sección «Publicidad».
- Para que un anuncio cuente clics, selecciona su imagen o texto y escribe su dirección en **Enlace** (`https://…`, o `https://wa.me/52…` para WhatsApp).
- **Reporte:** `/admin/clics` (botón «↗ Clics» del panel) muestra clics por edición y por enlace (últimos 7 días, últimos 30 y total) y se exporta a CSV.
- Solo se cuentan enlaces externos de ediciones **publicadas**; un mismo visitante suma una vez cada 10 minutos por enlace. Tus propias pruebas en el sitio también suman.
- Los datos se guardan en `content/clics.json` (no se sube a git). En Vercel el disco es de solo lectura: define la variable `CLICS_WEBHOOK_URL` y cada clic se enviará por POST (JSON: `fecha, edicion, pagina, elemento, url, etiqueta, anuncio`) a una hoja de cálculo o servicio (Zapier, Make, Google Apps Script…). Sin webhook, en Vercel los clics no se guardan.
