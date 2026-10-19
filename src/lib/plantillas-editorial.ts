import type { Elemento, ElementoTexto, Pagina } from "./esquema";
import type { PlantillaBase } from "./plantillas-base";

/**
 * Plantillas de solo lectura nacidas de la edición «Los Azufres»:
 *  · PLANTILLAS_COLLAGE: páginas de varios anunciantes con separaciones delgadas (se muestran en la pestaña Publicidad);
 *  · PLANTILLAS_EDITORIAL: páginas de noticias con cifras y fotos, y cómic a página completa.
 * Los espacios de foto muestran un color provisional hasta que se sube la imagen. Los textos son guías para reemplazar.
 */

const SECCION_PUBLICIDAD = "Publicidad";

const texto = (x: number, y: number, w: number, h: number, t: string, o: Partial<ElementoTexto> = {}): Elemento => ({ tipo: "texto", x, y, w, h, texto: t, ...o });
const imagen = (x: number, y: number, w: number, h: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "imagen", x, y, w, h, tono: "ocre", alt: "Imagen", ajuste: "cubrir", ...o }) as Elemento;
const forma = (x: number, y: number, w: number, h: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "forma", x, y, w, h, color: "tinta", ...o }) as Elemento;

const pagina = (titulo: string, elementos: Elemento[], opciones: { seccion?: string; fondo?: string; alto?: number; transicion?: Pagina["transicion"] } = {}): Pagina => {
  // Ids propios; el orden de la columna del celular es el orden en que se escribieron los elementos visibles.
  const conId = elementos.map((e, i) => ({ ...e, id: `e${i + 1}` }) as Elemento);
  return {
    plantilla: "lienzo",
    transicion: opciones.transicion ?? "fundido",
    titulo,
    ...(opciones.seccion ? { seccion: opciones.seccion } : {}),
    enIndice: false,
    fondo: opciones.fondo ?? "papel",
    alto: opciones.alto ?? 1100,
    movil: "apilar",
    ordenMovil: conId.filter((e) => e.movil !== "ocultar" && !(e.tipo === "forma" && Math.min(e.w, e.h) > 14 && e.movil === undefined)).map((e) => e.id as string),
    elementos: conId,
  };
};

/* ------------------------------ Collages de anuncios ------------------------------ */

type Celda = { x: number; y: number; w: number; h: number; tono: string; marca: string; titulo: string; texto?: string; boton?: string; tam?: number };

/** Una celda de collage: foto/arte de fondo, nombre del anunciante, titular, frase y botón. */
const celda = (c: Celda): Elemento[] => {
  const ancho = c.w - 40;
  const tam = c.tam ?? (c.w > 600 ? 44 : c.w > 300 ? 34 : 26);
  const lineasTitulo = Math.max(1, Math.ceil((c.titulo.length * tam * 0.55) / ancho));
  const altoTitulo = Math.round(lineasTitulo * tam * 1.1 + 8);
  const y0 = c.y + 22;
  const el: Elemento[] = [
    imagen(c.x, c.y, c.w, c.h, { tono: c.tono, alt: `Arte de ${c.marca}` }),
    texto(c.x + 20, y0, ancho, 20, c.marca, { fuente: "sans", tam: 13, peso: 800, mayusculas: true, espaciado: 0.2, color: "papel" }),
    texto(c.x + 20, y0 + 28, ancho, altoTitulo, c.titulo, { fuente: "display", tam, peso: 900, cursiva: true, color: "papel", interlineado: 1.05 }),
  ];
  let y = y0 + 28 + altoTitulo + 8;
  if (c.texto && c.h > 200) {
    el.push(texto(c.x + 20, y, ancho, 56, c.texto, { fuente: "sans", tam: 15, color: "papel", interlineado: 1.3 }));
    y += 62;
  }
  if (c.boton && y + 38 < c.y + c.h) {
    el.push(texto(c.x + 20, c.y + c.h - 58, Math.min(220, ancho), 38, c.boton, { fuente: "sans", tam: 14, peso: 800, mayusculas: true, espaciado: 0.08, color: "tinta", fondo: "papel", relleno: 8, alinear: "centro", vertical: "centro" } as Partial<ElementoTexto>));
  }
  return el;
};

