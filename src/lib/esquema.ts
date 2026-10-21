/**
 * Esquema de una edición: tipos, listas de opciones y fábricas de elementos nuevos.
 * Sin dependencias del servidor: lo usan tanto el sitio como el panel de administración.
 */
import type { AnimacionEl, Bucle, Hover } from "./animaciones";
import type { Transicion } from "./transiciones";

export const PLANTILLAS = [
  "lienzo",
  "portada",
  "indice",
  "reportaje",
  "galeria",
  "cita",
  "video",
  "libre",
] as const;
export type Plantilla = (typeof PLANTILLAS)[number];

export const TONOS = ["terracota", "ocre", "oliva", "indigo", "tinta"] as const;
export type Tono = (typeof TONOS)[number];

export const ANCHOS = ["columna", "ancho", "completo"] as const;
export type Ancho = (typeof ANCHOS)[number];

export const PROPORCIONES = ["16/9", "16/10", "21/9", "4/3", "1/1", "3/4"] as const;
export type Proporcion = (typeof PROPORCIONES)[number];

export const TIPOS_BLOQUE = [
  "texto",
  "subtitulo",
  "imagen",
  "gif",
  "video",
  "cita",
  "lista",
  "galeria",
  "agenda",
  "separador",
  "suscripcion",
] as const;
export type TipoBloque = (typeof TIPOS_BLOQUE)[number];

/** Formas de un globo de texto sobre una imagen. «tapa» es un parche liso para cubrir el texto original de la imagen. */
export const FORMAS_GLOBO = ["globo", "pensamiento", "recuadro", "sonido", "tapa"] as const;
export type FormaGlobo = (typeof FORMAS_GLOBO)[number];
export const COLAS_GLOBO = ["ninguna", "abajo-izquierda", "abajo-derecha", "arriba-izquierda", "arriba-derecha"] as const;
export type ColaGlobo = (typeof COLAS_GLOBO)[number];

/**
 * Texto escrito encima de una imagen (globos de un cómic, rótulos, traducciones). Se dibuja como vector sobre la foto, así que
 * se ve nítido y escala con la imagen en escritorio y en el celular. Las medidas son porcentajes de la caja de la imagen.
 */
export type Globo = {
  /** Posición y tamaño de la caja, en % de la imagen (0–100). */
  x: number;
  y: number;
  w: number;
  h: number;
  texto: string;
  /** Tamaño de la letra, en % del ancho de la imagen (por defecto 3). */
  tam?: number;
  forma?: FormaGlobo;
  /** Hacia dónde apunta la cola (solo «globo»). */
  cola?: ColaGlobo;
  /** Color del fondo del globo o parche (por defecto, blanco cálido) y del texto. */
  fondo?: string;
  color?: string;
  fuente?: Fuente;
  /** Letras mayúsculas (como en los cómics clásicos). */
  mayusculas?: boolean;
};

/** Imagen o gif. Sin `src` se dibuja una ilustración provisional del color `tono`. */
export type Medio = {
  src?: string;
  alt?: string;
  pie?: string;
  tono?: Tono;
  proporcion?: Proporcion;
  ancho?: Ancho;
};

/** Video: archivo propio (`src`), YouTube o Vimeo. `animado` = bucle mudo tipo gif. */
export type VideoData = {
  src?: string;
  youtube?: string;
  vimeo?: string;
  poster?: string;
  pie?: string;
  animado?: boolean;
  ancho?: Ancho;
};

export type Evento = { dia: string; mes: string; titulo: string; lugar?: string };

/* ------------------------------ Lienzo ------------------------------- */

/** Las páginas "lienzo" se componen colocando elementos libremente sobre una hoja de 800 unidades de ancho. */
export const ANCHO_LIENZO = 800;
export const ALTO_LIENZO = 1100;

/** Las páginas con esta sección son anuncios: no se indexan en el buscador y el editor avisa si hay dos seguidas. */
export const SECCION_PUBLICIDAD = "Publicidad";

/** Números de página (desde 1) que son anuncio y tienen otro anuncio pegado, antes o después. */
export function anunciosSeguidos(paginas: { seccion?: string }[]): number[] {
  const es = (i: number) => paginas[i]?.seccion === SECCION_PUBLICIDAD;
  return paginas.flatMap((_, i) => (es(i) && (es(i - 1) || es(i + 1)) ? [i + 1] : []));
}

export const MODOS_MOVIL = ["escala", "apilar"] as const;
export const VISIBILIDAD_MOVIL = ["mostrar", "ocultar", "solo"] as const;

export const COLORES = [
  "papel",
  "papel2",
  "tinta",
  "tintaSuave",
  "blanco",
  "terracota",
  "ocre",
  "oliva",
  "indigo",
] as const;
export type ColorToken = (typeof COLORES)[number];
/** Un color de la paleta o uno libre en hexadecimal (#rgb, #rrggbb). */
export type Color = string;

const CSS_COLOR: Record<ColorToken, string> = {
  papel: "var(--paper)",
  papel2: "var(--paper-deep)",
  tinta: "var(--ink)",
  tintaSuave: "var(--ink-soft)",
  blanco: "#ffffff",
  terracota: "var(--terracota)",
  ocre: "var(--ocre)",
  oliva: "var(--oliva)",
  indigo: "var(--indigo)",
};
export const ETIQUETAS_COLOR: Record<ColorToken, string> = {
  papel: "Papel",
  papel2: "Papel oscuro",
  tinta: "Tinta",
  tintaSuave: "Tinta suave",
  blanco: "Blanco",
  terracota: "Terracota",
  ocre: "Ocre",
  oliva: "Oliva",
  indigo: "Índigo",
};

