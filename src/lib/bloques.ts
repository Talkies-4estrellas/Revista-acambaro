import { ANCHO_LIENZO, type Elemento, type ElementoTexto } from "./esquema";

/**
 * Bloques listos: grupos de elementos ya compuestos (tarjeta de producto, cupón, cifra, testimonio…) que se agregan a la hoja de una vez.
 * Salen agrupados (se mueven juntos; doble clic entra a uno). Los textos son guías para reemplazar y las fotos son marcadores de color.
 * Las coordenadas de cada bloque empiezan en (0, 0); `elementosBloque` lo centra donde se pida.
 */

export type CategoriaBloque = "Comercio" | "Datos y citas" | "Eventos y pasos" | "Estructura";

export type BloquePlantilla = {
  id: string;
  nombre: string;
  categoria: CategoriaBloque;
  descripcion: string;
  w: number;
  h: number;
  elementos: () => Elemento[];
};

const t = (x: number, y: number, w: number, h: number, texto: string, o: Partial<ElementoTexto> = {}): Elemento => ({ tipo: "texto", x, y, w, h, texto, ...o });
const img = (x: number, y: number, w: number, h: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "imagen", x, y, w, h, tono: "ocre", alt: "Foto", ajuste: "cubrir", ...o }) as Elemento;
const forma = (x: number, y: number, w: number, h: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "forma", x, y, w, h, color: "tinta", ...o }) as Elemento;
const icono = (nombre: string, x: number, y: number, w: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "icono", icono: nombre, x, y, w, h: w, color: "terracota", ...o }) as Elemento;

const kicker = (x: number, y: number, w: number, texto: string, o: Partial<ElementoTexto> = {}) =>
  t(x, y, w, 16, texto, { fuente: "sans", tam: 12, peso: 800, mayusculas: true, espaciado: 0.18, color: "terracota", ...o });
const boton = (x: number, y: number, w: number, h: number, texto: string, o: Partial<ElementoTexto> = {}) =>
  t(x, y, w, h, texto, {
    fuente: "sans", peso: 800, tam: 15, alinear: "centro", vertical: "centro", mayusculas: true, espaciado: 0.06, interlineado: 1.1,
    fondo: "terracota", color: "blanco", radio: 6, hover: "subir", boton: true, ...o,
  });