const etiquetaPublicidad = (x: number, y: number): Elemento =>
  texto(x, y, 140, 16, "PUBLICIDAD", { fuente: "sans", tam: 10, peso: 700, mayusculas: true, espaciado: 0.2, color: "papel", opacidad: 0.8 });

export const PLANTILLAS_COLLAGE: PlantillaBase[] = [
  {
    id: "collage-banner-cuadros",
    nombre: "Collage: banner, dos cuadros y banner",
    descripcion: "Cuatro anunciantes en una página, con separaciones delgadas como en una revista de anuncios.",
    pagina: pagina(
      "Anuncios · Collage de cuatro",
      [
        ...celda({ x: 16, y: 16, w: 768, h: 280, tono: "indigo", marca: "Anunciante 1", titulo: "Titular del banner superior", texto: "Frase corta con la oferta o el beneficio.", boton: "Ver más" }),
        ...celda({ x: 16, y: 306, w: 379, h: 400, tono: "terracota", marca: "Anunciante 2", titulo: "Titular del cuadro", texto: "Frase corta con la oferta.", boton: "Conócelo" }),
        ...celda({ x: 405, y: 306, w: 379, h: 400, tono: "oliva", marca: "Anunciante 3", titulo: "Titular del cuadro", texto: "Frase corta con la oferta.", boton: "Conócelo" }),
        ...celda({ x: 16, y: 716, w: 768, h: 368, tono: "tinta", marca: "Anunciante 4", titulo: "Titular del banner inferior", texto: "Frase corta con la oferta o el beneficio.", boton: "Ver más" }),
        etiquetaPublicidad(28, 1066),
      ],
      { seccion: SECCION_PUBLICIDAD, fondo: "blanco" },
    ),
  },
  {
    id: "collage-columna-grande",
    nombre: "Collage: columna alta y cuatro anuncios",
    descripcion: "Una columna alta, un anuncio grande, uno debajo y dos a la derecha (cinco anunciantes).",
    pagina: pagina(
      "Anuncios · Collage de cinco",
      [
        ...celda({ x: 16, y: 16, w: 170, h: 1068, tono: "ocre", marca: "Anunciante 1", titulo: "Titular de la columna", tam: 30 }),
        ...celda({ x: 196, y: 16, w: 340, h: 700, tono: "tinta", marca: "Anunciante 2", titulo: "Anuncio principal de la página", texto: "Frase corta con la oferta o el beneficio.", boton: "Ver más" }),
        ...celda({ x: 546, y: 16, w: 238, h: 330, tono: "indigo", marca: "Anunciante 3", titulo: "Titular chico", tam: 26, texto: "Frase breve.", boton: "Ver" }),
        ...celda({ x: 546, y: 356, w: 238, h: 728, tono: "terracota", marca: "Anunciante 4", titulo: "Titular de la columna derecha", tam: 34, texto: "Frase corta con la oferta.", boton: "Compra ya" }),
        ...celda({ x: 196, y: 726, w: 340, h: 358, tono: "oliva", marca: "Anunciante 5", titulo: "Titular del cuadro inferior", texto: "Frase corta con la oferta.", boton: "Reservar" }),
        etiquetaPublicidad(206, 1066),
      ],
      { seccion: SECCION_PUBLICIDAD, fondo: "blanco" },
    ),
  },
  {
    id: "collage-tres-bandas",
    nombre: "Collage: tres bandas",
    descripcion: "Tres anuncios apaisados, uno sobre otro. La banda del centro sirve para «Tu marca puede estar aquí».",
    pagina: pagina(
      "Anuncios · Tres bandas",
      [
        ...celda({ x: 16, y: 16, w: 768, h: 330, tono: "terracota", marca: "Anunciante 1", titulo: "Titular de la banda superior", texto: "Frase corta con la oferta o el beneficio.", boton: "Pide ahora" }),
        ...celda({ x: 16, y: 356, w: 768, h: 340, tono: "indigo", marca: "ACOM-Di", titulo: "Tu marca puede estar aquí", texto: "Lectores de toda la región · anuncios con animación y enlace.", boton: "Anúnciate aquí" }),
        ...celda({ x: 16, y: 706, w: 768, h: 378, tono: "oliva", marca: "Anunciante 3", titulo: "Titular de la banda inferior", texto: "Frase corta con la oferta o el beneficio.", boton: "Pide a domicilio" }),
        etiquetaPublicidad(28, 1066),
      ],
      { seccion: SECCION_PUBLICIDAD, fondo: "blanco" },
    ),
  },
];

