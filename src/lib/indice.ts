import { ETIQUETAS_PLANTILLA, type Elemento, type ElementoTexto, type Pagina } from "./esquema";

/**
 * Generador de índice: arma una o más páginas «Contenido» con una fila por página de la edición (número + título, los dos con
 * enlace). Usa identificadores (`ancla`), así que los números salen de `{p:ancla:2}` y los enlaces de `#ancla`: si luego se
 * mueven páginas, el índice sigue bien. A las páginas sin identificador se les pone uno (a partir de su título).
 * Es una función pura: la usa el editor y no toca ninguna edición por sí sola.
 */

const POR_PAGINA = 18; // 2 columnas × 9 filas
const FILAS_POR_COLUMNA = 9;
const PASO = 100;
const ANCLA_INDICE = "indice";

export const slugAncla = (t: string, max = 36) =>
  t
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, max);

const esIndiceGenerado = (p: Pagina) => !!p.ancla && (p.ancla === ANCLA_INDICE || /^indice-\d+$/.test(p.ancla));

const texto = (x: number, y: number, w: number, h: number, t: string, o: Partial<ElementoTexto> = {}): Elemento => ({ tipo: "texto", x, y, w, h, texto: t, ...o });
const linea = (x: number, y: number, w: number, o: Record<string, unknown> = {}): Elemento => ({ tipo: "forma", x, y, w, h: 1, color: "#cbd5e1", ...o }) as Elemento;

function paginaIndice(entradas: { ancla: string; titulo: string }[], parte: number, partes: number, ancla: string, kicker: string, titulo: string): Pagina {
  const els: Elemento[] = [
    texto(56, 52, 688, 18, kicker, { fuente: "sans", tam: 13, color: "terracota", peso: 800, espaciado: 0.22, mayusculas: true }),
    texto(56, 74, 688, 70, partes > 1 ? `${titulo} (${parte}/${partes})` : titulo, { fuente: "display", tam: 56, color: "tinta", interlineado: 1, peso: 900 }),
    { tipo: "forma", x: 56, y: 150, w: 688, h: 3, color: "tinta" } as Elemento,
  ];
  entradas.forEach((e, i) => {
    const col = Math.floor(i / FILAS_POR_COLUMNA);
    const fila = i % FILAS_POR_COLUMNA;
    const x = col === 0 ? 56 : 408;
    const y = 176 + fila * PASO;
    const lineas = Math.min(3, Math.max(1, Math.ceil(e.titulo.length / 22)));
    els.push(
      texto(x, y, 70, 54, `{p:${e.ancla}:2}`, { fuente: "display", tam: 44, color: "terracota", interlineado: 1, peso: 900, enlace: `#${e.ancla}` }),
      texto(x + 74, y + 8, 260, lineas * 27, e.titulo, { fuente: "display", tam: 20, color: "tinta", interlineado: 1.15, peso: 800, enlace: `#${e.ancla}` }),
      linea(x, y + 78, 320),
    );
  });
  els.push(
    { tipo: "forma", x: 56, y: 1050, w: 688, h: 1, color: "#cbd5e1", movil: "ocultar" } as Elemento,
    texto(444, 1062, 300, 18, "{n:2}", { fuente: "sans", tam: 12, color: "tintaSuave", peso: 700, alinear: "derecha", espaciado: 0.14, mayusculas: true, movil: "ocultar" }),
  );
  const conId = els.map((e, i) => ({ ...e, id: `e${i + 1}` }) as Elemento);
  return {
    plantilla: "lienzo",
    transicion: "izquierda",
    titulo,
    seccion: "Contenido",
    ancla,
    enIndice: false,
    fondo: "papel",
    alto: 1100,
    movil: "apilar",
    ordenMovil: conId.filter((e) => e.movil !== "ocultar").map((e) => e.id as string),
    elementos: conId,
  };
}

export type ResultadoIndice = {
  paginas: Pagina[];
  /** Posición (desde 0) de la primera página del índice. */
  posicion: number;
  /** Cuántas páginas de índice se generaron. */
  cantidad: number;
  /** Entradas que salieron (páginas con título que se muestran en el índice). */
  entradas: number;
  /** Cuántas páginas de índice anteriores se sustituyeron (0 si es la primera vez). */
  reemplazadas: number;
  /** Corrige un número de página (desde 1) de antes de generar el índice al que tiene después. */
  numero: (n: number) => number;
};

/**
 * Genera el índice de `paginas`. Si ya hay un índice generado antes (identificador «indice», «indice-2»…) lo sustituye en el mismo
 * lugar; si no, lo inserta después de la primera página (la portada).
 */
export function construirIndice(paginas: Pagina[], opciones: { kicker?: string; titulo?: string } = {}): ResultadoIndice {
  const kicker = opciones.kicker ?? "En este número";
  const titulo = opciones.titulo ?? "Contenido";

  const previas = paginas.map((p, i) => (esIndiceGenerado(p) ? i : -1)).filter((i) => i >= 0);
  const sin = paginas.filter((p) => !esIndiceGenerado(p));
  const posicion = previas.length ? previas[0] : Math.min(1, sin.length);

  // Identificador para cada página que no lo tiene (único en toda la edición).
  const usadas = new Set(sin.map((p) => p.ancla).filter(Boolean) as string[]);
  usadas.add(ANCLA_INDICE);
  const conAncla = sin.map((p, i) => {
    if (p.ancla) return p;
    const base = slugAncla(p.titulo ?? "") || `pagina-${i + 1}`;
    let a = base;
    for (let k = 2; usadas.has(a) || /^indice(-\d+)?$/.test(a); k++) a = `${base}-${k}`;
    usadas.add(a);
    return { ...p, ancla: a };
  });

  // Quedan fuera la portada, los anuncios y cualquier índice (el generado o uno armado a mano, con sección «Contenido»).
  const entradas = conAncla
    .filter((p) => p.enIndice !== false && p.plantilla !== "portada" && p.plantilla !== "indice" && p.seccion !== "Publicidad" && p.seccion !== "Contenido" && !/^portada$/i.test(p.titulo?.trim() ?? "") && !!p.titulo?.trim() && p.titulo !== ETIQUETAS_PLANTILLA[p.plantilla])
    .map((p) => ({ ancla: p.ancla as string, titulo: (p.titulo as string).trim() }));

  const partes = Math.max(1, Math.ceil(entradas.length / POR_PAGINA));
  const nuevas: Pagina[] = [];
  for (let k = 0; k < partes; k++) {
    nuevas.push(paginaIndice(entradas.slice(k * POR_PAGINA, (k + 1) * POR_PAGINA), k + 1, partes, k === 0 ? ANCLA_INDICE : `${ANCLA_INDICE}-${k + 1}`, kicker, titulo));
  }

  const resultado = [...conAncla.slice(0, posicion), ...nuevas, ...conAncla.slice(posicion)];
  const delta = nuevas.length - previas.length;
  const numero = (n: number) => {
    // Páginas que estaban después del bloque viejo de índice (o de la posición de inserción) se desplazan.
    const finViejo = previas.length ? previas[previas.length - 1] + 1 : posicion;
    return n > finViejo ? n + delta : n;
  };
  return { paginas: resultado, posicion, cantidad: nuevas.length, entradas: entradas.length, reemplazadas: previas.length, numero };
}