export const esColorValido = (c: string) => c in CSS_COLOR || /^#[0-9a-fA-F]{3,8}$/.test(c);
export function colorCss(c: string | undefined, defecto: string): string {
  if (!c || !esColorValido(c)) return defecto;
  return c in CSS_COLOR ? CSS_COLOR[c as ColorToken] : c;
}

export const FUENTES = [
  "display",
  "serif",
  "sans",
  "lora",
  "merriweather",
  "baskerville",
  "cormorant",
  "dmserif",
  "abril",
  "bebas",
  "oswald",
  "montserrat",
  "poppins",
  "raleway",
  "robotoslab",
  "caveat",
  "pacifico",
  "comicneue",
  "plexmono",
] as const;
export type Fuente = (typeof FUENTES)[number];

export const PESOS = [300, 400, 500, 600, 700, 800, 900] as const;
export type Peso = (typeof PESOS)[number];
export const ETIQUETAS_PESO: Record<Peso, string> = {
  300: "Ligera",
  400: "Normal",
  500: "Media",
  600: "Seminegrita",
  700: "Negrita",
  800: "Extra negrita",
  900: "Negra",
};

export type CategoriaFuente = "Serif" | "Sans" | "Titulares" | "Manuscritas" | "Monoespaciada";
export const CATEGORIAS_FUENTE: CategoriaFuente[] = ["Serif", "Sans", "Titulares", "Manuscritas", "Monoespaciada"];

/** Catálogo de tipografías. `pesos` son los grosores realmente disponibles (los demás se simularían mal). */
export const FUENTES_INFO: Record<Fuente, { nombre: string; categoria: CategoriaFuente; pesos: Peso[] }> = {
  display: { nombre: "Playfair Display", categoria: "Serif", pesos: [400, 500, 600, 700, 800, 900] },
  serif: { nombre: "Source Serif", categoria: "Serif", pesos: [300, 400, 500, 600, 700, 800, 900] },
  lora: { nombre: "Lora", categoria: "Serif", pesos: [400, 500, 600, 700] },
  merriweather: { nombre: "Merriweather", categoria: "Serif", pesos: [300, 400, 500, 600, 700, 800, 900] },
  baskerville: { nombre: "Libre Baskerville", categoria: "Serif", pesos: [400, 500, 600, 700] },
  cormorant: { nombre: "Cormorant Garamond", categoria: "Serif", pesos: [300, 400, 500, 600, 700] },
  robotoslab: { nombre: "Roboto Slab", categoria: "Serif", pesos: [300, 400, 500, 600, 700, 800, 900] },
  sans: { nombre: "Inter", categoria: "Sans", pesos: [300, 400, 500, 600, 700, 800, 900] },
  montserrat: { nombre: "Montserrat", categoria: "Sans", pesos: [300, 400, 500, 600, 700, 800, 900] },
  poppins: { nombre: "Poppins", categoria: "Sans", pesos: [300, 400, 500, 600, 700, 800, 900] },
  raleway: { nombre: "Raleway", categoria: "Sans", pesos: [300, 400, 500, 600, 700, 800, 900] },
  dmserif: { nombre: "DM Serif Display", categoria: "Titulares", pesos: [400] },
  abril: { nombre: "Abril Fatface", categoria: "Titulares", pesos: [400] },
  bebas: { nombre: "Bebas Neue", categoria: "Titulares", pesos: [400] },
  oswald: { nombre: "Oswald", categoria: "Titulares", pesos: [300, 400, 500, 600, 700] },
  caveat: { nombre: "Caveat", categoria: "Manuscritas", pesos: [400, 500, 600, 700] },
  pacifico: { nombre: "Pacifico", categoria: "Manuscritas", pesos: [400] },
  comicneue: { nombre: "Comic Neue (cómic)", categoria: "Manuscritas", pesos: [300, 400, 700] },
  plexmono: { nombre: "IBM Plex Mono", categoria: "Monoespaciada", pesos: [400, 500, 600, 700] },
};

/** Valor CSS de `font-family` de una tipografía del catálogo. */
export function fuenteCss(f: Fuente | undefined): string {
  const id: Fuente = f && f in FUENTES_INFO ? f : "serif";
  if (id === "display") return "var(--font-display)";
  if (id === "serif") return "var(--font-serif)";
  if (id === "sans") return "var(--font-sans)";
  return `var(--fuente-${id})`;
}

/** Texto con estilos dentro de una misma caja: párrafos formados por tramos con su propio formato. */
export type Tramo = {
  texto: string;
  negrita?: boolean;
  cursiva?: boolean;
  subrayado?: boolean;
  tachado?: boolean;
  color?: Color;
  /** Resaltado (color de fondo del tramo). */
  fondo?: Color;
  fuente?: Fuente;
  /** Tamaño en unidades del lienzo. */
  tam?: number;
};
export type Parrafo = Tramo[];
export const ALINEACIONES = ["izquierda", "centro", "derecha", "justificado"] as const;
export type Alineacion = (typeof ALINEACIONES)[number];
export const ALINEACIONES_V = ["arriba", "centro", "abajo"] as const;
export type AlineacionV = (typeof ALINEACIONES_V)[number];
export const AJUSTES = ["cubrir", "contener"] as const;
export type Ajuste = (typeof AJUSTES)[number];
export const FORMAS = ["rectangulo", "elipse"] as const;
export type Forma = (typeof FORMAS)[number];

/* ------------------------------ Moldes ------------------------------- */