/* ------------------------------ Noticias y cómic ------------------------------ */

const kicker = (x: number, y: number, w: number, t: string, o: Partial<ElementoTexto> = {}): Elemento =>
  texto(x, y, w, 16, t, { fuente: "sans", tam: 12, peso: 800, mayusculas: true, espaciado: 0.2, color: "terracota", ...o });

/** Pie de página con el número de la propia página ({n:2} → «07»): se corrige solo si se agregan o mueven páginas. */
const pie = (): Elemento[] => [
  forma(56, 1054, 688, 1, { color: "papel2", movil: "ocultar" }),
  texto(56, 1062, 420, 18, "Nombre de la revista", { fuente: "sans", tam: 12, peso: 700, mayusculas: true, espaciado: 0.14, color: "tintaSuave", movil: "ocultar" }),
  texto(444, 1062, 300, 18, "Edición · {n:2}", { fuente: "sans", tam: 12, peso: 700, mayusculas: true, espaciado: 0.14, color: "tintaSuave", alinear: "derecha", movil: "ocultar" }),
];

const nota = (x: number, y: number, w: number, categoria: string, titular: string, cuerpo: string): Elemento[] => [
  forma(x, y, w, 2, { color: "tinta", movil: "ocultar" }),
  kicker(x, y + 8, w, categoria),
  texto(x, y + 28, w, 48, titular, { fuente: "display", tam: 18.5, peso: 800, interlineado: 1.12 }),
  texto(x, y + 80, w, 66, cuerpo, { fuente: "serif", tam: 13, interlineado: 1.36 }),
];

const cifra = (x: number, y: number, w: number, numero: string, descripcion: string): Elemento[] => [
  texto(x, y, w, 50, numero, { fuente: "display", tam: 38, peso: 900, color: "terracota", fondo: "papel2", relleno: 8, alinear: "centro", vertical: "centro", interlineado: 1 } as Partial<ElementoTexto>),
  texto(x, y + 50, w, 46, descripcion, { fuente: "sans", tam: 13, peso: 600, fondo: "papel2", relleno: 8, alinear: "centro", vertical: "centro", interlineado: 1.3 } as Partial<ElementoTexto>),
];