export const BLOQUES: BloquePlantilla[] = [
  {
    id: "producto",
    nombre: "Tarjeta de producto",
    categoria: "Comercio",
    descripcion: "Foto, categoría, nombre, descripción, precio y botón.",
    w: 280,
    h: 408,
    elementos: () => [
      img(0, 0, 280, 220, { alt: "Foto del producto", radio: 8, sombra: "suave", hover: "acercar" }),
      kicker(0, 236, 280, "Categoría"),
      t(0, 256, 280, 30, "Nombre del producto", { fuente: "display", tam: 22, peso: 800, interlineado: 1.1 }),
      t(0, 292, 280, 52, "Una o dos líneas que cuenten qué hace especial a este producto.", { fuente: "serif", tam: 14, color: "tintaSuave", interlineado: 1.35 }),
      t(0, 354, 112, 50, "$000", { fuente: "display", tam: 34, peso: 900, color: "terracota", vertical: "centro", interlineado: 1 }),
      boton(120, 358, 160, 44, "Lo quiero"),
    ],
  },
  {
    id: "cupon",
    nombre: "Cupón de descuento",
    categoria: "Comercio",
    descripcion: "Descuento grande, condiciones y código; con un corte de color a la izquierda.",
    w: 540,
    h: 190,
    elementos: () => [
      forma(0, 0, 540, 190, { color: "blanco", borde: 3, colorBorde: "terracota" }),
      t(0, 0, 170, 190, "20%\nOFF", { fuente: "display", tam: 52, peso: 900, color: "blanco", fondo: "terracota", alinear: "centro", vertical: "centro", interlineado: 1 }),
      kicker(194, 24, 320, "Cupón de descuento"),
      t(194, 46, 320, 62, "En tu primera compra", { fuente: "display", tam: 28, peso: 800, interlineado: 1.1 }),
      t(194, 112, 320, 26, "Código: ACOMDI20", { fuente: "sans", tam: 17, peso: 800, espaciado: 0.08, color: "terracota" }),
      t(194, 144, 330, 34, "Válido hasta el 00/00/0000. Presenta esta revista en el establecimiento.", { fuente: "sans", tam: 11.5, color: "tintaSuave", interlineado: 1.3 }),
    ],
  },
  {
    id: "cifra",
    nombre: "Cifra grande",
    categoria: "Datos y citas",
    descripcion: "Un dato que se lee de lejos, con lo que mide y su fuente.",
    w: 300,
    h: 190,
    elementos: () => [
      t(0, 0, 300, 110, "00 %", { fuente: "display", tam: 96, peso: 900, color: "terracota", alinear: "centro", vertical: "centro", interlineado: 1 }),
      forma(100, 118, 100, 3, { color: "tinta" }),
      t(0, 130, 300, 28, "Qué mide la cifra", { fuente: "sans", tam: 18, peso: 700, alinear: "centro" }),
      t(0, 162, 300, 18, "Fuente y año", { fuente: "sans", tam: 12, color: "tintaSuave", alinear: "centro" }),
    ],
  },
  {
    id: "testimonio",
    nombre: "Testimonio",
    categoria: "Datos y citas",
    descripcion: "Comillas, una cita, y quién la dijo con su foto.",
    w: 560,
    h: 262,
    elementos: () => [
      t(0, 0, 90, 90, "“", { fuente: "display", tam: 120, peso: 900, color: "terracota", interlineado: 1 }),
      t(0, 64, 560, 118, "Escribe aquí lo que dijo la persona sobre tu negocio, en dos o tres líneas.", { fuente: "serif", tam: 24, cursiva: true, interlineado: 1.4 }),
      forma(0, 196, 60, 3, { color: "terracota" }),
      img(0, 208, 54, 54, { tono: "oliva", alt: "Foto de la persona", radio: 27 }),
      t(70, 212, 480, 24, "Nombre y apellido", { fuente: "sans", tam: 16, peso: 800 }),
      t(70, 236, 480, 20, "Cargo o lugar", { fuente: "sans", tam: 13, color: "tintaSuave" }),
    ],
  },
  {
    id: "evento",
    nombre: "Evento con fecha",
    categoria: "Eventos y pasos",
    descripcion: "Calendario con día y mes, título, lugar y hora, más un botón.",
    w: 600,
    h: 150,
    elementos: () => [
      t(0, 0, 120, 100, "15", { fuente: "display", tam: 64, peso: 900, color: "blanco", fondo: "indigo", alinear: "centro", vertical: "centro", interlineado: 1 }),
      t(0, 100, 120, 38, "NOV", { fuente: "sans", tam: 16, peso: 800, espaciado: 0.2, color: "papel", fondo: "tinta", alinear: "centro", vertical: "centro" }),
      kicker(148, 4, 440, "Evento"),
      t(148, 26, 452, 44, "Nombre del evento", { fuente: "display", tam: 32, peso: 800, interlineado: 1.05 }),
      t(148, 76, 452, 24, "Lugar del evento  ·  00:00 h", { fuente: "sans", tam: 16, color: "tintaSuave" }),
      boton(148, 106, 200, 44, "Más información", { fondo: undefined, color: "tinta", borde: 3, colorBorde: "tinta" }),
    ],
  },
  {
    id: "pasos",
    nombre: "Tres pasos",
    categoria: "Eventos y pasos",
    descripcion: "Una línea de tiempo con tres círculos numerados, cada uno con título y texto.",
    w: 700,
    h: 200,
    elementos: () => [
      forma(36, 34, 520, 3, { color: "tinta" }),
      ...[0, 1, 2].flatMap((i): Elemento[] => {
        const x = i * 240;
        return [
          t(x, 0, 72, 72, String(i + 1), { fuente: "display", tam: 34, peso: 900, color: "blanco", fondo: "terracota", radio: 36, alinear: "centro", vertical: "centro", interlineado: 1 }),
          t(x, 88, 220, 28, `Paso ${i + 1}`, { fuente: "display", tam: 22, peso: 800 }),
          t(x, 120, 220, 70, "Explica en una o dos frases qué sucede en este paso.", { fuente: "serif", tam: 14, color: "tintaSuave", interlineado: 1.4 }),
        ];
      }),
    ],
  },
  {
    id: "cta",
    nombre: "Llamada a la acción",
    categoria: "Comercio",
    descripcion: "Una banda de color con titular, frase y botón.",
    w: 700,
    h: 210,
    elementos: () => [
      forma(0, 0, 700, 210, { color: "tinta", radio: 12 }),
      t(40, 32, 620, 50, "¡Anuncia tu negocio aquí!", { fuente: "display", tam: 38, peso: 900, color: "papel", interlineado: 1.05 }),
      t(40, 92, 620, 30, "Llega a los lectores de toda la región con una página como esta.", { fuente: "sans", tam: 18, color: "papel", interlineado: 1.3 }),
      boton(40, 140, 230, 52, "Quiero anunciarme", { tam: 16 }),
    ],
  },
  {
    id: "contacto",
    nombre: "Datos de contacto",
    categoria: "Comercio",
    descripcion: "Dirección, teléfono, horario y sitio web, cada uno con su icono.",
    w: 420,
    h: 190,
    elementos: () =>
      [
        ["map-pin", "Calle y número, colonia, Acámbaro, Gto."],
        ["phone", "000 000 0000"],
        ["clock", "Lunes a sábado · 9:00 a 19:00 h"],
        ["globe", "tusitio.com"],
      ].flatMap(([ic, texto], i): Elemento[] => [
        icono(ic, 0, i * 48, 30),
        t(46, i * 48 + 2, 374, 28, texto, { fuente: "sans", tam: 17, vertical: "centro", interlineado: 1.2 }),
      ]),
  },
  {
    id: "encabezado",
    nombre: "Encabezado de sección",
    categoria: "Estructura",
    descripcion: "Etiqueta de sección, título grande y una línea.",
    w: 688,
    h: 92,
    elementos: () => [
      kicker(0, 0, 688, "Sección", { tam: 13, espaciado: 0.22 }),
      t(0, 20, 688, 58, "Título de la sección", { fuente: "display", tam: 46, peso: 900, interlineado: 1 }),
      forma(0, 86, 688, 3, { color: "tinta" }),
    ],
  },
];

export const CATEGORIAS_BLOQUE: CategoriaBloque[] = ["Comercio", "Datos y citas", "Eventos y pasos", "Estructura"];

const idNuevo = () => Math.random().toString(36).slice(2, 10);

/** Los elementos del bloque, ya con identificadores nuevos, agrupados y centrados en (cx, cy) sin salirse de la hoja. */
export function elementosBloque(id: string, cx = ANCHO_LIENZO / 2, cy = 500): Elemento[] {
  const b = BLOQUES.find((x) => x.id === id) ?? BLOQUES[0];
  const x0 = Math.round(Math.min(Math.max(0, cx - b.w / 2), ANCHO_LIENZO - b.w));
  const y0 = Math.max(0, Math.round(cy - b.h / 2));
  const grupo = idNuevo();
  return b.elementos().map((e) => ({ ...e, x: e.x + x0, y: e.y + y0, id: idNuevo(), grupo }) as Elemento);
}