const pct = (n: number) => `${Math.round(n * 100) / 100}%`;
const poligono = (pts: [number, number][]) => `polygon(${pts.map(([x, y]) => `${pct(x)} ${pct(y)}`).join(", ")})`;

/** Reescala una lista de puntos para que ocupe exactamente la caja (0–100 %). */
function llenar(pts: [number, number][]): [number, number][] {
  const xs = pts.map((p) => p[0]);
  const ys = pts.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return pts.map(([x, y]) => [((x - x0) / (x1 - x0)) * 100, ((y - y0) / (y1 - y0)) * 100]);
}
const estrella = (puntas: number, interior: number) =>
  poligono(
    llenar(
      Array.from({ length: puntas * 2 }, (_, i) => {
        const r = i % 2 === 0 ? 50 : 50 * interior;
        const a = -Math.PI / 2 + (i * Math.PI) / puntas;
        return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as [number, number];
      }),
    ),
  );
const corazon = () =>
  poligono(
    llenar(
      Array.from({ length: 72 }, (_, i) => {
        const t = (i / 72) * Math.PI * 2;
        return [
          16 * Math.sin(t) ** 3,
          -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t)),
        ] as [number, number];
      }),
    ),
  );
/** Círculo con el borde ondulado, como un sello o una pegatina. */
const sello = () =>
  poligono(
    Array.from({ length: 120 }, (_, i) => {
      const a = (i / 120) * Math.PI * 2;
      const r = 47 + 3 * Math.cos(a * 14);
      return [50 + r * Math.cos(a), 50 + r * Math.sin(a)] as [number, number];
    }),
  );
const regular = (lados: number, giro = -Math.PI / 2) =>
  poligono(
    llenar(
      Array.from({ length: lados }, (_, i) => {
        const a = giro + (i * 2 * Math.PI) / lados;
        return [50 + 50 * Math.cos(a), 50 + 50 * Math.sin(a)] as [number, number];
      }),
    ),
  );

/** Moldes (marcos) que recortan una foto, un video o una forma. `css` es el valor de `clip-path`. */
export const MOLDES = {
  circulo: { nombre: "Círculo", css: "circle(closest-side at 50% 50%)" },
  ovalo: { nombre: "Óvalo", css: "ellipse(50% 50% at 50% 50%)" },
  redondeado: { nombre: "Esquinas redondas", css: "inset(0 round 12%)" },
  suave: { nombre: "Muy redondeado", css: "inset(0 round 28%)" },
  pildora: { nombre: "Píldora", css: "inset(0 round 999px)" },
  arco: { nombre: "Arco", css: "inset(0 round 999px 999px 0 0)" },
  cortado: { nombre: "Esquinas cortadas", css: poligono([[10, 0], [90, 0], [100, 10], [100, 90], [90, 100], [10, 100], [0, 90], [0, 10]]) },
  diagonal: { nombre: "Paralelogramo", css: poligono([[18, 0], [100, 0], [82, 100], [0, 100]]) },
  etiqueta: { nombre: "Etiqueta", css: poligono([[0, 0], [100, 0], [86, 50], [100, 100], [0, 100]]) },
  triangulo: { nombre: "Triángulo", css: poligono([[50, 0], [100, 100], [0, 100]]) },
  trianguloInv: { nombre: "Triángulo invertido", css: poligono([[0, 0], [100, 0], [50, 100]]) },
  rombo: { nombre: "Rombo", css: poligono([[50, 0], [100, 50], [50, 100], [0, 50]]) },
  pentagono: { nombre: "Pentágono", css: regular(5) },
  hexagono: { nombre: "Hexágono", css: poligono([[25, 4], [75, 4], [100, 50], [75, 96], [25, 96], [0, 50]]) },
  octagono: { nombre: "Octágono", css: poligono([[30, 0], [70, 0], [100, 30], [100, 70], [70, 100], [30, 100], [0, 70], [0, 30]]) },
  estrella: { nombre: "Estrella", css: estrella(5, 0.4) },
  estrella6: { nombre: "Estrella de 6 puntas", css: estrella(6, 0.5) },
  destello: { nombre: "Destello", css: estrella(8, 0.55) },
  sello: { nombre: "Sello", css: sello() },
  corazon: { nombre: "Corazón", css: corazon() },
  cruz: { nombre: "Cruz", css: poligono([[35, 0], [65, 0], [65, 35], [100, 35], [100, 65], [65, 65], [65, 100], [35, 100], [35, 65], [0, 65], [0, 35], [35, 35]]) },
  flecha: { nombre: "Flecha", css: poligono([[0, 30], [58, 30], [58, 0], [100, 50], [58, 100], [58, 70], [0, 70]]) },
} as const;
export type MoldeId = keyof typeof MOLDES;
export const MOLDES_IDS = Object.keys(MOLDES) as MoldeId[];

/** Estilo CSS que aplica un molde (con el prefijo de Safari antiguo). */
export function estiloMolde(m: MoldeId | undefined): { clipPath?: string; WebkitClipPath?: string } {
  if (!m || !(m in MOLDES)) return {};
  return { clipPath: MOLDES[m].css, WebkitClipPath: MOLDES[m].css };
}