export const PLANTILLAS_EDITORIAL: PlantillaBase[] = [
  {
    id: "noticias-cifras",
    nombre: "Noticias con cifra destacada",
    descripcion: "Nota principal con foto y una cifra grande, tres datos y seis notas breves en dos columnas.",
    pagina: pagina(
      "Noticias",
      [
        kicker(56, 40, 400, "Noticias · semana del 00 al 00 de mes"),
        texto(56, 62, 414, 52, "Título de la sección", { fuente: "display", tam: 38, peso: 900, cursiva: true, interlineado: 1.04 }),
        forma(56, 120, 688, 3, { color: "tinta", movil: "ocultar" }),
        kicker(56, 134, 440, "Categoría · etiqueta de la nota principal"),
        texto(56, 156, 440, 72, "Titular de la nota principal en dos líneas", { fuente: "display", tam: 31, peso: 900, interlineado: 1.08 }),
        texto(56, 236, 440, 150, "Cuenta en cinco o seis líneas lo más importante: qué pasó, dónde, cuándo y qué sigue. Una idea por frase, con datos concretos.", { fuente: "serif", tam: 15.5, interlineado: 1.5 }),
        imagen(520, 134, 224, 126, { tono: "indigo", alt: "Foto de la nota principal" }),
        texto(520, 261, 224, 14, "Pie de foto. Crédito de la imagen.", { fuente: "sans", tam: 9.5, color: "tintaSuave", interlineado: 1.2 }),
        texto(520, 278, 224, 58, "000", { fuente: "display", tam: 40, peso: 900, color: "papel", fondo: "indigo", relleno: 6, alinear: "centro", vertical: "centro", interlineado: 1 } as Partial<ElementoTexto>),
        texto(520, 336, 224, 50, "qué mide la cifra · dato de apoyo", { fuente: "sans", tam: 12.5, peso: 700, color: "papel", fondo: "indigo", relleno: 8, alinear: "centro", vertical: "centro", interlineado: 1.4 } as Partial<ElementoTexto>),
        ...cifra(56, 400, 220, "0.0 %", "Dato 1 y su fuente"),
        ...cifra(290, 400, 220, "0.0 %", "Dato 2 y su fuente"),
        ...cifra(524, 400, 220, "000", "Dato 3 y su fuente"),
        ...nota(56, 512, 328, "Economía", "Titular de la nota 1", "Dos líneas de contexto: el dato clave y por qué importa."),
        ...nota(416, 512, 328, "Sociedad", "Titular de la nota 2", "Dos líneas de contexto: el dato clave y por qué importa."),
        ...nota(56, 664, 328, "Seguridad", "Titular de la nota 3", "Dos líneas de contexto: el dato clave y por qué importa."),
        ...nota(416, 664, 328, "Salud", "Titular de la nota 4", "Dos líneas de contexto: el dato clave y por qué importa."),
        ...nota(56, 816, 328, "Educación", "Titular de la nota 5", "Dos líneas de contexto: el dato clave y por qué importa."),
        ...nota(416, 816, 328, "Clima", "Titular de la nota 6", "Dos líneas de contexto: el dato clave y por qué importa."),
        forma(56, 976, 688, 2, { color: "terracota", movil: "ocultar" }),
        kicker(56, 984, 300, "Cerca de ti · tu localidad"),
        texto(56, 1002, 688, 34, "Aviso local 1  ·  Aviso local 2  ·  Aviso local 3.", { fuente: "serif", tam: 12.5, interlineado: 1.35 }),
        texto(56, 1034, 688, 12, "Con datos de (fuentes), al día de mes de año; las cifras pueden cambiar.", { fuente: "sans", tam: 10, color: "tintaSuave", interlineado: 1.3 }),
        ...pie(),
      ],
      { seccion: "Noticias" },
    ),
  },
  {
    id: "noticias-fotos",
    nombre: "Noticias con fotos",
    descripcion: "Encabezado centrado, foto grande con cifras en columna, tres notas con foto y tres de texto.",
    pagina: pagina(
      "Más noticias",
      [
        imagen(290, 20, 220, 84, { src: "/brand/logo.svg", alt: "Logotipo", ajuste: "contener", tono: undefined }),
        texto(56, 114, 688, 18, "Noticias · segunda parte · semana del 00 al 00 de mes", { fuente: "sans", tam: 12, peso: 800, mayusculas: true, espaciado: 0.2, color: "terracota", alinear: "centro" }),
        forma(40, 142, 720, 3, { color: "tinta", movil: "ocultar" }),
        imagen(40, 166, 520, 246, { tono: "indigo", alt: "Foto de la nota principal" }),
        kicker(40, 424, 520, "Categoría · nota principal"),
        texto(40, 444, 520, 70, "Titular de la nota principal en dos líneas", { fuente: "display", tam: 29, peso: 900, interlineado: 1.08 }),
        texto(40, 520, 520, 112, "Cuenta en cinco o seis líneas lo más importante: qué pasó, dónde, cuándo y qué sigue. Una idea por frase, con datos concretos.", { fuente: "serif", tam: 14.5, interlineado: 1.5 }),
        ...[0, 1, 2].flatMap((i) => [
          texto(580, 166 + i * 84, 180, 46, i === 2 ? "00 mdp" : "0.0 %", { fuente: "display", tam: 32, peso: 900, color: "terracota", fondo: "papel2", relleno: 4, alinear: "centro", vertical: "centro", interlineado: 1 } as Partial<ElementoTexto>),
          texto(580, 212 + i * 84, 180, 36, `Dato ${i + 1} y su fuente`, { fuente: "sans", tam: 11.5, peso: 600, fondo: "papel2", relleno: 6, alinear: "centro", vertical: "centro", interlineado: 1.25 } as Partial<ElementoTexto>),
        ]),
        texto(580, 424, 180, 60, "00 vs 00", { fuente: "display", tam: 26, peso: 900, color: "papel", fondo: "indigo", relleno: 6, alinear: "centro", vertical: "centro", interlineado: 1 } as Partial<ElementoTexto>),
        texto(580, 484, 180, 146, "qué compara la cifra: un valor frente al otro", { fuente: "sans", tam: 12.5, peso: 700, color: "papel", fondo: "indigo", relleno: 10, alinear: "centro", vertical: "centro", interlineado: 1.4 } as Partial<ElementoTexto>),
        forma(40, 650, 720, 3, { color: "tinta", movil: "ocultar" }),
        ...[0, 1, 2].flatMap((i): Elemento[] => {
          const x = 40 + i * 248;
          return [
            imagen(x, 664, 214, 92, { tono: ["terracota", "oliva", "ocre"][i], alt: `Foto de la nota ${i + 1}` }),
            kicker(x, 762, 214, ["Vivienda", "Deporte", "Seguridad"][i], { tam: 11.5 }),
            texto(x, 780, 214, 42, `Titular de la nota ${i + 1}`, { fuente: "display", tam: 16, peso: 800, interlineado: 1.12 }),
            texto(x, 824, 214, 70, "Una o dos frases con el dato clave de la nota.", { fuente: "serif", tam: 12.5, interlineado: 1.34 }),
          ];
        }),
        forma(40, 906, 720, 1, { color: "papel2", movil: "ocultar" }),
        ...[0, 1, 2].flatMap((i): Elemento[] => {
          const x = 40 + i * 248;
          return [
            kicker(x, 916, 214, ["Economía", "Educación", "Clima"][i], { tam: 11.5 }),
            texto(x, 934, 214, 40, `Titular de la nota ${i + 4}`, { fuente: "display", tam: 16, peso: 800, interlineado: 1.12 }),
            texto(x, 976, 214, 52, "Una frase con el dato clave.", { fuente: "serif", tam: 12.5, interlineado: 1.34 }),
          ];
        }),
        texto(40, 1038, 720, 12, "Con datos de (fuentes), al día de mes de año; las cifras pueden cambiar.", { fuente: "sans", tam: 10, color: "tintaSuave", interlineado: 1.3 }),
        ...pie(),
      ],
      { seccion: "Noticias" },
    ),
  },
  {
    id: "comic-pagina-completa",
    nombre: "Cómic a página completa",
    descripcion: "Tres viñetas a todo el ancho, una debajo de otra. La hoja es más alta que lo normal para que se lean en grande.",
    pagina: pagina(
      "Cómic",
      [
        kicker(24, 24, 600, "Cómic · autor, año · 1 de 2"),
        texto(24, 46, 752, 46, "Título del cómic", { fuente: "display", tam: 34, peso: 900, cursiva: true, interlineado: 1.05 }),
        imagen(20, 100, 760, 466, { tono: "ocre", ajuste: "contener", alt: "Viñeta 1" }),
        imagen(20, 578, 760, 482, { tono: "oliva", ajuste: "contener", alt: "Viñeta 2" }),
        imagen(20, 1072, 760, 487, { tono: "terracota", ajuste: "contener", alt: "Viñeta 3" }),
        texto(24, 1572, 752, 52, "Título de la obra, de autor (publicación, fecha). Dominio público o licencia: indica cuál. Traducción y rotulación: nombre.", { fuente: "sans", tam: 13, color: "tintaSuave", cursiva: true, interlineado: 1.45 }),
      ],
      { seccion: "Cómic", fondo: "papel2", alto: 1640, transicion: "izquierda" },
    ),
  },
];
