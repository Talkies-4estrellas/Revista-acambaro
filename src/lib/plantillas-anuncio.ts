import type { Elemento, ElementoTexto, Pagina } from "./esquema";
import type { PlantillaBase } from "./plantillas-base";

/**
 * Plantillas de anuncio (solo lectura). Todas llevan la etiqueta «PUBLICIDAD», la sección "Publicidad" y un
 * espacio para el enlace: al elegir el anuncio en el editor, escribe su dirección en "Enlace" (https://…
 * o https://wa.me/52…). Los espacios sin foto muestran un color provisional hasta que se sube el arte.
 */

const texto = (x: number, y: number, w: number, h: number, t: string, o: Partial<ElementoTexto> = {}): Elemento => ({
  tipo: "texto",
  x,
  y,
  w,
  h,
  texto: t,
  ...o,
});
const imagen = (x: number, y: number, w: number, h: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "imagen", x, y, w, h, tono: "ocre", alt: "Anuncio", ajuste: "cubrir", ...o }) as Elemento;
const forma = (x: number, y: number, w: number, h: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "forma", x, y, w, h, color: "tinta", ...o }) as Elemento;
const icono = (nombre: string, x: number, y: number, w: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "icono", icono: nombre, x, y, w, h: w, ...o }) as Elemento;

/** Etiqueta discreta pero visible que identifica el espacio como publicidad. */
const etiqueta = (x: number, y: number, w = 200, o: Partial<ElementoTexto> = {}): Elemento =>
  texto(x, y, w, 20, "PUBLICIDAD", { fuente: "sans", tam: 12, peso: 700, mayusculas: true, espaciado: 0.22, color: "tintaSuave", ...o });

/** Pie de un anuncio: nombre del anunciante y contacto. */
const pie = (x: number, y: number, w: number, nombre = "Nombre del anunciante", contacto = "Dirección · WhatsApp"): Elemento[] => [
  texto(x, y, w, 24, nombre, { fuente: "sans", tam: 15, peso: 700 }),
  texto(x, y + 24, w, 22, contacto, { fuente: "sans", tam: 13, color: "tintaSuave" }),
];

const pagina = (titulo: string, elementos: Elemento[], fondo = "papel"): Pagina => {
  // Ids propios y orden en el celular = orden en que se escribieron (si no, se ordena por altura y los pies de anuncio quedan al final).
  const conId = elementos.map((e, i) => ({ ...e, id: `a${i + 1}` }) as Elemento);
  return {
    plantilla: "lienzo",
    transicion: "fundido",
    titulo,
    seccion: "Publicidad",
    enIndice: false,
    fondo,
    alto: 1100,
    movil: "apilar",
    ordenMovil: conId.filter((e) => e.movil !== "ocultar").map((e) => e.id as string),
    elementos: conId,
  };
};