type ElementoBase = {
  id?: string;
  /** Posición de la esquina superior izquierda y tamaño, en unidades del lienzo. */
  x: number;
  y: number;
  w: number;
  h: number;
  /** Grados. */
  rot?: number;
  /** 0 a 1. */
  opacidad?: number;
  /** Número de página de esta edición, "#identificador" de una página (sigue a la página si se mueve) o una dirección https://. */
  enlace?: number | string;
  /** Los elementos con el mismo valor forman un grupo: se seleccionan y mueven juntos. */
  grupo?: string;
  /** Animación de entrada: se reproduce cuando el elemento entra en pantalla. */
  animacion?: AnimacionEl;
  /** Tapa el elemento con este texto hasta que el lector lo toca (p. ej. la respuesta de una trivia). */
  revelar?: string;
  /** Efecto al pasar el cursor por encima (se ve en el sitio publicado y en la vista previa, no al editar). */
  hover?: Hover;
  /** Movimiento continuo (flotar, latir…); se ve en el sitio publicado y en la vista previa. */
  bucle?: Bucle;
  /** Con "apilar" en la página: fuerza mostrar u ocultar este elemento en el celular (si no, se decide solo).
   *  "solo": el elemento existe únicamente en la columna del celular (no se dibuja en la hoja de escritorio). */
  movil?: "mostrar" | "ocultar" | "solo";
  /** Con "apilar": espacio que separa este elemento del anterior en la columna del celular (unidades de la columna, 0–400).
   *  Si falta, se calcula a partir del hueco que tenían en la hoja. */
  espacioMovil?: number;
};

export type ElementoTexto = ElementoBase & {
  tipo: "texto";
  /** Texto plano (y respaldo). Admite **negrita** y *cursiva* si no hay `contenido`. */
  texto: string;
  /** Si existe, es lo que se dibuja (con estilos por tramo) y `texto` es solo su versión plana. */
  contenido?: Parrafo[];
  fuente?: Fuente;
  tam?: number;
  peso?: Peso;
  cursiva?: boolean;
  color?: Color;
  alinear?: Alineacion;
  vertical?: AlineacionV;
  interlineado?: number;
  /** En em (0.05 = 5 %). */
  espaciado?: number;
  mayusculas?: boolean;
  fondo?: Color;
  relleno?: number;
  /** Esquinas redondeadas del bloque de color (un botón en forma de píldora usa un valor alto). */
  radio?: number;
  /** Grosor del borde y su color (un botón «de contorno»). */
  borde?: number;
  colorBorde?: Color;
  /** Este texto es un botón: el revisor avisa si no lleva enlace. */
  boton?: boolean;
};
/** Filtros de color para una imagen (CSS `filter`). */
export const FILTROS_IMAGEN = {
  bn: { nombre: "Blanco y negro", css: "grayscale(1)" },
  sepia: { nombre: "Sepia (foto antigua)", css: "sepia(.85)" },
  calido: { nombre: "Cálido", css: "sepia(.35) saturate(1.3) hue-rotate(-10deg)" },
  frio: { nombre: "Frío", css: "saturate(.9) hue-rotate(15deg) brightness(1.03)" },
  brillante: { nombre: "Más brillante", css: "brightness(1.18) contrast(1.05)" },
  oscuro: { nombre: "Más oscura", css: "brightness(.7)" },
  contraste: { nombre: "Más contraste", css: "contrast(1.3) saturate(1.1)" },
  desenfoque: { nombre: "Desenfocada", css: "blur(0.9cqw)" },
} as const;
export type FiltroImagen = keyof typeof FILTROS_IMAGEN;
export const FILTROS_IMAGEN_IDS = Object.keys(FILTROS_IMAGEN) as FiltroImagen[];

/** Capa translúcida sobre la imagen (por ejemplo, para que un texto encima se lea). */
export const CAPAS_IMAGEN = {
  oscura: { nombre: "Oscura", css: "rgba(0,0,0,.4)" },
  clara: { nombre: "Clara", css: "rgba(255,255,255,.45)" },
  "degradado-abajo": { nombre: "Degradado oscuro abajo", css: "linear-gradient(to top, rgba(0,0,0,.78), rgba(0,0,0,0) 68%)" },
  "degradado-arriba": { nombre: "Degradado oscuro arriba", css: "linear-gradient(to bottom, rgba(0,0,0,.78), rgba(0,0,0,0) 68%)" },
} as const;
export type CapaImagen = keyof typeof CAPAS_IMAGEN;
export const CAPAS_IMAGEN_IDS = Object.keys(CAPAS_IMAGEN) as CapaImagen[];

export const SOMBRAS = {
  suave: { nombre: "Suave", css: "drop-shadow(0 0.8cqw 1.2cqw rgb(0 0 0 / .25))" },
  fuerte: { nombre: "Marcada", css: "drop-shadow(0 1.4cqw 2cqw rgb(0 0 0 / .5))" },
} as const;
export type SombraImagen = keyof typeof SOMBRAS;
export const SOMBRAS_IDS = Object.keys(SOMBRAS) as SombraImagen[];

/** Parallax de una foto: cuánto se amplía (y por tanto cuánto puede desplazarse dentro de su marco) al hacer scroll. */
export const PARALLAX = {
  suave: { nombre: "Suave", escala: 1.12 },
  medio: { nombre: "Medio", escala: 1.22 },
  fuerte: { nombre: "Marcado", escala: 1.35 },
} as const;
export type NivelParallax = keyof typeof PARALLAX;
export const PARALLAX_IDS = Object.keys(PARALLAX) as NivelParallax[];

/** Segunda foto de un comparador «antes y después»: la foto principal (`src`) es el «antes», a la izquierda; esta es el «después». */
export type Comparar = { src: string; alt?: string; antes?: string; despues?: string };

