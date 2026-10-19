/**
 * Referencias a páginas dentro de los textos (sin dependencias del servidor: lo usan el lector y el editor).
 *  · {n} / {n:2}            → número de la propia página (con ceros a la izquierda si se pide);
 *  · {p:ancla} / {p:ancla:2} → número de la página con ese identificador;
 *  · {creditos}              → créditos de todas las imágenes de la edición (campo «Crédito» de cada imagen), separados por «; ».
 */

const RE_REFERENCIA = /\{(?:(n)|p:([\w-]+))(?::(\d))?\}/g;

export const tieneReferencias = (texto: string) => texto.includes("{n") || texto.includes("{p:") || texto.includes("{creditos}");

/**
 * Sustituye las referencias de `texto`. `numeroDe(ancla)` devuelve el número de una página o `undefined` si no existe:
 * en ese caso se escribe `siFalta` (por defecto «—»).
 */
export function resolverTextoReferencias(
  texto: string,
  numeroPropio: number,
  numeroDe: (ancla: string) => number | undefined,
  siFalta = "—",
  creditos = "",
): string {
  if (!tieneReferencias(texto)) return texto;
  return texto.replace(/\{creditos\}/g, creditos).replace(RE_REFERENCIA, (_m, esta: string | undefined, ancla: string | undefined, ceros: string | undefined) => {
    const valor = esta ? numeroPropio : numeroDe(ancla as string);
    if (valor === undefined) return siFalta;
    return ceros ? String(valor).padStart(Number(ceros), "0") : String(valor);
  });
}

/** Mapa identificador → número de página (desde 1) de una lista de páginas. */
export function mapaAnclas(anclas: (string | undefined)[]): Map<string, number> {
  const m = new Map<string, number>();
  anclas.forEach((a, i) => {
    if (a && !m.has(a)) m.set(a, i + 1);
  });
  return m;
}

/** Texto con los créditos de todas las imágenes de las páginas (sin repetir, en orden de aparición). */
export function textoCreditos(paginas: { elementos?: { tipo: string; credito?: string }[] }[]): string {
  const vistos = new Set<string>();
  for (const p of paginas) for (const e of p.elementos ?? []) if (e.tipo === "imagen" && e.credito?.trim()) vistos.add(e.credito.trim().replace(/[.;\s]+$/, ""));
  return [...vistos].join("; ");
}
