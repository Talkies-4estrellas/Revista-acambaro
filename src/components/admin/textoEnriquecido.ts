/**
 * Conversión entre el modelo de la revista (párrafos de tramos con estilo, ver lib/esquema.ts)
 * y el documento JSON del editor TipTap.
 */
import { COLORES, FUENTES, colorCss, fuenteCss, type Fuente, type Parrafo, type Tramo } from "@/lib/esquema";

/* ------------------------------- Colores ------------------------------ */

const compacto = (v: string) => v.trim().toLowerCase().replace(/["'\s]/g, "");

const TOKEN_DE_CSS = new Map<string, string>(COLORES.map((c) => [compacto(colorCss(c, "")), c]));

/** Convierte un color CSS (var(--x), #hex o rgb()) al valor guardado: token de la paleta o hexadecimal. */
export function colorDesdeCss(css: string | null | undefined): string | undefined {
  if (!css) return undefined;
  const v = compacto(css);
  const token = TOKEN_DE_CSS.get(v);
  if (token) return token;
  let hex: string | undefined;
  const h = v.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/);
  if (h) hex = h[1].length === 3 ? `#${[...h[1]].map((c) => c + c).join("")}` : `#${h[1]}`;
  const rgb = v.match(/^rgba?\((\d+),(\d+),(\d+)/);
  if (rgb) hex = `#${[rgb[1], rgb[2], rgb[3]].map((n) => Number(n).toString(16).padStart(2, "0")).join("")}`;
  if (!hex) return undefined;
  return TOKEN_DE_CSS.get(hex) ?? hex;
}
export const colorACss = (c: string | undefined) => (c ? colorCss(c, "") || undefined : undefined);

/* ----------------------------- Tipografías ---------------------------- */

const FUENTE_DE_CSS = new Map<string, Fuente>(FUENTES.map((f) => [compacto(fuenteCss(f)), f]));
export const fuenteDesdeCss = (css: string | null | undefined): Fuente | undefined =>
  css ? FUENTE_DE_CSS.get(compacto(css)) : undefined;

/* ------------------------------- Tamaños ------------------------------ */

/** Los tamaños se muestran en `cqw` (unidades del lienzo / 8) y se guardan en unidades del lienzo. */
export const tamACss = (unidades: number) => `${Math.round((unidades / 8) * 1000) / 1000}cqw`;
export function tamDesdeCss(css: string | null | undefined): number | undefined {
  const m = css?.trim().match(/^([\d.]+)cqw$/);
  return m ? Math.round(Number(m[1]) * 8 * 10) / 10 : undefined;
}

/* ------------------------- Modelo → documento TipTap ------------------ */

type Nodo = { type: string; text?: string; marks?: { type: string; attrs?: Record<string, string> }[]; content?: Nodo[] };

function marcasDe(t: Tramo) {
  const marks: NonNullable<Nodo["marks"]> = [];
  if (t.negrita) marks.push({ type: "bold" });
  if (t.cursiva) marks.push({ type: "italic" });
  if (t.subrayado) marks.push({ type: "underline" });
  if (t.tachado) marks.push({ type: "strike" });
  const attrs: Record<string, string> = {};
  const color = colorACss(t.color);
  const fondo = colorACss(t.fondo);
  if (color) attrs.color = color;
  if (fondo) attrs.backgroundColor = fondo;
  if (t.fuente) attrs.fontFamily = fuenteCss(t.fuente);
  if (t.tam) attrs.fontSize = tamACss(t.tam);
  if (Object.keys(attrs).length) marks.push({ type: "textStyle", attrs });
  return marks.length ? marks : undefined;
}

export function aDocumento(contenido: Parrafo[]) {
  return {
    type: "doc",
    content: (contenido.length ? contenido : [[]]).map((p) => {
      const hijos: Nodo[] = [];
      for (const t of p) {
        const marks = marcasDe(t);
        t.texto.split("\n").forEach((trozo, i) => {
          if (i > 0) hijos.push({ type: "hardBreak" });
          if (trozo) hijos.push({ type: "text", text: trozo, ...(marks ? { marks } : {}) });
        });
      }
      return hijos.length ? { type: "paragraph", content: hijos } : { type: "paragraph" };
    }),
  };
}

/* ------------------------- Documento TipTap → modelo ------------------ */

function tramoDe(texto: string, marks: Nodo["marks"]): Tramo {
  const t: Tramo = { texto };
  for (const m of marks ?? []) {
    if (m.type === "bold") t.negrita = true;
    else if (m.type === "italic") t.cursiva = true;
    else if (m.type === "underline") t.subrayado = true;
    else if (m.type === "strike") t.tachado = true;
    else if (m.type === "textStyle") {
      const color = colorDesdeCss(m.attrs?.color);
      const fondo = colorDesdeCss(m.attrs?.backgroundColor);
      const fuente = fuenteDesdeCss(m.attrs?.fontFamily);
      const tam = tamDesdeCss(m.attrs?.fontSize);
      if (color) t.color = color;
      if (fondo) t.fondo = fondo;
      if (fuente) t.fuente = fuente;
      if (tam) t.tam = tam;
    }
  }
  return t;
}

const formato = (t: Tramo) => JSON.stringify({ ...t, texto: undefined });

/** Une tramos contiguos con el mismo formato. */
function compactar(p: Tramo[]): Tramo[] {
  const salida: Tramo[] = [];
  for (const t of p) {
    const ult = salida[salida.length - 1];
    if (ult && formato(ult) === formato(t)) ult.texto += t.texto;
    else salida.push({ ...t });
  }
  return salida;
}

export function desdeDocumento(doc: unknown): Parrafo[] {
  const raiz = doc as Nodo;
  return (raiz.content ?? []).map((par) => {
    const tramos: Tramo[] = [];
    for (const n of par.content ?? []) {
      if (n.type === "text" && n.text) tramos.push(tramoDe(n.text, n.marks));
      else if (n.type === "hardBreak") tramos.push({ texto: "\n" });
    }
    return compactar(tramos);
  });
}

/* --------------------------- Texto plano ↔ modelo --------------------- */

export const textoPlano = (contenido: Parrafo[]) => contenido.map((p) => p.map((t) => t.texto).join("")).join("\n");

/** Convierte un texto plano con **negrita** y *cursiva* en párrafos con estilo. */
export function desdeTextoPlano(texto: string): Parrafo[] {
  return texto.split("\n").map((linea) => {
    const tramos: Tramo[] = [];
    for (const parte of linea.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)) {
      if (!parte) continue;
      if (/^\*\*[^*]+\*\*$/.test(parte)) tramos.push({ texto: parte.slice(2, -2), negrita: true });
      else if (/^\*[^*]+\*$/.test(parte)) tramos.push({ texto: parte.slice(1, -1), cursiva: true });
      else tramos.push({ texto: parte });
    }
    return compactar(tramos);
  });
}