export type ElementoImagen = ElementoBase & {
  tipo: "imagen";
  /** Convierte la imagen en un deslizador «antes y después» con esta segunda foto. */
  comparar?: Comparar;
  /** La foto se mueve más lento que la página al hacer scroll (solo en el sitio publicado y la vista previa). */
  parallax?: NivelParallax;
  /** Filtro de color, capa translúcida, sombra y borde. */
  filtro?: FiltroImagen;
  capa?: CapaImagen;
  sombra?: SombraImagen;
  borde?: number;
  colorBorde?: Color;
  src?: string;
  alt?: string;
  /** Autor y licencia de la imagen. Todos los créditos de la edición se escriben donde un texto ponga {creditos}. */
  credito?: string;
  /** Punto de la imagen que debe quedar a la vista al recortar con «cubrir», en % (0–100; 50 = centro). */
  enfoque?: { x: number; y: number };
  /** Texto escrito sobre la imagen (globos de un cómic, traducciones, rótulos). */
  globos?: Globo[];
  ajuste?: Ajuste;
  radio?: number;
  tono?: Tono;
  /** Marco que recorta la imagen (sustituye a `radio`). */
  molde?: MoldeId;
};
export type ElementoVideo = ElementoBase &
  Omit<VideoData, "ancho"> & {
    tipo: "video";
    radio?: number;
    molde?: MoldeId;
  };
export type ElementoForma = ElementoBase & {
  tipo: "forma";
  forma?: Forma;
  color?: Color;
  borde?: number;
  colorBorde?: Color;
  radio?: number;
  /** Con molde, la forma toma ese contorno (el borde no se dibuja). */
  molde?: MoldeId;
};
/** Icono vectorial del catálogo (ver lib/iconos-datos.ts). */
export type ElementoIcono = ElementoBase & {
  tipo: "icono";
  /** Id del catálogo, p. ej. "map-pin". */
  icono: string;
  color?: Color;
  /** Grosor del trazo (solo iconos de línea). Por defecto 2. */
  trazo?: number;
  alt?: string;
};
export type Elemento = ElementoTexto | ElementoImagen | ElementoVideo | ElementoForma | ElementoIcono;

/** Un grupo de elementos guardado por el usuario («Mis elementos»), con su esquina superior izquierda en (0, 0). */
export type ElementoGuardado = { id: string; nombre: string; creada: string; w: number; h: number; elementos: Elemento[] };

export function elementoIcono(icono: string, cx = ANCHO_LIENZO / 2, cy = 300): Elemento {
  const w = 96;
  return {
    tipo: "icono",
    icono,
    color: "tinta",
    w,
    h: w,
    x: Math.round(Math.min(Math.max(0, cx - w / 2), ANCHO_LIENZO - w)),
    y: Math.max(0, Math.round(cy - w / 2)),
    id: nuevoId(),
  };
}

/** Marco para foto: una imagen provisional ya recortada con el molde (se rellena soltando una foto encima). */
export function elementoMarco(molde: MoldeId, cx = ANCHO_LIENZO / 2, cy = 420): Elemento {
  const w = 300;
  return {
    tipo: "imagen",
    w,
    h: w,
    x: Math.round(Math.min(Math.max(0, cx - w / 2), ANCHO_LIENZO - w)),
    y: Math.max(0, Math.round(cy - w / 2)),
    tono: "ocre",
    alt: "Foto",
    ajuste: "cubrir",
    molde,
    id: nuevoId(),
  };
}

/** Forma de color con el contorno de un molde. */
export function elementoFormaMolde(molde: MoldeId, cx = ANCHO_LIENZO / 2, cy = 420): Elemento {
  const w = 260;
  return {
    tipo: "forma",
    w,
    h: w,
    x: Math.round(Math.min(Math.max(0, cx - w / 2), ANCHO_LIENZO - w)),
    y: Math.max(0, Math.round(cy - w / 2)),
    color: "terracota",
    molde,
    id: nuevoId(),
  };
}

/** Logotipos de la revista (public/brand). Los "claros" son para fondos oscuros. */
export const LOGOS = [
  { id: "logo", nombre: "Logotipo", src: "/brand/logo.svg", ancho: 318.48, alto: 77.1, claro: false },
  { id: "logo-claro", nombre: "Logotipo claro", src: "/brand/logo-claro.svg", ancho: 318.48, alto: 77.1, claro: true },
  { id: "emblema", nombre: "Emblema", src: "/brand/emblema.svg", ancho: 61.52, alto: 61.03, claro: false },
  { id: "emblema-claro", nombre: "Emblema claro", src: "/brand/emblema-claro.svg", ancho: 61.52, alto: 61.03, claro: true },
] as const;
export type LogoId = (typeof LOGOS)[number]["id"];

/** Imagen con el logotipo (o el emblema) de la revista, a un tamaño razonable y centrada en (cx, cy). */
export function elementoLogo(id: LogoId, cx = ANCHO_LIENZO / 2, cy = 140): Elemento {
  const l = LOGOS.find((x) => x.id === id) ?? LOGOS[0];
  const ancho = l.ancho > 100 ? 400 : 200;
  const alto = Math.round((ancho * l.alto) / l.ancho);
  return {
    tipo: "imagen",
    src: l.src,
    alt: l.id.startsWith("logo") ? "ACOM-Di, Revista de Acámbaro" : "Emblema de ACOM-Di",
    ajuste: "contener",
    w: ancho,
    h: alto,
    x: Math.round(Math.min(Math.max(0, cx - ancho / 2), ANCHO_LIENZO - ancho)),
    y: Math.max(0, Math.round(cy - alto / 2)),
    id: nuevoId(),
  };
}

/* ------------------------------ Botones prediseñados ------------------------------ */

