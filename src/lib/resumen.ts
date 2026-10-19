import type { Elemento, Pagina } from "./esquema";

/**
 * Armar una edición resumida a partir de otra: se eligen páginas (y su orden) y el resultado conserva funcionando
 * el índice, la portada y los enlaces:
 *  · los enlaces a páginas que ya no están se quitan; los de las que sí están se renumeran;
 *  · en una página de índice (filas «número + título» con enlace) se quitan las entradas que ya no existen y las demás se
 *    acomodan sin huecos;
 *  · en las entradas de la portada («P. n», título y frase) que apuntaban a páginas quitadas se pone otra página que sí esté;
 *  · los números escritos como {p:identificador} se corrigen solos (ver lib/ediciones.ts).
 */

export type ResultadoResumen = { paginas: Pagina[]; avisos: string[] };

const slug = (t: string) => t.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40) || "pagina";

type Texto = Extract<Elemento, { tipo: "texto" }>;
const esTexto = (e: Elemento): e is Texto => e.tipo === "texto";
const RE_NUM = /^(?:\d{1,2}|\{p:[\w-]+(?::\d)?\})$/;

export function construirResumen(origen: Pagina[], seleccion: number[]): ResultadoResumen {
  const avisos: string[] = [];
  const orden = [...new Set(seleccion)].filter((i) => Number.isInteger(i) && i >= 0 && i < origen.length);
  if (orden.length === 0) throw new Error("Elige al menos una página.");
  const incluida = new Set(orden);
  const nuevoIndice = new Map(orden.map((o, n) => [o, n]));
  const paginas: Pagina[] = orden.map((i) => structuredClone(origen[i]));

  /** Índice (en la edición de origen) de la página a la que apunta un enlace, o -1 si no es un enlace a página. */
  const destino = (enlace: unknown): number => {
    if (typeof enlace === "number") return enlace - 1;
    if (typeof enlace === "string" && enlace.startsWith("#")) return origen.findIndex((p) => p.ancla === enlace.slice(1));
    return -1;
  };
  const esEnlacePagina = (enlace: unknown) => typeof enlace === "number" || (typeof enlace === "string" && enlace.startsWith("#"));

  /* 1) Páginas de índice: filas «número + título» */
  paginas.forEach((p) => {
    const els = p.elementos ?? [];
    const nums = els.filter((e): e is Texto => esTexto(e) && e.enlace !== undefined && esEnlacePagina(e.enlace) && RE_NUM.test(e.texto));
    const titDe = (n: Texto) => els.find((e): e is Texto => esTexto(e) && e !== n && Math.abs(e.x - (n.x + 74)) < 3 && Math.abs(e.y - (n.y + 8)) <= 4);
    const filas = nums.map((n) => ({ n, t: titDe(n) })).filter((f): f is { n: Texto; t: Texto } => !!f.t);
    if (filas.length < 4) return; // no parece un índice
    const ordenadas = [...filas].sort((a, b) => (a.n.x < 300 ? 0 : 1) - (b.n.x < 300 ? 0 : 1) || a.n.y - b.n.y);
    const huecos = ordenadas.map((f) => ({ nx: f.n.x, ny: f.n.y, tx: f.t.x, ty: f.t.y }));
    const columnasX = [...new Set(ordenadas.map((f) => f.n.x))];
    const quedan = ordenadas.filter((f) => incluida.has(destino(f.n.enlace)));
    const quitadas = ordenadas.length - quedan.length;
    if (quitadas === 0) return;
    const borrar = new Set<Elemento>();
    ordenadas.filter((f) => !quedan.includes(f)).forEach((f) => (borrar.add(f.n), borrar.add(f.t)));
    quedan.forEach((f, k) => {
      const h = huecos[k];
      f.n.x = h.nx; f.n.y = h.ny; f.t.x = h.tx; f.t.y = h.ty;
    });
    // Separadores: una línea fina por fila; se conservan tantas como filas queden en cada columna
    const usadasPorColumna = new Map<number, number>();
    quedan.forEach((f) => usadasPorColumna.set(f.n.x, (usadasPorColumna.get(f.n.x) ?? 0) + 1));
    for (const cx of columnasX) {
      const lineas = els.filter((e) => e.tipo === "forma" && e.h === 1 && e.x === cx && e.w >= 300 && e.w <= 340).sort((a, b) => a.y - b.y);
      lineas.slice(usadasPorColumna.get(cx) ?? 0).forEach((l) => borrar.add(l));
    }
    p.elementos = els.filter((e) => !borrar.has(e));
    avisos.push(`Índice (página «${p.titulo ?? "sin título"}»): se quitaron ${quitadas} entrada(s) de páginas que ya no están.`);
  });

  /* 2) Portada: entradas «P. n · título · frase» */
  const usadas = new Set<string>();
  const candidatas = paginas
    .map((p, n) => ({ p, n }))
    .filter(({ p, n }) => n > 1 && p.seccion !== "Publicidad" && p.titulo && p.titulo !== "Contenido" && p.titulo !== "Créditos");
  paginas.slice(0, 1).forEach((p) => {
    const els = p.elementos ?? [];
    const rotulos = els.filter((e): e is Texto => esTexto(e) && /^P\. /.test(e.texto) && e.enlace !== undefined && esEnlacePagina(e.enlace));
    if (!rotulos.length) return;
    rotulos.forEach((r) => {
      const d = destino(r.enlace);
      if (incluida.has(d)) usadas.add(origen[d].ancla ?? origen[d].titulo ?? "");
    });
    const borrar = new Set<Elemento>();
    rotulos.forEach((r) => {
      const grupo = els.filter((e): e is Texto => esTexto(e) && Math.abs(e.x - r.x) < 3 && e.y >= r.y && e.y <= r.y + 140);
      if (incluida.has(destino(r.enlace))) return;
      const cand = candidatas.find(({ p: c }) => !usadas.has(c.ancla ?? c.titulo ?? ""));
      if (!cand) {
        grupo.forEach((g) => borrar.add(g));
        return;
      }
      usadas.add(cand.p.ancla ?? cand.p.titulo ?? "");
      if (!cand.p.ancla) {
        let s = slug(cand.p.titulo ?? "pagina");
        const existentes = new Set(paginas.map((x) => x.ancla));
        let k = 2;
        while (existentes.has(s)) s = `${slug(cand.p.titulo ?? "pagina")}-${k++}`;
        cand.p.ancla = s;
      }
      const [num, tit, desc] = [r, ...grupo.filter((g) => g !== r).sort((a, b) => a.y - b.y)];
      num.texto = `P. {p:${cand.p.ancla}}`;
      num.enlace = `#${cand.p.ancla}`;
      if (tit) { tit.texto = cand.p.titulo ?? ""; tit.enlace = `#${cand.p.ancla}`; }
      if (desc) { desc.texto = cand.p.seccion ?? ""; desc.enlace = `#${cand.p.ancla}`; }
      avisos.push(`Portada: la entrada que apuntaba a una página quitada ahora apunta a «${cand.p.titulo}».`);
    });
    p.elementos = els.filter((e) => !borrar.has(e));
  });

  /* 3) Enlaces restantes: renumerar los que siguen y quitar los que apuntaban a páginas que ya no están */
  let quitados = 0;
  const lugarNuevo = (d: number) => (nuevoIndice.get(d) ?? -1) + 1;
  paginas.forEach((p) => {
    (p.elementos ?? []).forEach((e) => {
      if (e.enlace === undefined || !esEnlacePagina(e.enlace)) return;
      const d = destino(e.enlace);
      if (!incluida.has(d)) {
        delete e.enlace;
        quitados++;
      } else if (typeof e.enlace === "number") e.enlace = lugarNuevo(d);
    });
    if (typeof p.enlace === "number") {
      const d = p.enlace - 1;
      if (incluida.has(d)) p.enlace = lugarNuevo(d);
      else delete p.enlace;
    }
    if (p.destacados) {
      p.destacados = p.destacados.filter((x) => incluida.has(x.pagina - 1)).map((x) => ({ ...x, pagina: lugarNuevo(x.pagina - 1) }));
    }
  });
  if (quitados) avisos.push(`Se quitaron ${quitados} enlace(s) que llevaban a páginas que no están en el resumen.`);

  /* 4) Números {p:identificador} de páginas quitadas → «—» (no pueden resolverse) */
  const anclasFinales = new Set(paginas.map((p) => p.ancla).filter(Boolean));
  let relleno = 0;
  paginas.forEach((p) =>
    (p.elementos ?? []).forEach((e) => {
      if (!esTexto(e)) return;
      const reparar = (t: string) => t.replace(/\{p:([\w-]+)(?::\d)?\}/g, (m, a: string) => (anclasFinales.has(a) ? m : (relleno++, "—")));
      e.texto = reparar(e.texto);
      e.contenido?.forEach((par) => par.forEach((t) => (t.texto = reparar(t.texto))));
    }),
  );
  if (relleno) avisos.push(`${relleno} número(s) de página escritos con {p:…} apuntaban a páginas quitadas y se cambiaron por «—»; revísalos.`);

  return { paginas, avisos };
}
