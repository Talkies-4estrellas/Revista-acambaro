import { etiqueta, getPublicadas, hrefPagina, type Edicion, type Pagina } from "./ediciones";

/**
 * Búsqueda en el sitio: recorre el texto de todas las páginas de las ediciones publicadas (títulos, textos de
 * las páginas en blanco, bloques, agenda, pies de foto…). Ignora mayúsculas y acentos.
 */

export type Resultado = {
  edicionId: string;
  numero: string;
  tema: string;
  pagina: number;
  titulo: string;
  href: string;
  /** Fragmento de texto donde aparece lo buscado. */
  fragmento: string;
  puntos: number;
};

/** Minúsculas y sin acentos, conservando la longitud (para poder localizar el fragmento en el original). */
export const normalizar = (s: string) =>
  s
    .replace(/[À-ſ]/g, (c) => c.normalize("NFD").replace(/[̀-ͯ]/g, "") || c)
    .toLowerCase();

const limpiar = (s: string) => s.replace(/\*\*|\*|_{2}/g, "").replace(/\s+/g, " ").trim();

/** Todos los textos de una página, el primero es el que más pesa (el título). */
function textosDePagina(p: Pagina): { texto: string; peso: number }[] {
  const t: { texto: string; peso: number }[] = [];
  const add = (s: string | undefined, peso = 1) => {
    if (s && s.trim()) t.push({ texto: limpiar(s), peso });
  };
  add(p.titulo, 10);
  add(p.seccion, 4);
  add(p.bajada, 3);
  add(p.autor, 2);
  add(p.texto, 2);
  p.destacados?.forEach((d) => {
    add(d.titulo, 3);
    add(d.seccion, 1);
  });
  p.agenda?.forEach((e) => {
    add(e.titulo, 2);
    add(e.lugar, 1);
  });
  add(p.imagen?.alt, 1);
  add(p.imagen?.pie, 1);
  p.imagenes?.forEach((m) => {
    add(m.alt, 1);
    add(m.pie, 1);
  });
  p.bloques?.forEach((b) => {
    switch (b.tipo) {
      case "texto":
        b.parrafos.forEach((x) => add(x, 1));
        break;
      case "subtitulo":
        add(b.texto, 4);
        break;
      case "cita":
        add(b.texto, 2);
        add(b.autor, 1);
        break;
      case "lista":
        b.items.forEach((x) => add(x, 1));
        break;
      case "galeria":
        b.imagenes.forEach((m) => {
          add(m.alt, 1);
          add(m.pie, 1);
        });
        break;
      case "agenda":
        b.eventos.forEach((e) => {
          add(e.titulo, 2);
          add(e.lugar, 1);
        });
        break;
      case "imagen":
      case "gif":
        add(b.alt, 1);
        add(b.pie, 1);
        break;
      case "video":
        add(b.pie, 1);
        break;
      case "suscripcion":
        add(b.titulo, 1);
        add(b.texto, 1);
        break;
    }
  });
  p.elementos?.forEach((e) => {
    if (e.tipo === "texto") add(e.texto, e.tam && e.tam >= 40 ? 4 : 1);
    else if (e.tipo === "imagen" || e.tipo === "icono") add(e.alt, 1);
  });
  return t;
}

function fragmentoAlrededor(texto: string, pos: number, largo: number) {
  const ini = Math.max(0, pos - 70);
  const fin = Math.min(texto.length, pos + largo + 110);
  return `${ini > 0 ? "…" : ""}${texto.slice(ini, fin)}${fin < texto.length ? "…" : ""}`;
}

/** Busca todas las palabras de `consulta` (en cualquier orden) dentro de cada página. */
export function buscar(consulta: string, ediciones: Edicion[] = getPublicadas(), max = 40): Resultado[] {
  const palabras = normalizar(consulta).split(/\s+/).filter((w) => w.length >= 2).slice(0, 6);
  if (palabras.length === 0) return [];

  const salida: Resultado[] = [];
  for (const ed of ediciones) {
    ed.paginas.forEach((p, i) => {
      const textos = textosDePagina(p).map((x) => ({ ...x, norm: normalizar(x.texto) }));
      const todo = textos.map((x) => x.norm).join(" \n ");
      if (!palabras.every((w) => todo.includes(w))) return;

      let puntos = 0;
      for (const w of palabras) for (const x of textos) if (x.norm.includes(w)) puntos += x.peso;
      // Mejor el texto que contiene más palabras a la vez; si no hay, el primero que contiene la primera.
      const mejor =
        textos.find((x) => palabras.every((w) => x.norm.includes(w))) ?? textos.find((x) => x.norm.includes(palabras[0])) ?? textos[0];
      const pos = Math.max(0, mejor.norm.indexOf(palabras[0]));
      salida.push({
        edicionId: ed.id,
        numero: ed.numero,
        tema: ed.tema,
        pagina: i + 1,
        titulo: etiqueta(p),
        href: hrefPagina(ed, i + 1),
        fragmento: fragmentoAlrededor(mejor.texto, pos, palabras[0].length),
        puntos,
      });
    });
  }
  // Más puntos primero; a igualdad, la edición más reciente.
  return salida.sort((a, b) => b.puntos - a.puntos || b.numero.localeCompare(a.numero) || a.pagina - b.pagina).slice(0, max);
}

/** Divide un fragmento en partes para resaltar las palabras buscadas (sin HTML: lo pinta React). */
export function partirResaltado(fragmento: string, consulta: string): { texto: string; resaltar: boolean }[] {
  const palabras = normalizar(consulta).split(/\s+/).filter((w) => w.length >= 2);
  const norm = normalizar(fragmento);
  const marcas = new Array<boolean>(fragmento.length).fill(false);
  for (const w of palabras) {
    let i = norm.indexOf(w);
    while (i !== -1) {
      for (let k = i; k < i + w.length; k++) marcas[k] = true;
      i = norm.indexOf(w, i + w.length);
    }
  }
  const partes: { texto: string; resaltar: boolean }[] = [];
  for (let i = 0; i < fragmento.length; i++) {
    const ultimo = partes[partes.length - 1];
    if (ultimo && ultimo.resaltar === marcas[i]) ultimo.texto += fragmento[i];
    else partes.push({ texto: fragmento[i], resaltar: marcas[i] });
  }
  return partes;
}