export type GrupoBoton = "Básicos" | "Redes y contacto" | "Llamativos";
export type BotonPlantilla = {
  id: string;
  nombre: string;
  grupo: GrupoBoton;
  /** Texto del botón y su estilo; w y h son su tamaño en la hoja. */
  texto: string;
  w: number;
  h: number;
  estilo: Partial<ElementoTexto>;
};

const baseBoton: Partial<ElementoTexto> = { fuente: "sans", peso: 800, tam: 16, alinear: "centro", vertical: "centro", mayusculas: true, espaciado: 0.06, interlineado: 1.1, boton: true };

/** Botones listos para usar: se agregan sin enlace (se lo pones en «Lleva a») y ya traen su efecto al pasar el cursor. */
export const BOTONES: BotonPlantilla[] = [
  { id: "solido", nombre: "Sólido", grupo: "Básicos", texto: "Ver más", w: 200, h: 52, estilo: { fondo: "terracota", color: "blanco", radio: 6, hover: "subir" } },
  { id: "contorno", nombre: "Contorno", grupo: "Básicos", texto: "Ver más", w: 200, h: 52, estilo: { color: "tinta", borde: 3, colorBorde: "tinta", radio: 6, hover: "subir" } },
  { id: "pildora", nombre: "Píldora", grupo: "Básicos", texto: "Conócenos", w: 220, h: 52, estilo: { fondo: "tinta", color: "papel", radio: 60, hover: "acercar" } },
  { id: "flecha", nombre: "Con flecha", grupo: "Básicos", texto: "Leer más →", w: 220, h: 52, estilo: { fondo: "ocre", color: "tinta", radio: 4, hover: "subir" } },
  { id: "enlace", nombre: "Enlace simple", grupo: "Básicos", texto: "Leer la nota →", w: 240, h: 36, estilo: { color: "terracota", mayusculas: false, alinear: "izquierda", tam: 18, espaciado: 0, hover: "acercar" } },
  { id: "whatsapp", nombre: "WhatsApp", grupo: "Redes y contacto", texto: "WhatsApp", w: 220, h: 52, estilo: { fondo: "#25D366", color: "blanco", radio: 60, hover: "subir" } },
  { id: "instagram", nombre: "Instagram", grupo: "Redes y contacto", texto: "Instagram", w: 220, h: 52, estilo: { fondo: "#E1306C", color: "blanco", radio: 60, hover: "subir" } },
  { id: "facebook", nombre: "Facebook", grupo: "Redes y contacto", texto: "Facebook", w: 220, h: 52, estilo: { fondo: "#1877F2", color: "blanco", radio: 60, hover: "subir" } },
  { id: "llamar", nombre: "Llamar ahora", grupo: "Redes y contacto", texto: "Llamar ahora", w: 220, h: 52, estilo: { fondo: "oliva", color: "blanco", radio: 60, hover: "subir" } },
  { id: "mapa", nombre: "Cómo llegar", grupo: "Redes y contacto", texto: "Cómo llegar →", w: 230, h: 52, estilo: { fondo: "indigo", color: "blanco", radio: 6, hover: "subir" } },
  { id: "correo", nombre: "Escríbenos", grupo: "Redes y contacto", texto: "Escríbenos", w: 210, h: 52, estilo: { color: "indigo", borde: 3, colorBorde: "indigo", radio: 6, hover: "brillo" } },
  { id: "grande", nombre: "Oferta (late)", grupo: "Llamativos", texto: "¡Aprovecha la oferta!", w: 420, h: 76, estilo: { fondo: "terracota", color: "blanco", radio: 0, tam: 24, hover: "brillo", bucle: "latir" } },
  { id: "suscribirse", nombre: "Suscríbete (brilla)", grupo: "Llamativos", texto: "Suscríbete", w: 240, h: 56, estilo: { fondo: "tinta", color: "papel", radio: 4, tam: 18, hover: "subir", bucle: "brillar" } },
  { id: "etiqueta", nombre: "Etiqueta «Nuevo»", grupo: "Llamativos", texto: "Nuevo", w: 110, h: 34, estilo: { fondo: "oliva", color: "blanco", radio: 60, tam: 13, boton: false, bucle: "flotar" } },
];

/** Botón nuevo centrado en (cx, cy). */
export function elementoBoton(id: string, cx = ANCHO_LIENZO / 2, cy = 700): Elemento {
  const b = BOTONES.find((x) => x.id === id) ?? BOTONES[0];
  return {
    ...baseBoton,
    ...b.estilo,
    tipo: "texto",
    texto: b.texto,
    w: b.w,
    h: b.h,
    x: Math.round(Math.min(Math.max(0, cx - b.w / 2), ANCHO_LIENZO - b.w)),
    y: Math.max(0, Math.round(cy - b.h / 2)),
    id: nuevoId(),
  } as Elemento;
}

export type PresetElemento = "titular" | "parrafo" | "etiqueta" | "imagen" | "video" | "rectangulo" | "circulo" | "linea";
export const PRESETS: { id: PresetElemento; etiqueta: string }[] = [
  { id: "titular", etiqueta: "Titular" },
  { id: "parrafo", etiqueta: "Párrafo" },
  { id: "etiqueta", etiqueta: "Etiqueta" },
  { id: "imagen", etiqueta: "Imagen" },
  { id: "video", etiqueta: "Video" },
  { id: "rectangulo", etiqueta: "Rectángulo" },
  { id: "circulo", etiqueta: "Círculo" },
  { id: "linea", etiqueta: "Línea" },
];

const nuevoId = () => Math.random().toString(36).slice(2, 10);

