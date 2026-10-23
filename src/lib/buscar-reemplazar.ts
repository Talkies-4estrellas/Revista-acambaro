import type { EdicionDatos, Elemento, Pagina } from "./esquema";

/**
 * Buscar y reemplazar en toda una edición: textos (también los que tienen estilos por tramo), globos sobre imágenes,
 * descripciones (texto alternativo), créditos, enlaces, títulos de página y el tema. Es lógica pura: trabaja sobre los datos
 * de la edición y devuelve datos nuevos; el editor decide cuándo guardarlos.
 */

export type Ambito = "textos" | "enlaces" | "descripciones" | "creditos" | "titulos";
export const AMBITOS: { id: Ambito; nombre: string }[] = [
  { id: "textos", nombre: "Textos" },
  { id: "titulos", nombre: "Títulos de página y tema" },
  { id: "enlaces", nombre: "Enlaces" },
  { id: "descripciones", nombre: "Descripciones de imágenes" },
  { id: "creditos", nombre: "Créditos y fuentes" },
];

export type OpcionesBuscar = {
  buscar: string;
  reemplazo: string;
  /** Distingue mayúsculas de minúsculas. */
  mayusculas: boolean;
  /** Solo palabras completas. */
  palabra: boolean;
  en: Record<Ambito, boolean>;
};

export const OPCIONES_INICIALES: OpcionesBuscar = {
  buscar: "",
  reemplazo: "",
  mayusculas: false,
  palabra: false,
  en: { textos: true, titulos: true, enlaces: true, descripciones: true, creditos: true },
};

/** Un lugar donde aparece lo buscado. `pagina`: número desde 1; 0 = elementos que se repiten en todas las páginas; -1 = datos de la edición. */
export type Coincidencia = {
  clave: string;
  pagina: number;
  ambito: Ambito;
  /** Qué es: «Texto», «Enlace», «Descripción de imagen»… */
  tipo: string;
  veces: number;
  /** Un fragmento alrededor de la primera coincidencia. */
  antes: string;
  encontrado: string;
  despues: string;
};

const escapar = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** La expresión de búsqueda, o null si no hay nada que buscar. */
export function expresion(op: Pick<OpcionesBuscar, "buscar" | "mayusculas" | "palabra">): RegExp | null {
  if (!op.buscar) return null;
  const nucleo = escapar(op.buscar);
  const cuerpo = op.palabra ? `(?<![\\p{L}\\p{N}_])${nucleo}(?![\\p{L}\\p{N}_])` : nucleo;
  return new RegExp(cuerpo, op.mayusculas ? "gu" : "giu");
}

/** Un campo de texto de la edición, con la manera de leerlo y escribirlo en los datos que se le pasaron. */
type Campo = {
  clave: string;
  pagina: number;
  ambito: Ambito;
  tipo: string;
  valor: string;
  escribir: (nuevo: string) => void;
  /** Texto que se vuelve a calcular cuando cambia este campo (el texto plano de un texto con estilos por tramo). */
  despues?: () => void;
};

const textoPlano = (contenido: { texto: string }[][]) => contenido.map((p) => p.map((t) => t.texto).join("")).join("\n");

