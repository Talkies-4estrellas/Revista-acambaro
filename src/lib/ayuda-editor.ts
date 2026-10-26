/**
 * Contenido de la ayuda del editor y del recorrido guiado: escrito para quien nunca ha editado una página digital, sin palabras técnicas.
 * `muestra` es el nombre de una pieza de la pantalla (atributo data-tour) que el botón «Muéstrame» resalta.
 * La guía completa y técnica está en GUIA-EDICIONES.md.
 */

export type TemaAyuda = {
  id: string;
  grupo: string;
  titulo: string;
  /** Palabras que alguien escribiría al buscar esto (sin acentos no hace falta: la búsqueda los ignora). */
  palabras: string;
  pasos: string[];
  /** Pieza de la pantalla que «Muéstrame» resalta (valor de data-tour). */
  muestra?: string;
  nota?: string;
};

export const GRUPOS_AYUDA = ["Empezar", "Texto y fotos", "Páginas", "Diseño", "Publicar", "Trucos"] as const;

export const TEMAS_AYUDA: TemaAyuda[] = [
  /* ------------------------------ Empezar ------------------------------ */
  {
    id: "como-se-arma",
    grupo: "Empezar",
    titulo: "¿Cómo se arma una página?",
    palabras: "empezar comenzar basico primeros pasos hoja pagina como",
    pasos: [
      "A la izquierda de la hoja están las herramientas: Plantillas, Elementos, Texto y Subidos. Elige una y se abre su panel.",
      "Haz clic en algo del panel (por ejemplo, una figura o una foto) y aparece en la página. También puedes arrastrarlo a donde quieras.",
      "Haz clic en cualquier cosa de la hoja para elegirla: arriba aparecen sus ajustes (color, tamaño, tipo de letra…).",
      "Arrástrala para moverla, o jala una esquina para cambiarle el tamaño.",
    ],
    muestra: "riel",
  },
  {
    id: "guardar",
    grupo: "Empezar",
    titulo: "Guardar tu trabajo",
    palabras: "guardar autoguardado perder cambios ctrl s",
    pasos: [
      "En un borrador, el editor guarda solo unos segundos después de cada cambio. Arriba verás «Guardando…» y luego «Guardado».",
      "Para guardar tú mismo: el botón Guardar de arriba, o Ctrl+S.",
      "Si la edición ya está publicada, no se guarda sola (así no se ve nada a medias en el sitio): pulsa Guardar cuando termines.",
    ],
    muestra: "archivo",
  },
  {
    id: "deshacer",
    grupo: "Empezar",
    titulo: "Deshacer un error",
    palabras: "deshacer rehacer error me equivoque borre regresar atras ctrl z versiones",
    pasos: [
      "Los botones ↶ y ↷ de la barra de arriba deshacen y rehacen lo último que hiciste en la página (también Ctrl+Z y Ctrl+Y).",
      "Si ya cerraste o guardaste: en Archivo → «Versiones anteriores» están las copias de cómo estaba la edición antes y puedes volver a una.",
    ],
    muestra: "deshacer",
  },
  /* ---------------------------- Texto y fotos ---------------------------- */
  {
    id: "cambiar-texto",
    grupo: "Texto y fotos",
    titulo: "Cambiar un texto",
    palabras: "texto escribir cambiar editar titulo parrafo",
    pasos: [
      "Haz doble clic sobre el texto en la hoja (o elígelo y pulsa «Editar» arriba).",
      "Escribe. Para dar formato solo a una parte (negrita, color…), selecciónala y usa la barra que aparece sobre el texto.",
      "Al terminar, pulsa «Listo» o la tecla Esc.",
    ],
    muestra: "hoja",
  },
  {
    id: "letra-color",
    grupo: "Texto y fotos",
    titulo: "Cambiar la letra, el tamaño y el color",
    palabras: "letra fuente tipografia tamano color negrita cursiva alinear centrar",
    pasos: [
      "Haz clic en el texto una vez para elegirlo (no doble clic).",
      "En la barra de arriba de la hoja están: tipo de letra, tamaño (− y +), color, negrita (B), cursiva (I) y alineación.",
    ],
    muestra: "barra",
  },
  {
    id: "agregar-texto",
    grupo: "Texto y fotos",
    titulo: "Agregar un texto nuevo",
    palabras: "agregar texto nuevo titular parrafo etiqueta poner",
    pasos: ["Abre «Texto» en las herramientas de la izquierda.", "Elige Titular, Párrafo o Etiqueta (un clic).", "Haz doble clic sobre el texto nuevo y escribe el tuyo."],
    muestra: "riel-texto",
  },
  {
    id: "subir-foto",
    grupo: "Texto y fotos",
    titulo: "Subir y poner una foto",
    palabras: "foto imagen subir poner agregar video archivo galeria",
    pasos: [
      "Abre «Subidos» en las herramientas de la izquierda.",
      "Pulsa «Subir archivos» y elige tus fotos (puedes elegir varias). Se acomodan solas y se hacen más ligeras.",
      "Haz clic en una foto de la galería y aparece en la página. También puedes arrastrarla a donde quieras.",
      "Atajo: arrastra una foto desde tu computadora directo a la hoja.",
    ],
    muestra: "riel-subidos",
  },
  {
    id: "cambiar-foto",
    grupo: "Texto y fotos",
    titulo: "Cambiar una foto por otra",
    palabras: "foto cambiar reemplazar sustituir otra imagen",
    pasos: ["Haz clic en la foto para elegirla.", "Arriba pulsa «Reemplazar» y elige otra de «Subidos».", "La nueva foto queda en el mismo lugar y con el mismo tamaño."],
    muestra: "barra",
  },
  {
    id: "recortar-foto",
    grupo: "Texto y fotos",
    titulo: "Recortar o acercar una foto",
    palabras: "recortar acercar zoom encuadrar foto mover dentro marco",
    pasos: [
      "Haz doble clic en la foto (o elígela y pulsa «Recortar»).",
      "Arrastra la foto dentro de su marco para elegir qué parte se ve, y usa el deslizador «Zoom» para acercarla.",
      "Pulsa «Listo» (o Esc). «Restablecer» la deja como estaba.",
    ],
  },
  {
    id: "quitar-fondo",
    grupo: "Texto y fotos",
    titulo: "Quitar el fondo de una foto",
    palabras: "quitar fondo transparente recortar producto blanco",
    pasos: [
      "Elige la foto y pulsa «Quitar fondo» arriba.",
      "Toca en la imagen el color que quieres quitar (por ejemplo, el blanco de atrás) y ajusta la tolerancia hasta que el damero muestre lo que quieres.",
      "Funciona mejor con fondos de un solo color. Se guarda una copia nueva; tu foto original no se toca.",
    ],
  },
  {
    id: "mover-tamano",
    grupo: "Texto y fotos",
    titulo: "Mover, agrandar y girar",
    palabras: "mover agrandar achicar tamano girar rotar arrastrar esquina",
    pasos: [
      "Para mover: arrastra el elemento. Con las flechas del teclado lo mueves poquito a poco.",
      "Para cambiar el tamaño: jala una esquina o un borde (con Mayús conserva la proporción).",
      "Para girar: jala el circulito que sale arriba.",
      "Para medidas exactas: botón «Posición» de la barra de arriba.",
    ],
    muestra: "hoja",
  },
  {
    id: "elementos",
    grupo: "Texto y fotos",
    titulo: "Agregar figuras, formas, iconos y botones",
    palabras: "figura forma icono boton cinta sello marco bloque agregar adorno",
    pasos: [
      "Abre «Elementos» en las herramientas de la izquierda.",
      "Arriba del panel eliges la sección: Figuras, Formas, Iconos, Marcos, Bloques, Botones…",
      "Un clic lo agrega a la página. Luego puedes cambiarle el color y el tamaño.",
    ],
    muestra: "riel-elementos",
  },
  {
    id: "enlace",
    grupo: "Texto y fotos",
    titulo: "Hacer que algo lleve a otra parte (enlace)",
    palabras: "enlace link vinculo boton llevar pagina whatsapp correo telefono direccion web",
    pasos: [
      "Elige el texto, la foto o la figura que quieres que se pueda tocar.",
      "Arriba pulsa «Enlace».",
      "En «Lleva a» elige: otra página de la edición, otra edición, un correo, un teléfono, WhatsApp o una dirección web.",
    ],
    muestra: "barra",
  },
  /* -------------------------------- Páginas -------------------------------- */
  {
    id: "agregar-pagina",
    grupo: "Páginas",
    titulo: "Agregar una página",
    palabras: "agregar pagina nueva hoja",
    pasos: [
      "En la lista de páginas (a la izquierda), abajo, elige el tipo de página y pulsa «+ Agregar después de la…».",
      "Para empezar con algo ya diseñado, mejor usa una plantilla (siguiente tema).",
    ],
    muestra: "paginas",
  },
  {
    id: "plantilla",
    grupo: "Páginas",
    titulo: "Usar una plantilla",
    palabras: "plantilla disenada modelo ejemplo pagina lista portada anuncio",
    pasos: [
      "Abre «Plantillas» en las herramientas de la izquierda.",
      "Elige la pestaña (Iniciales, Publicidad, Noticias…) y haz clic en una miniatura: se agrega como página nueva.",
      "«Usar aquí» cambia el contenido de la página que tienes abierta por esa plantilla.",
      "Luego cambia los textos y las fotos por los tuyos.",
    ],
    muestra: "riel-plantillas",
  },
  {
    id: "orden-paginas",
    grupo: "Páginas",
    titulo: "Cambiar el orden de las páginas",
    palabras: "orden mover pagina arrastrar subir bajar acomodar",
    pasos: ["En la lista de páginas, arrastra una miniatura hacia arriba o hacia abajo y suéltala donde quieras.", "También con los botones ↑ y ↓ junto al título de la página, o Alt + ↑/↓ con el teclado."],
    muestra: "paginas",
  },
  {
    id: "duplicar-pagina",
    grupo: "Páginas",
    titulo: "Duplicar o quitar una página",
    palabras: "duplicar copiar quitar borrar eliminar pagina",
    pasos: ["Encima de la hoja, junto al título de la página, están los botones ⧉ (duplicar) y ✕ (quitar).", "Si quitas una por error, usa Deshacer o las versiones anteriores de Archivo."],
  },
  {
    id: "repetidos",
    grupo: "Páginas",
    titulo: "Poner lo mismo en todas las páginas (encabezado, pie, número)",
    palabras: "repetir todas paginas pie encabezado numero pagina marca de agua repetidos",
    pasos: [
      "Elige lo que quieras repetir en una página y pulsa «Repetir en todas» (arriba de la hoja).",
      "Para cambiarlo después: Archivo → «Elementos repetidos…». Lo que cambies ahí cambia en todas las páginas.",
      "En un texto, {n} se vuelve el número de cada página (por ejemplo, un pie que diga «pág. {n}»).",
    ],
    muestra: "archivo",
  },
  /* -------------------------------- Diseño -------------------------------- */
  {
    id: "alinear",
    grupo: "Diseño",
    titulo: "Alinear varias cosas",
    palabras: "alinear centrar varios seleccionar agrupar distribuir",
    pasos: ["Elige varias cosas: arrastra un recuadro en un espacio vacío de la hoja, o haz clic en cada una con Mayús pulsado.", "Arriba aparecen los botones para alinearlas (izquierda, centro, derecha, arriba, medio, abajo).", "«Agrupar» las junta para moverlas como una sola."],
    muestra: "barra",
  },
  {
    id: "animar",
    grupo: "Diseño",
    titulo: "Hacer que algo se mueva (animar)",
    palabras: "animar animacion movimiento aparecer entrada salida efecto",
    pasos: [
      "Elige lo que quieres animar y pulsa «Animar» arriba: se abre su panel de la derecha.",
      "Elige un efecto (aparecer, subir, zoom…). Se ve al momento; «Probar» lo repite.",
      "Se reproduce cuando la gente llega a esa parte de la página. No te pases: pocas animaciones se ven mejor.",
    ],
    muestra: "barra",
  },
  {
    id: "transparencia",
    grupo: "Diseño",
    titulo: "Hacer algo transparente (opacidad)",
    palabras: "transparente transparencia opacidad opaco claro",
    pasos: ["Elige el elemento y pulsa el botón ◐ de la barra de arriba.", "Mueve el deslizador: 100 % es normal y 0 % es invisible."],
    muestra: "barra",
  },
  {
    id: "copiar-estilo",
    grupo: "Diseño",
    titulo: "Copiar el estilo de un elemento a otros",
    palabras: "copiar estilo formato brocha igual mismo aspecto pegar",
    pasos: [
      "Elige el elemento con el aspecto que te gusta y pulsa 🖌 (arriba de la hoja, o Ctrl+Alt+C).",
      "Elige los elementos que quieres igualar y pulsa 🎨 (o Ctrl+Alt+V).",
      "Solo se copia el aspecto (letra, color, bordes, animaciones), no el texto ni la foto.",
    ],
  },
  /* -------------------------------- Publicar -------------------------------- */
  {
    id: "revisar",
    grupo: "Publicar",
    titulo: "Revisar antes de publicar",
    palabras: "revisar errores publicar pendientes accesibilidad contraste texto ejemplo",
    pasos: [
      "Pulsa «✓ Revisar» arriba. Te dice qué falta o se ve mal: textos de ejemplo sin cambiar, botones sin enlace, letra muy chica, fotos sin descripción…",
      "Cada aviso trae «Ir →» (te lleva a esa página) y, a veces, «Arreglar» (lo corrige con un clic).",
      "La lista de arriba muestra ✓ lo que está bien y ✗ lo que conviene resolver.",
    ],
    muestra: "revisar",
  },
  {
    id: "publicar",
    grupo: "Publicar",
    titulo: "Publicar o programar la edición",
    palabras: "publicar programar borrador visible lectores fecha hora",
    pasos: [
      "Pulsa el botón «Publicar ▾» de arriba a la derecha.",
      "«Publicada ya»: se ve en el sitio en cuanto guardes. «Programar…»: eliges el día y la hora. «Borrador»: nadie la ve.",
      "Si hay pendientes (textos de ejemplo, etc.), el editor te avisa antes.",
    ],
    muestra: "publicar",
  },
  {
    id: "celular",
    grupo: "Publicar",
    titulo: "Ver cómo se ve en el celular",
    palabras: "celular telefono movil vista previa pantalla chica",
    pasos: ["En la columna de la derecha hay dos pestañas: «Propiedades» y «Celular».", "«Celular» muestra la página como se ve en un teléfono y deja acomodar el orden de los elementos."],
  },
  /* -------------------------------- Trucos -------------------------------- */
  {
    id: "buscar-reemplazar",
    grupo: "Trucos",
    titulo: "Cambiar un texto en toda la edición (buscar y reemplazar)",
    palabras: "buscar reemplazar cambiar todo telefono nombre texto toda edicion",
    pasos: ["Archivo → «Buscar y reemplazar…» (o Ctrl+Alt+H).", "Escribe lo que buscas y por qué lo cambias; revisa la lista, desmarca lo que no quieras y pulsa «Reemplazar».", "Si te equivocas, «Deshacer» lo regresa."],
    muestra: "archivo",
  },
  {
    id: "atajos",
    grupo: "Trucos",
    titulo: "Atajos de teclado",
    palabras: "atajos teclado teclas ctrl shortcuts",
    pasos: [
      "Ctrl+S: guardar · Ctrl+Z: deshacer · Ctrl+Y: rehacer",
      "Ctrl+C / Ctrl+X / Ctrl+V: copiar, cortar, pegar (Ctrl+Mayús+V pega en el mismo lugar)",
      "Ctrl+A: seleccionar todo · Supr: borrar lo elegido · Esc: salir de editar o de recortar",
      "Flechas: mover poquito lo elegido (con Mayús, más rápido)",
      "Ctrl+Alt+C / Ctrl+Alt+V: copiar / pegar el estilo · Ctrl+Alt+H: buscar y reemplazar",
      "Ctrl y + / − / 0: acercar, alejar y ajustar la hoja · H: mano para desplazar la hoja",
      "Alt al arrastrar: desactiva los imanes que alinean solos",
      "F1: abrir esta ayuda",
    ],
  },
];