/** Elemento nuevo; `x`,`y` son el centro deseado (por defecto, centro horizontal y arriba). */
export function elementoNuevo(preset: PresetElemento, cx = ANCHO_LIENZO / 2, cyDado?: number): Elemento {
  // Altura inicial según el tipo, para que lo recién agregado no tape lo anterior.
  const cyPorDefecto: Record<PresetElemento, number> = {
    etiqueta: 70,
    titular: 190,
    parrafo: 440,
    imagen: 640,
    video: 640,
    rectangulo: 860,
    circulo: 860,
    linea: 330,
  };
  const cy = cyDado ?? cyPorDefecto[preset];
  const en = <T extends { w: number; h: number }>(e: T) => ({
    ...e,
    x: Math.round(Math.min(Math.max(0, cx - e.w / 2), ANCHO_LIENZO - e.w)),
    y: Math.max(0, Math.round(cy - e.h / 2)),
    id: nuevoId(),
  });
  switch (preset) {
    case "titular":
      return en({ tipo: "texto" as const, w: 640, h: 150, texto: "Titular de la página", fuente: "display", tam: 64, peso: 900, color: "tinta", interlineado: 1.05 });
    case "parrafo":
      return en({ tipo: "texto" as const, w: 520, h: 220, texto: "Escribe aquí tu texto. Haz doble clic para editarlo directamente sobre la página.", fuente: "serif", tam: 24, color: "tinta", interlineado: 1.5 });
    case "etiqueta":
      return en({ tipo: "texto" as const, w: 260, h: 36, texto: "SECCIÓN", fuente: "sans", tam: 16, peso: 700, color: "terracota", mayusculas: true, espaciado: 0.18 });
    case "imagen":
      return en({ tipo: "imagen" as const, w: 440, h: 320, tono: "ocre", alt: "Imagen", ajuste: "cubrir" });
    case "video":
      return en({ tipo: "video" as const, w: 600, h: 338 });
    case "rectangulo":
      return en({ tipo: "forma" as const, w: 300, h: 200, forma: "rectangulo", color: "terracota" });
    case "circulo":
      return en({ tipo: "forma" as const, w: 220, h: 220, forma: "elipse", color: "ocre" });
    case "linea":
      return en({ tipo: "forma" as const, w: 400, h: 4, forma: "rectangulo", color: "tinta" });
  }
}

export type Bloque =
  | { tipo: "texto"; parrafos: string[]; capitular?: boolean }
  | { tipo: "subtitulo"; texto: string }
  | ({ tipo: "imagen" } & Medio)
  | ({ tipo: "gif" } & Medio)
  | ({ tipo: "video" } & VideoData)
  | { tipo: "cita"; texto: string; autor?: string }
  | { tipo: "lista"; items: string[]; ordenada?: boolean }
  | { tipo: "galeria"; imagenes: Medio[]; columnas?: 2 | 3 }
  | { tipo: "agenda"; eventos: Evento[] }
  | { tipo: "separador" }
  | { tipo: "suscripcion"; titulo?: string; texto?: string };

export type Destacado = {
  titulo: string;
  seccion?: string;
  pagina: number;
  tono?: Tono;
  imagen?: Medio;
  autor?: string;
  lectura?: number;
};

export type Pagina = {
  plantilla: Plantilla;
  /** Cómo ENTRA esta página al avanzar (al retroceder se invierte). */
  transicion: Transicion;
  titulo?: string;
  /** Identificador corto y único de la página ("editorial", "noticias"…). Permite enlazarla con "#editorial" y escribir
   *  su número en un texto con {p:editorial}; así el índice y los enlaces se corrigen solos si se agregan o mueven páginas. */
  ancla?: string;
  seccion?: string;
  bajada?: string;
  autor?: string;
  lectura?: number;
  fecha?: string;
  tono?: Tono;
  /** false = no aparece en el índice ni en la cinta de la portada. */
  enIndice?: boolean;
  imagen?: Medio;
  video?: VideoData;
  imagenes?: Medio[];
  columnas?: 2 | 3;
  bloques?: Bloque[];
  // portada
  destacados?: Destacado[];
  enlace?: number;
  // índice
  agenda?: Evento[];
  // cita
  texto?: string;
  // lienzo
  fondo?: Color;
  /** Alto de la hoja en unidades (el ancho siempre es 800). */
  alto?: number;
  /** Se dibujan en este orden: el último queda al frente. */
  elementos?: Elemento[];
  /** En pantallas estrechas: "escala" reduce la hoja entera (por defecto); "apilar" coloca los elementos en una columna. */
  movil?: "escala" | "apilar";
  /** Orden manual de la columna del celular: ids de elementos. Los que no estén aquí van al final, por su posición. */
  ordenMovil?: string[];
  /** Guías de alineación del editor (posiciones en unidades de la hoja). No se dibujan en el sitio publicado. */
  guias?: { v?: number[]; h?: number[] };
};

/** Contenido de un archivo de edición (el `id` es el nombre del archivo). */
export type EdicionDatos = {
  numero: string;
  /** AAAA-MM-DD */
  fecha: string;
  tema: string;
  publicada: boolean;
  /**
   * true cuando la edición ya se publicó alguna vez: su `numero` queda fijo y lo conserva aunque se desactive.
   * Lo gestiona el panel (ver lib/numeracion.ts).
   */
  numeroFijo?: boolean;
  /** Publicación programada: AAAA-MM-DDTHH:mm, hora de Ciudad de México. Antes de ese momento la edición no aparece. */
  publicarEn?: string;
  paginas: Pagina[];
};

export type Edicion = EdicionDatos & { id: string };