/** Enlace válido (misma regla que valida el servidor): un reemplazo que lo rompería se omite. */
const ENLACE_VALIDO = /^(https?:\/\/|mailto:[^\s@]+@[^\s@]+$|tel:\+?[\d\s().-]{5,30}$|\/(?!\/)|#[\w-]{1,40}$)/;

function camposDeElementos(elementos: Elemento[] | undefined, pagina: number, prefijo: string, salida: Campo[]) {
  (elementos ?? []).forEach((el, i) => {
    const id = `${prefijo}e${el.id ?? i}`;
    if (el.tipo === "texto") {
      if (el.contenido?.length) {
        el.contenido.forEach((par, pi) =>
          par.forEach((tr, ti) =>
            salida.push({
              clave: `${id}:c${pi}.${ti}`,
              pagina,
              ambito: "textos",
              tipo: "Texto",
              valor: tr.texto,
              escribir: (n) => (tr.texto = n),
              despues: () => (el.texto = textoPlano(el.contenido!)),
            }),
          ),
        );
      } else salida.push({ clave: `${id}:t`, pagina, ambito: "textos", tipo: "Texto", valor: el.texto, escribir: (n) => (el.texto = n) });
    }
    if (typeof el.enlace === "string") salida.push({ clave: `${id}:l`, pagina, ambito: "enlaces", tipo: "Enlace", valor: el.enlace, escribir: (n) => (el.enlace = n) });
    if ((el.tipo === "imagen" || el.tipo === "icono") && el.alt) salida.push({ clave: `${id}:a`, pagina, ambito: "descripciones", tipo: "Descripción de imagen", valor: el.alt, escribir: (n) => (el.alt = n) });
    if (el.tipo === "imagen") {
      if (el.credito) salida.push({ clave: `${id}:k`, pagina, ambito: "creditos", tipo: "Crédito", valor: el.credito, escribir: (n) => (el.credito = n) });
      if (el.comparar?.alt) salida.push({ clave: `${id}:ca`, pagina, ambito: "descripciones", tipo: "Descripción (después)", valor: el.comparar.alt, escribir: (n) => (el.comparar!.alt = n) });
      (el.globos ?? []).forEach((g, gi) => salida.push({ clave: `${id}:g${gi}`, pagina, ambito: "textos", tipo: "Texto sobre imagen", valor: g.texto, escribir: (n) => (g.texto = n) }));
    }
    if (el.dato?.fuente) salida.push({ clave: `${id}:f`, pagina, ambito: "creditos", tipo: "Fuente del dato", valor: el.dato.fuente, escribir: (n) => (el.dato!.fuente = n) });
  });
}

/** Todos los campos de texto de una edición (los datos se leen y, con `escribir`, se modifican en sitio). */
function campos(datos: EdicionDatos): Campo[] {
  const salida: Campo[] = [];
  if (datos.tema) salida.push({ clave: "tema", pagina: -1, ambito: "titulos", tipo: "Tema del número", valor: datos.tema, escribir: (n) => (datos.tema = n) });
  datos.paginas.forEach((p: Pagina, i) => {
    if (p.titulo) salida.push({ clave: `p${i}:titulo`, pagina: i + 1, ambito: "titulos", tipo: "Título de la página", valor: p.titulo, escribir: (n) => (p.titulo = n) });
    camposDeElementos(p.elementos, i + 1, `p${i}:`, salida);
  });
  if (datos.maestra) camposDeElementos(datos.maestra.elementos, 0, "m:", salida);
  return salida;
}

const MARGEN = 28;

/** Dónde aparece lo buscado (un resultado por campo). */
export function buscarEnEdicion(datos: EdicionDatos, op: OpcionesBuscar): Coincidencia[] {
  const re = expresion(op);
  if (!re) return [];
  const resultados: Coincidencia[] = [];
  for (const c of campos(datos)) {
    if (!op.en[c.ambito]) continue;
    const todas = [...c.valor.matchAll(re)];
    if (!todas.length) continue;
    const m = todas[0];
    const ini = m.index ?? 0;
    resultados.push({
      clave: c.clave,
      pagina: c.pagina,
      ambito: c.ambito,
      tipo: c.tipo,
      veces: todas.length,
      antes: (ini > MARGEN ? "…" : "") + c.valor.slice(Math.max(0, ini - MARGEN), ini).replace(/\s+/g, " "),
      encontrado: m[0],
      despues: c.valor.slice(ini + m[0].length, ini + m[0].length + MARGEN).replace(/\s+/g, " ") + (ini + m[0].length + MARGEN < c.valor.length ? "…" : ""),
    });
  }
  return resultados;
}

/**
 * Reemplaza en los campos indicados por `claves` (todos si no se da). Devuelve los datos nuevos (los de entrada no se tocan), cuántos reemplazos
 * se hicieron, en cuántos campos, y cuántos enlaces se omitieron porque el resultado ya no sería un enlace válido.
 */
export function reemplazarEnEdicion(datos: EdicionDatos, op: OpcionesBuscar, claves?: Set<string>): { datos: EdicionDatos; reemplazos: number; campos: number; omitidos: number } {
  const re = expresion(op);
  const copia = structuredClone(datos);
  if (!re) return { datos: copia, reemplazos: 0, campos: 0, omitidos: 0 };
  let reemplazos = 0;
  let cambiados = 0;
  let omitidos = 0;
  const tocados = new Set<() => void>();
  for (const c of campos(copia)) {
    if (!op.en[c.ambito] || (claves && !claves.has(c.clave))) continue;
    const veces = [...c.valor.matchAll(re)].length;
    if (!veces) continue;
    const nuevo = c.valor.replace(re, () => op.reemplazo);
    if (c.ambito === "enlaces" && !ENLACE_VALIDO.test(nuevo)) {
      omitidos++;
      continue;
    }
    c.escribir(nuevo);
    if (c.despues) tocados.add(c.despues);
    reemplazos += veces;
    cambiados++;
  }
  tocados.forEach((f) => f());
  return { datos: copia, reemplazos, campos: cambiados, omitidos };
}
