/**
 * Dónde se usa cada archivo de /media dentro de una edición. Es una función pura (sirve en el servidor, con las ediciones
 * guardadas, y en el editor, con lo que hay en pantalla): busca rutas /media/… en el JSON de cada página, así que cubre
 * fotos, videos, carátulas, «antes y después», globos y cualquier campo futuro que lleve una ruta.
 */
const RE_RUTA = /\/media\/[^"\\\s]+/g;

/** Número de página (desde 1) → rutas de /media que usa. La página 0 son los elementos que se repiten en todas. */
export function usoEnEdicion(ed: { paginas?: unknown[]; maestra?: unknown }): Map<string, number[]> {
  const uso = new Map<string, number[]>();
  const anotar = (texto: string, pagina: number) => {
    for (const ruta of texto.match(RE_RUTA) ?? []) {
      const donde = uso.get(ruta) ?? [];
      if (!donde.includes(pagina)) donde.push(pagina);
      uso.set(ruta, donde);
    }
  };
  (ed.paginas ?? []).forEach((p, i) => anotar(JSON.stringify(p) ?? "", i + 1));
  if (ed.maestra) anotar(JSON.stringify(ed.maestra) ?? "", 0);
  return uso;
}

/** «pág. 3, 7» / «elementos repetidos» a partir de los números de página donde se usa un archivo. */
export function textoUso(paginas: number[]): string {
  const normales = paginas.filter((p) => p > 0).sort((a, b) => a - b);
  const partes = [];
  if (normales.length) partes.push(`${normales.length === 1 ? "pág." : "págs."} ${normales.slice(0, 6).join(", ")}${normales.length > 6 ? "…" : ""}`);
  if (paginas.includes(0)) partes.push("elementos repetidos");
  return partes.join(" + ");
}
