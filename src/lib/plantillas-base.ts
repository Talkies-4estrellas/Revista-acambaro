import type { Elemento, ElementoTexto, Pagina } from "./esquema";

/**
 * Plantillas iniciales (solo lectura) para las páginas en blanco. Todas usan la hoja de 800 × 1100.
 * Al usarlas se copian a la edición con identificadores nuevos, así que se pueden modificar libremente.
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
  ({ tipo: "imagen", x, y, w, h, tono: "ocre", alt: "Foto", ajuste: "cubrir", ...o }) as Elemento;
const forma = (x: number, y: number, w: number, h: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "forma", x, y, w, h, color: "tinta", ...o }) as Elemento;
const icono = (nombre: string, x: number, y: number, w: number, o: Record<string, unknown> = {}): Elemento =>
  ({ tipo: "icono", icono: nombre, x, y, w, h: w, ...o }) as Elemento;

const lienzo = (titulo: string, elementos: Elemento[], fondo = "papel"): Pagina => ({
  plantilla: "lienzo",
  transicion: "izquierda",
  titulo,
  fondo,
  alto: 1100,
  // Las plantillas iniciales están pensadas para leerse bien en el celular: se apilan en una columna.
  movil: "apilar",
  elementos,
});

export type PlantillaBase = { id: string; nombre: string; descripcion: string; pagina: Pagina };

export const PLANTILLAS_BASE: PlantillaBase[] = [
  {
    id: "base-portada",
    nombre: "Portada de revista",
    descripcion: "Cabecera, foto principal, titular y bajada.",
    pagina: lienzo("Portada", [
      texto(60, 36, 680, 28, "EDICIÓN N.º 00 · MES AÑO", { fuente: "sans", tam: 15, peso: 700, mayusculas: true, espaciado: 0.18, color: "tintaSuave", alinear: "centro", animacion: { efecto: "aparecer" } }),
      forma(60, 74, 680, 3),
      imagen(110, 92, 580, 132, { src: "/brand/logo.svg", alt: "ACOM-Di, Revista de Acámbaro", ajuste: "contener", animacion: { efecto: "zoom", duracion: 900, retraso: 150 } }),
            forma(60, 278, 680, 3),
      imagen(60, 306, 680, 446, { tono: "terracota", alt: "Foto principal", animacion: { efecto: "revelar", duracion: 900, retraso: 450 } }),
      texto(60, 786, 400, 26, "HISTORIA", { fuente: "sans", tam: 14, peso: 700, mayusculas: true, espaciado: 0.18, color: "terracota" }),
      texto(60, 816, 680, 140, "Titular principal de la edición", { fuente: "display", tam: 52, peso: 900, interlineado: 1.05, animacion: { efecto: "subir", retraso: 900 } }),
      texto(60, 966, 620, 100, "Escribe aquí una bajada breve que invite a leer el reportaje de portada.", { fuente: "serif", tam: 20, color: "tintaSuave", interlineado: 1.5 }),
    ]),
  },
  {
    id: "base-reportaje",
    nombre: "Reportaje con foto grande",
    descripcion: "Foto a todo el ancho, titular, firma y texto.",
    pagina: lienzo("Reportaje", [
      imagen(0, 0, 800, 520, { tono: "indigo", alt: "Foto del reportaje" }),
      texto(60, 556, 400, 24, "SECCIÓN", { fuente: "sans", tam: 14, peso: 700, mayusculas: true, espaciado: 0.18, color: "terracota" }),
      texto(60, 586, 680, 130, "Título del reportaje", { fuente: "display", tam: 48, peso: 900, interlineado: 1.05 }),
      texto(60, 724, 680, 24, "Por Nombre Apellido · 8 min de lectura", { fuente: "sans", tam: 14, color: "tintaSuave" }),
      forma(60, 768, 120, 4, { color: "terracota" }),
      texto(
        60,
        796,
        680,
        270,
        "Escribe aquí el primer párrafo del reportaje. Cuenta la escena, presenta a las personas y deja claro por qué importa.\n\nEl segundo párrafo desarrolla la idea con detalles, voces y datos.",
        { fuente: "serif", tam: 20, interlineado: 1.6 },
      ),
    ]),
  },
  {
    id: "base-cita",
    nombre: "Cita destacada",
    descripcion: "Página de color con una frase grande.",
    pagina: lienzo(
      "Cita",
      [
        icono("quote", 336, 150, 128, { color: "papel", trazo: 1.5, opacidad: 0.85, animacion: { efecto: "rebotar", duracion: 800 } }),
        texto(80, 330, 640, 380, "Escribe aquí una frase memorable.", { fuente: "display", tam: 56, peso: 700, cursiva: true, alinear: "centro", vertical: "centro", color: "papel", interlineado: 1.2, animacion: { efecto: "aparecer", duracion: 1000, retraso: 350 } }),
        forma(360, 760, 80, 3, { color: "papel" }),
        texto(100, 790, 600, 30, "NOMBRE · FUENTE", { fuente: "sans", tam: 16, peso: 700, mayusculas: true, espaciado: 0.18, alinear: "centro", color: "papel" }),
      ],
      "terracota",
    ),
  },
  {
    id: "base-galeria",
    nombre: "Galería de 4 fotos",
    descripcion: "Título y cuadrícula de 2 × 2.",
    pagina: lienzo("Galería", [
      texto(60, 50, 680, 90, "Título de la galería", { fuente: "display", tam: 44, peso: 900, interlineado: 1.05 }),
      imagen(60, 170, 330, 330, { tono: "terracota", alt: "Foto 1" }),
      imagen(410, 170, 330, 330, { tono: "indigo", alt: "Foto 2" }),
      imagen(60, 520, 330, 330, { tono: "oliva", alt: "Foto 3" }),
      imagen(410, 520, 330, 330, { tono: "ocre", alt: "Foto 4" }),
      texto(60, 880, 680, 150, "Escribe aquí un pie de foto o una nota breve que acompañe a la galería.", { fuente: "serif", tam: 20, cursiva: true, color: "tintaSuave", interlineado: 1.5 }),
    ]),
  },
  {
    id: "base-marco",
    nombre: "Foto en marco redondo",
    descripcion: "Foto circular con titular y texto centrado.",
    pagina: lienzo("Foto en marco", [
      forma(190, 50, 420, 420, { forma: "elipse", color: "ocre", opacidad: 0.35 }),
      imagen(230, 90, 340, 340, { tono: "terracota", alt: "Foto", molde: "circulo" }),
      texto(60, 500, 680, 110, "Titular de la página", { fuente: "display", tam: 46, peso: 900, alinear: "centro", interlineado: 1.05 }),
      forma(360, 630, 80, 3, { color: "terracota" }),
      texto(110, 660, 580, 260, "Escribe aquí un texto centrado. Funciona bien para presentar a una persona, un lugar o un oficio en pocas líneas.", { fuente: "serif", tam: 22, alinear: "centro", interlineado: 1.6 }),
    ]),
  },
  {
    id: "base-contraportada",
    nombre: "Contraportada con redes",
    descripcion: "Fondo oscuro, marca y enlaces a redes.",
    pagina: lienzo(
      "Contraportada",
      [
        forma(120, 270, 560, 170, { color: "papel", radio: 12 }),
        imagen(150, 290, 500, 130, { src: "/brand/logo.svg", alt: "ACOM-Di, Revista de Acámbaro", ajuste: "contener" }),
        texto(60, 462, 680, 36, "Revista de cultura, sabor y memoria", { fuente: "display", tam: 22, cursiva: true, alinear: "centro", color: "papel", opacidad: 0.8 } as Partial<ElementoTexto>),
        forma(360, 540, 80, 3, { color: "terracota" }),
        texto(100, 580, 600, 30, "SÍGUENOS", { fuente: "sans", tam: 15, peso: 700, mayusculas: true, espaciado: 0.2, alinear: "centro", color: "papel" }),
        icono("instagram", 264, 630, 56, { color: "papel", animacion: { efecto: "subir" } }),
        icono("facebook", 372, 630, 56, { color: "papel", animacion: { efecto: "subir", retraso: 150 } }),
        icono("whatsapp", 480, 630, 56, { color: "papel", animacion: { efecto: "subir", retraso: 300 } }),
        texto(100, 960, 600, 30, "Gracias por leer.", { fuente: "sans", tam: 16, alinear: "centro", color: "papel" }),
      ],
      "tinta",
    ),
  },
];