export const PLANTILLAS_ANUNCIO: PlantillaBase[] = [
  {
    id: "anuncio-pagina",
    nombre: "Anuncio de página completa",
    descripcion: "Arte a sangre con franja de contacto. Ideal para anunciante principal.",
    pagina: pagina("Anuncio · Página completa", [
      imagen(0, 0, 800, 1010, { alt: "Anuncio de página completa" }),
      etiqueta(600, 20, 180, { alinear: "derecha", color: "tinta", fondo: "papel", relleno: 6 } as Partial<ElementoTexto>),
      forma(0, 1010, 800, 90, { color: "tinta" }),
      texto(40, 1024, 480, 30, "Nombre del anunciante", { fuente: "sans", tam: 18, peso: 700, color: "papel" }),
      texto(40, 1056, 560, 24, "Dirección · Horario · Teléfono", { fuente: "sans", tam: 14, color: "papel", opacidad: 0.8 }),
      icono("whatsapp", 700, 1027, 46, { color: "papel" }),
    ]),
  },
  {
    id: "anuncio-dos-medias",
    nombre: "Dos medias páginas",
    descripcion: "Dos anunciantes, uno sobre otro, cada uno con su pie de contacto.",
    pagina: pagina("Anuncios · Dos medias páginas", [
      etiqueta(60, 24, 300),
      imagen(60, 54, 680, 440, { tono: "terracota", alt: "Anuncio 1 (media página)" }),
      ...pie(60, 502, 680),
      forma(60, 566, 680, 1, { color: "tintaSuave", opacidad: 0.4 }),
      imagen(60, 590, 680, 440, { tono: "indigo", alt: "Anuncio 2 (media página)" }),
      ...pie(60, 1038, 680),
    ]),
  },
  {
    id: "anuncio-mosaico-4",
    nombre: "Mosaico de 4 anuncios",
    descripcion: "Cuatro cuartos de página en cuadrícula de 2 × 2.",
    pagina: pagina("Anuncios · Mosaico", [
      etiqueta(60, 24, 300),
      imagen(60, 54, 330, 430, { tono: "terracota", alt: "Anuncio 1 (cuarto de página)" }),
      ...pie(60, 492, 330),
      imagen(410, 54, 330, 430, { tono: "oliva", alt: "Anuncio 2 (cuarto de página)" }),
      ...pie(410, 492, 330),
      imagen(60, 574, 330, 430, { tono: "ocre", alt: "Anuncio 3 (cuarto de página)" }),
      ...pie(60, 1012, 330),
      imagen(410, 574, 330, 430, { tono: "indigo", alt: "Anuncio 4 (cuarto de página)" }),
      ...pie(410, 1012, 330),
    ]),
  },
  {
    id: "anuncio-campana",
    nombre: "Campaña de temporada",
    descripcion: "Título de temporada (p. ej. Regreso a clases) con un anuncio grande y tres pequeños.",
    pagina: pagina("Anuncios · Campaña", [
      texto(60, 36, 680, 90, "Título de la temporada", { fuente: "display", tam: 46, peso: 900, interlineado: 1.05 }),
      etiqueta(60, 126, 300),
      imagen(60, 160, 430, 830, { tono: "indigo", alt: "Anuncio principal de la campaña" }),
      ...pie(60, 998, 430),
      imagen(510, 160, 230, 230, { tono: "terracota", alt: "Anuncio 2" }),
      imagen(510, 410, 230, 230, { tono: "ocre", alt: "Anuncio 3" }),
      imagen(510, 660, 230, 230, { tono: "oliva", alt: "Anuncio 4" }),
      texto(510, 904, 230, 60, "Anunciantes de la campaña y contacto", { fuente: "sans", tam: 13, color: "tintaSuave", interlineado: 1.4 }),
    ]),
  },
  {
    id: "anuncio-publirreportaje",
    nombre: "Contenido patrocinado",
    descripcion: "Nota breve y útil escrita con el anunciante, etiquetada como publicidad, con ficha de contacto.",
    pagina: pagina("Contenido patrocinado", [
      etiqueta(60, 24, 420, { texto: "PUBLICIDAD · CONTENIDO PATROCINADO" } as Partial<ElementoTexto>),
      imagen(0, 56, 800, 430, { tono: "ocre", alt: "Foto del anunciante" }),
      texto(60, 516, 680, 130, "Título útil para el lector, no un eslogan", { fuente: "display", tam: 42, peso: 900, interlineado: 1.08 }),
      forma(60, 656, 120, 4, { color: "terracota" }),
      texto(60, 680, 680, 220, "Cuenta algo que le sirva al lector: una receta, una historia del negocio, una guía para elegir. Menciona al anunciante con naturalidad y evita el tono de venta.\n\nCierra con una invitación sencilla a visitar o contactar.", { fuente: "serif", tam: 19, interlineado: 1.6 }),
      forma(60, 920, 680, 130, { color: "papel2", radio: 8 }),
      texto(84, 938, 440, 28, "Nombre del anunciante", { fuente: "display", tam: 22, peso: 800 }),
      texto(84, 972, 460, 60, "Dirección · Horario\nTeléfono · Redes", { fuente: "sans", tam: 14, color: "tintaSuave", interlineado: 1.5 }),
      icono("whatsapp", 660, 960, 56, { color: "oliva" }),
    ]),
  },
  {
    id: "anuncio-cupones",
    nombre: "Cupones de descuento",
    descripcion: "Tres cupones tocables para promociones; cada uno puede llevar su propio enlace.",
    pagina: pagina("Cupones", [
      texto(60, 36, 680, 70, "Cupones de la semana", { fuente: "display", tam: 42, peso: 900 }),
      etiqueta(60, 104, 300),
      ...[0, 1, 2].flatMap((i): Elemento[] => {
        const y = 150 + i * 310;
        return [
          forma(60, y, 680, 280, { color: "blanco", borde: 3, colorBorde: "terracota", radio: 14 }),
          icono("scissors", 78, y + 12, 30, { color: "terracota" }),
          texto(60, y + 40, 280, 130, "2×1", { fuente: "display", tam: 84, peso: 900, color: "terracota", alinear: "centro", vertical: "centro" }),
          texto(350, y + 40, 370, 110, "Nombre del anunciante\nDescripción breve de la promoción", { fuente: "sans", tam: 20, peso: 700, interlineado: 1.35 }),
          texto(350, y + 160, 370, 60, "Válido hasta el DD/MM · Muestra esta página", { fuente: "sans", tam: 14, color: "tintaSuave", interlineado: 1.4 }),
          icono("whatsapp", 664, y + 218, 44, { color: "oliva" }),
          texto(84, y + 232, 500, 24, "Dirección · Teléfono", { fuente: "sans", tam: 13, color: "tintaSuave" }),
        ];
      }),
    ]),
  },
  {
    id: "anuncio-patrocinadores",
    nombre: "Con el apoyo de",
    descripcion: "Ocho logotipos de patrocinadores sin vender página completa. Va bien en la última página.",
    pagina: pagina("Con el apoyo de", [
      texto(60, 80, 680, 80, "Con el apoyo de", { fuente: "display", tam: 46, peso: 900, cursiva: true, alinear: "centro" }),
      forma(360, 170, 80, 3, { color: "terracota" }),
      texto(110, 196, 580, 60, "Estos negocios de Acámbaro hacen posible cada edición.", { fuente: "serif", tam: 20, alinear: "centro", color: "tintaSuave", interlineado: 1.5 }),
      ...[0, 1, 2, 3].flatMap((f): Elemento[] =>
        [0, 1].map((c) => imagen(100 + c * 310, 310 + f * 160, 290, 130, { tono: "ocre", alt: `Logotipo patrocinador ${f * 2 + c + 1}`, ajuste: "contener", opacidad: 0.9 })),
      ),
      etiqueta(60, 1040, 680, { alinear: "centro" }),
    ]),
  },
];