export const FORMATO_PUBLICAR_EN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/** Milisegundos UTC de `publicarEn` (México central es UTC−6 todo el año), o null si falta o no es válido. */
export function publicarEnMs(publicarEn?: string): number | null {
  if (!publicarEn || !FORMATO_PUBLICAR_EN.test(publicarEn)) return null;
  const ms = Date.parse(`${publicarEn}:00-06:00`);
  return Number.isNaN(ms) ? null : ms;
}

export type EstadoEdicion = "borrador" | "programada" | "publicada";

export function estadoEdicion(ed: { publicada: boolean; publicarEn?: string }, ahora = Date.now()): EstadoEdicion {
  if (!ed.publicada) return "borrador";
  const ms = publicarEnMs(ed.publicarEn);
  return ms !== null && ms > ahora ? "programada" : "publicada";
}

export const ETIQUETAS_PLANTILLA: Record<Plantilla, string> = {
  lienzo: "Página en blanco",
  portada: "Portada",
  indice: "Índice",
  reportaje: "Reportaje",
  galeria: "Galería",
  cita: "Cita",
  video: "Video",
  libre: "Página libre",
};

export const ETIQUETAS_BLOQUE: Record<TipoBloque, string> = {
  texto: "Texto",
  subtitulo: "Subtítulo",
  imagen: "Imagen",
  gif: "Gif",
  video: "Video",
  cita: "Cita",
  lista: "Lista",
  galeria: "Galería de imágenes",
  agenda: "Agenda",
  separador: "Separador",
  suscripcion: "Suscripción",
};

/* ----------------------------- Fábricas ------------------------------ */

export function paginaNueva(plantilla: Plantilla): Pagina {
  const base = { plantilla, transicion: "izquierda" as Transicion };
  switch (plantilla) {
    case "lienzo":
      // Las páginas en blanco nuevas nacen en modo columna para el celular (se puede cambiar a "reducir la hoja").
      return { ...base, titulo: "Página nueva", fondo: "papel", alto: ALTO_LIENZO, movil: "apilar", elementos: [] };
    case "portada":
      return { ...base, titulo: "Título de la portada", bajada: "", tono: "terracota", destacados: [] };
    case "indice":
      return { ...base, titulo: "Índice" };
    case "reportaje":
      return {
        ...base,
        titulo: "Nuevo reportaje",
        seccion: "",
        bajada: "",
        autor: "",
        imagen: { tono: "terracota", alt: "Imagen principal" },
        bloques: [{ tipo: "texto", parrafos: ["Escribe aquí el primer párrafo."] }],
      };
    case "galeria":
      return {
        ...base,
        titulo: "Nueva galería",
        columnas: 2,
        imagenes: [
          { tono: "ocre", alt: "Imagen 1" },
          { tono: "indigo", alt: "Imagen 2" },
        ],
      };
    case "cita":
      return { ...base, texto: "Escribe aquí la cita.", tono: "terracota", enIndice: false };
    case "video":
      return { ...base, titulo: "Nuevo video", video: {}, bloques: [] };
    case "libre":
      return { ...base, titulo: "Nueva página", bloques: [] };
  }
}

export function bloqueNuevo(tipo: TipoBloque): Bloque {
  switch (tipo) {
    case "texto":
      return { tipo, parrafos: [""] };
    case "subtitulo":
      return { tipo, texto: "Subtítulo" };
    case "imagen":
    case "gif":
      return { tipo, alt: "", tono: "ocre" };
    case "video":
      return { tipo };
    case "cita":
      return { tipo, texto: "" };
    case "lista":
      return { tipo, items: [""] };
    case "galeria":
      return { tipo, imagenes: [{ tono: "ocre" }, { tono: "indigo" }], columnas: 2 };
    case "agenda":
      return { tipo, eventos: [{ dia: "", mes: "", titulo: "" }] };
    case "separador":
      return { tipo };
    case "suscripcion":
      return { tipo };
  }
}

/**
 * Quita valores vacíos ("" / null / undefined) y textos vacíos dentro de listas,
 * para que el JSON quede limpio. Conserva objetos y listas vacías.
 */
export function limpiar<T>(valor: T): T {
  if (Array.isArray(valor)) {
    return valor
      .filter((v) => !(typeof v === "string" && v.trim() === ""))
      .map((v) => limpiar(v)) as unknown as T;
  }
  if (valor && typeof valor === "object") {
    const salida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      if (v === "" || v === null || v === undefined) continue;
      if (typeof v === "number" && Number.isNaN(v)) continue;
      salida[k] = limpiar(v);
    }
    return salida as T;
  }
  return valor;
}

/**
 * Copia una página (de una plantilla) para usarla en una edición: todos los elementos reciben ids nuevos y los
 * grupos se renuevan, así la copia es independiente de la original.
 */
export function paginaDesdePlantilla(p: Pagina): Pagina {
  const copia = structuredClone(p) as Pagina;
  if (copia.elementos) {
    const grupos = new Map<string, string>();
    const idNuevo = new Map<string, string>();
    copia.elementos = copia.elementos.map((e) => {
      const nuevo = { ...e, id: nuevoId() } as Elemento;
      if (e.id) idNuevo.set(e.id, nuevo.id!);
      if (e.grupo) {
        if (!grupos.has(e.grupo)) grupos.set(e.grupo, nuevoId());
        nuevo.grupo = grupos.get(e.grupo);
      }
      return nuevo;
    });
    if (copia.ordenMovil) copia.ordenMovil = copia.ordenMovil.map((id) => idNuevo.get(id)).filter((id): id is string => !!id);
  }
  return copia;
}
