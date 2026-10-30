import type { EdicionDatos, Elemento, Pagina } from "./esquema";

/**
 * Cambiar un color por otro (en una página o en toda la edición). Los colores viven dentro de cada elemento: `color`, `colorBorde`
 * y `fondo` (de texto), y `fondo` de la página; también los de los elementos repetidos. Dos colores son el mismo si se escriben
 * igual (sin mayúsculas) — un color de la revista («terracota») y un hexadecimal se tratan como distintos.
 */

const CAMPOS_ELEMENTO = ["color", "colorBorde", "fondo"] as const;
const igual = (a: unknown, b: string) => typeof a === "string" && a.toLowerCase() === b.toLowerCase();

export type Alcance = { tipo: "pagina"; indice: number } | { tipo: "edicion" };

function paginasEnAlcance(datos: EdicionDatos, alcance: Alcance): number[] {
  return alcance.tipo === "pagina" ? [alcance.indice] : datos.paginas.map((_, i) => i);
}

/** Cuántos usos tiene cada color en el alcance (de más a menos usado). */
export function coloresUsados(datos: EdicionDatos, alcance: Alcance): { color: string; usos: number }[] {
  const cuenta = new Map<string, number>();
  const sumar = (c: unknown) => {
    if (typeof c === "string" && c) cuenta.set(c.toLowerCase(), (cuenta.get(c.toLowerCase()) ?? 0) + 1);
  };
  for (const i of paginasEnAlcance(datos, alcance)) {
    const p = datos.paginas[i];
    if (!p || p.plantilla !== "lienzo") continue;
    sumar(p.fondo);
    for (const e of p.elementos ?? []) for (const c of CAMPOS_ELEMENTO) sumar((e as unknown as Record<string, unknown>)[c]);
  }
  if (alcance.tipo === "edicion") for (const e of datos.maestra?.elementos ?? []) for (const c of CAMPOS_ELEMENTO) sumar((e as unknown as Record<string, unknown>)[c]);
  return [...cuenta].map(([color, usos]) => ({ color, usos })).sort((a, b) => b.usos - a.usos);
}

function cambiarElemento(e: Elemento, de: string, a: string): { el: Elemento; n: number } {
  let n = 0;
  const copia = { ...e } as unknown as Record<string, unknown>;
  for (const c of CAMPOS_ELEMENTO) if (igual(copia[c], de)) { copia[c] = a; n++; }
  return { el: n ? (copia as unknown as Elemento) : e, n };
}

/** Devuelve la edición con `de` sustituido por `a` y cuántos lugares cambiaron. No modifica la original. */
export function cambiarColor(datos: EdicionDatos, de: string, a: string, alcance: Alcance): { datos: EdicionDatos; cambios: number } {
  let cambios = 0;
  const paginas: Pagina[] = datos.paginas.map((p, i) => {
    if (!paginasEnAlcance(datos, alcance).includes(i) || p.plantilla !== "lienzo") return p;
    let q = p;
    if (igual(p.fondo, de)) { q = { ...q, fondo: a }; cambios++; }
    if (p.elementos?.length) {
      const els = p.elementos.map((e) => { const r = cambiarElemento(e, de, a); cambios += r.n; return r.el; });
      if (els.some((e, k) => e !== p.elementos![k])) q = { ...q, elementos: els };
    }
    return q;
  });
  let maestra = datos.maestra;
  if (alcance.tipo === "edicion" && maestra?.elementos?.length) {
    const els = maestra.elementos.map((e) => { const r = cambiarElemento(e, de, a); cambios += r.n; return r.el; });
    maestra = { ...maestra, elementos: els };
  }
  return { datos: { ...datos, paginas, ...(maestra ? { maestra } : {}) }, cambios };
}
