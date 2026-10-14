import fs from "node:fs";
import path from "node:path";
import { EFECTOS_IDS } from "./animaciones";
import { ICONOS } from "./iconos-datos";
import { TRANSICIONES, type Transicion } from "./transiciones";
import {
  AJUSTES,
  ALINEACIONES,
  ALINEACIONES_V,
  ANCHOS,
  COLORES,
  ETIQUETAS_PLANTILLA,
  FORMAS,
  FUENTES,
  MODOS_MOVIL,
  MOLDES_IDS,
  PESOS,
  VISIBILIDAD_MOVIL,
  esColorValido,
  estadoEdicion,
  publicarEnMs,
  PLANTILLAS,
  TIPOS_BLOQUE,
  TONOS,
  type Edicion,
  type Pagina,
  type Plantilla,
} from "./esquema";

import { calcularNumeracion, formatoNumero, numeroFijoDe } from "./numeracion";

export * from "./esquema";
export { calcularNumeracion, formatoNumero, numeroFijoDe } from "./numeracion";

/* ------------------------------------------------------------------ */
/* Utilidades                                                          */
/* ------------------------------------------------------------------ */

export const etiqueta = (p: Pagina) => p.titulo ?? ETIQUETAS_PLANTILLA[p.plantilla];
export const tipoPagina = (p: Pagina) => ETIQUETAS_PLANTILLA[p.plantilla];
export const hrefPagina = (ed: Pick<Edicion, "id">, n: number) => `/ediciones/${ed.id}/${n}`;

export function mesAnio(fecha: string) {
  const s = new Intl.DateTimeFormat("es-MX", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T12:00:00Z`));
  return (s.charAt(0).toUpperCase() + s.slice(1)).replace(" de ", " ");
}

export function fechaLarga(fecha: string) {
  return new Intl.DateTimeFormat("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${fecha}T12:00:00Z`));
}

/* ------------------------------------------------------------------ */
/* Validación (los JSON se editan a mano o desde el panel: errores claros) */
/* ------------------------------------------------------------------ */

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === "object" && v !== null && !Array.isArray(v);

function fail(ctx: string, msg: string): never {
  throw new Error(`[ediciones] ${ctx}: ${msg}`);
}

function checkUrl(v: unknown, ctx: string, campo: string) {
  if (v === undefined) return;
  if (typeof v !== "string" || !/^(\/|https?:\/\/)/.test(v))
    fail(ctx, `"${campo}" debe empezar con "/" (archivo en public/) o "https://"`);
}

function checkEnum<T extends string>(v: unknown, valid: readonly T[], ctx: string, campo: string) {
  if (v !== undefined && !valid.includes(v as T))
    fail(ctx, `"${campo}" vale "${String(v)}"; opciones: ${valid.join(", ")}`);
}

function checkMedio(m: unknown, ctx: string) {
  if (!isObj(m)) fail(ctx, "se esperaba un objeto de imagen");
  checkUrl(m.src, ctx, "src");
  checkEnum(m.tono, TONOS, ctx, "tono");
  checkEnum(m.ancho, ANCHOS, ctx, "ancho");
}

function checkVideo(v: unknown, ctx: string) {
  if (!isObj(v)) fail(ctx, "se esperaba un objeto de video");
  checkUrl(v.src, ctx, "src");
  checkUrl(v.poster, ctx, "poster");
  checkEnum(v.ancho, ANCHOS, ctx, "ancho");
  for (const k of ["youtube", "vimeo"] as const) {
    if (v[k] !== undefined && !(typeof v[k] === "string" && /^[\w-]{3,40}$/.test(v[k] as string)))
      fail(ctx, `"${k}" debe ser solo el ID del video (letras, números, - y _)`);
  }
}

function checkBloque(b: unknown, ctx: string) {
  if (!isObj(b) || typeof b.tipo !== "string") fail(ctx, 'cada bloque necesita un "tipo"');
  const c = `${ctx} (bloque "${b.tipo}")`;
  switch (b.tipo) {
    case "texto":
      if (!Array.isArray(b.parrafos) || b.parrafos.some((p) => typeof p !== "string"))
        fail(c, '"parrafos" debe ser una lista de textos');
      break;
    case "subtitulo":
    case "cita":
      if (typeof b.texto !== "string") fail(c, 'falta "texto"');
      break;
    case "imagen":
    case "gif":
      checkMedio(b, c);
      break;
    case "video":
      checkVideo(b, c);
      break;
    case "lista":
      if (!Array.isArray(b.items)) fail(c, 'falta la lista "items"');
      break;
    case "galeria":
      if (!Array.isArray(b.imagenes)) fail(c, 'falta la lista "imagenes"');
      b.imagenes.forEach((m) => checkMedio(m, c));
      break;
    case "agenda":
      if (!Array.isArray(b.eventos)) fail(c, 'falta la lista "eventos"');
      break;
    case "separador":
    case "suscripcion":
      break;
    default:
      fail(
        ctx,
        `tipo de bloque desconocido "${String(b.tipo)}"; opciones: ${TIPOS_BLOQUE.join(", ")}`,
      );
  }
}

function checkColor(v: unknown, ctx: string, campo: string) {
  if (v === undefined) return;
  if (typeof v !== "string" || !esColorValido(v))
    fail(ctx, `"${campo}" vale "${String(v)}"; usa un color de la paleta (${COLORES.join(", ")}) o un hexadecimal como #068562`);
}

function checkNum(v: unknown, ctx: string, campo: string, min = -Infinity, max = Infinity) {
  if (v === undefined) return;
  if (typeof v !== "number" || !Number.isFinite(v) || v < min || v > max)
    fail(ctx, `"${campo}" debe ser un número${min > -Infinity ? ` entre ${min} y ${max}` : ""}`);
}

function checkElemento(e: unknown, ctx: string, total: number) {
  if (!isObj(e) || typeof e.tipo !== "string") fail(ctx, 'cada elemento necesita un "tipo"');
  const c = `${ctx} (elemento "${e.tipo}")`;
  if (!["texto", "imagen", "video", "forma", "icono"].includes(e.tipo))
    fail(c, 'el tipo debe ser "texto", "imagen", "video", "forma" o "icono"');
  if (e.tipo === "icono" && !(typeof e.icono === "string" && e.icono in ICONOS))
    fail(c, `"icono" vale "${String(e.icono)}", que no está en el catálogo (lib/iconos-datos.ts)`);
  checkEnum(e.molde, MOLDES_IDS, c, "molde");
  checkEnum(e.movil, VISIBILIDAD_MOVIL, c, "movil");
  checkNum(e.trazo, c, "trazo", 0.25, 6);
  for (const k of ["x", "y"] as const) {
    if (typeof e[k] !== "number") fail(c, `falta el número "${k}"`);
    checkNum(e[k], c, k, -2000, 6000);
  }
  for (const k of ["w", "h"] as const) {
    if (typeof e[k] !== "number") fail(c, `falta el número "${k}"`);
    checkNum(e[k], c, k, 1, 6000);
  }
  if (e.grupo !== undefined && !(typeof e.grupo === "string" && /^[\w-]{1,40}$/.test(e.grupo)))
    fail(c, '"grupo" debe ser un identificador corto (letras, números, - y _)');
  if (e.animacion !== undefined) {
    if (!isObj(e.animacion)) fail(c, '"animacion" debe ser un objeto con "efecto"');
    checkEnum(e.animacion.efecto, EFECTOS_IDS, c, "animacion.efecto");
    if (e.animacion.efecto === undefined) fail(c, '"animacion" necesita un "efecto"');
    checkNum(e.animacion.duracion, c, "animacion.duracion", 50, 6000);
    checkNum(e.animacion.retraso, c, "animacion.retraso", 0, 20000);
  }
  checkNum(e.rot, c, "rot", -360, 360);
  checkNum(e.opacidad, c, "opacidad", 0, 1);
  if (e.enlace !== undefined) {
    const ok = Number.isInteger(e.enlace)
      ? (e.enlace as number) >= 1 && (e.enlace as number) <= total
      : typeof e.enlace === "string" && /^(https?:\/\/|\/(?!\/))/.test(e.enlace);
    if (!ok) fail(c, `"enlace" debe ser un número de página entre 1 y ${total}, una dirección https:// o una ruta del sitio (ej. "/suscribirse")`);
  }
  checkUrl(e.src, c, "src");
  checkUrl(e.poster, c, "poster");
  checkEnum(e.tono, TONOS, c, "tono");
  checkEnum(e.fuente, FUENTES, c, "fuente");
  checkEnum(e.alinear, ALINEACIONES, c, "alinear");
  checkEnum(e.vertical, ALINEACIONES_V, c, "vertical");
  checkEnum(e.ajuste, AJUSTES, c, "ajuste");
  checkEnum(e.forma, FORMAS, c, "forma");
  checkColor(e.color, c, "color");
  checkColor(e.fondo, c, "fondo");
  checkColor(e.colorBorde, c, "colorBorde");
  checkNum(e.tam, c, "tam", 4, 600);
  checkNum(e.interlineado, c, "interlineado", 0.5, 4);
  checkNum(e.espaciado, c, "espaciado", -0.5, 2);
  checkNum(e.radio, c, "radio", 0, 2000);
  checkNum(e.borde, c, "borde", 0, 200);
  checkNum(e.relleno, c, "relleno", 0, 400);
  if (e.peso !== undefined && !(PESOS as readonly number[]).includes(e.peso as number))
    fail(c, `"peso" debe ser uno de ${PESOS.join(", ")}`);
  if (e.contenido !== undefined) {
    if (e.tipo !== "texto") fail(c, '"contenido" solo existe en los elementos de texto');
    if (!Array.isArray(e.contenido) || e.contenido.length > 300) fail(c, '"contenido" debe ser una lista de párrafos (máx. 300)');
    for (const p of e.contenido) {
      if (!Array.isArray(p) || p.length > 500) fail(c, "cada párrafo de \"contenido\" debe ser una lista de tramos");
      for (const t of p) {
        if (!isObj(t) || typeof t.texto !== "string") fail(c, 'cada tramo necesita un "texto"');
        for (const k of ["negrita", "cursiva", "subrayado", "tachado"] as const)
          if (t[k] !== undefined && typeof t[k] !== "boolean") fail(c, `"${k}" de un tramo debe ser true o false`);
        checkColor(t.color, c, "color del tramo");
        checkColor(t.fondo, c, "fondo del tramo");
        checkEnum(t.fuente, FUENTES, c, "fuente del tramo");
        checkNum(t.tam, c, "tam del tramo", 4, 600);
      }
    }
  }
  if (e.tipo === "video") checkVideo(e, c);
}

export function validarPagina(raw: unknown, ctx: string, total: number): Pagina {
  if (!isObj(raw)) fail(ctx, "la página debe ser un objeto");
  if (!PLANTILLAS.includes(raw.plantilla as Plantilla))
    fail(ctx, `plantilla "${String(raw.plantilla)}" no existe; opciones: ${PLANTILLAS.join(", ")}`);
  const plantilla = raw.plantilla as Plantilla;

  checkEnum(raw.transicion, TRANSICIONES, ctx, "transicion");
  checkEnum(raw.tono, TONOS, ctx, "tono");
  if (raw.imagen !== undefined) checkMedio(raw.imagen, `${ctx} (imagen)`);
  if (raw.video !== undefined) checkVideo(raw.video, `${ctx} (video)`);
  if (raw.imagenes !== undefined) {
    if (!Array.isArray(raw.imagenes)) fail(ctx, '"imagenes" debe ser una lista');
    raw.imagenes.forEach((m) => checkMedio(m, `${ctx} (imagenes)`));
  }
  if (raw.bloques !== undefined) {
    if (!Array.isArray(raw.bloques)) fail(ctx, '"bloques" debe ser una lista');
    raw.bloques.forEach((b) => checkBloque(b, ctx));
  }

  checkColor(raw.fondo, ctx, "fondo");
  checkEnum(raw.movil, MODOS_MOVIL, ctx, "movil");
  if (raw.ordenMovil !== undefined && (!Array.isArray(raw.ordenMovil) || raw.ordenMovil.length > 600 || raw.ordenMovil.some((x) => typeof x !== "string" || x.length > 60)))
    fail(ctx, '"ordenMovil" debe ser una lista de ids de elementos');
  if (raw.guias !== undefined) {
    if (!isObj(raw.guias)) fail(ctx, '"guias" debe ser un objeto con listas "v" y "h"');
    for (const k of ["v", "h"] as const) {
      const g = raw.guias[k];
      if (g === undefined) continue;
      if (!Array.isArray(g) || g.length > 60 || g.some((n) => typeof n !== "number" || !Number.isFinite(n) || n < -2000 || n > 9000))
        fail(ctx, `"guias.${k}" debe ser una lista de hasta 60 números`);
    }
  }
  checkNum(raw.alto, ctx, "alto", 200, 8000);
  if (raw.elementos !== undefined) {
    if (!Array.isArray(raw.elementos)) fail(ctx, '"elementos" debe ser una lista');
    if (raw.elementos.length > 500) fail(ctx, "una página admite hasta 500 elementos");
    raw.elementos.forEach((e) => checkElemento(e, ctx, total));
  }

  const necesita = (campo: string) => {
    if (raw[campo] === undefined || raw[campo] === "") fail(ctx, `la plantilla "${plantilla}" necesita "${campo}"`);
  };
  if (plantilla === "portada" || plantilla === "reportaje" || plantilla === "galeria" || plantilla === "video")
    necesita("titulo");
  if (plantilla === "cita") necesita("texto");
  if (plantilla === "galeria") necesita("imagenes");
  if (plantilla === "video") necesita("video");

  const enRango = (n: unknown, campo: string) => {
    if (!Number.isInteger(n) || (n as number) < 1 || (n as number) > total)
      fail(ctx, `"${campo}" debe ser un número de página entre 1 y ${total}`);
  };
  if (raw.enlace !== undefined) enRango(raw.enlace, "enlace");
  if (raw.destacados !== undefined) {
    if (!Array.isArray(raw.destacados)) fail(ctx, '"destacados" debe ser una lista');
    raw.destacados.forEach((d) => {
      if (!isObj(d) || typeof d.titulo !== "string") fail(ctx, 'cada destacado necesita "titulo"');
      enRango(d.pagina, "destacados[].pagina");
    });
  }

  return { ...(raw as unknown as Pagina), transicion: (raw.transicion as Transicion) ?? "izquierda" };
}

/** Valida el contenido de un archivo de edición. Lanza un error legible si algo está mal. */
export function validarEdicion(raw: unknown, id: string): Edicion {
  const ctx = `Edición "${id}"`;
  if (!isObj(raw)) fail(ctx, "el archivo debe contener un objeto JSON");
  // El número es automático (lib/numeracion.ts): el del archivo es solo una copia y puede faltar.
  if (raw.numero !== undefined && typeof raw.numero !== "string") fail(ctx, '"numero" debe ser texto');
  if (typeof raw.fecha !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.fecha))
    fail(ctx, '"fecha" debe tener formato AAAA-MM-DD');
  if (typeof raw.tema !== "string" || raw.tema === "") fail(ctx, 'falta "tema"');
  if (!Array.isArray(raw.paginas) || raw.paginas.length === 0)
    fail(ctx, '"paginas" debe ser una lista con al menos una página');

  if (raw.publicarEn !== undefined && (typeof raw.publicarEn !== "string" || publicarEnMs(raw.publicarEn) === null))
    fail(ctx, '"publicarEn" debe tener formato AAAA-MM-DDTHH:mm (ej. "2026-10-20T09:00")');

  const total = raw.paginas.length;
  return {
    id,
    numero: (raw.numero as string | undefined) ?? "",
    fecha: raw.fecha,
    tema: raw.tema,
    publicada: raw.publicada !== false,
    ...(raw.publicarEn ? { publicarEn: raw.publicarEn as string } : {}),
    ...(raw.numeroFijo === true ? { numeroFijo: true } : {}),
    paginas: raw.paginas.map((p, i) => validarPagina(p, `${ctx}, página ${i + 1}`, total)),
  };
}

/* ------------------------------------------------------------------ */
/* Lectura                                                             */
/* ------------------------------------------------------------------ */

export const DIR_EDICIONES = path.join(process.cwd(), "content", "ediciones");

/** Todas las ediciones (incluye borradores), de la más reciente a la más antigua. */
export function getEdiciones(): Edicion[] {
  if (!fs.existsSync(DIR_EDICIONES)) return [];
  const todas = fs
    .readdirSync(DIR_EDICIONES)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const id = f.replace(/\.json$/, "");
      return validarEdicion(JSON.parse(fs.readFileSync(path.join(DIR_EDICIONES, f), "utf8")), id);
    });
  // El número lo decide el orden de publicación, no lo escrito en el archivo.
  const numeros = calcularNumeracion(todas.map((e) => ({ id: e.id, fecha: e.fecha, publicada: e.publicada, publicarEn: e.publicarEn, fijo: numeroFijoDe(e) })));
  return todas
    .map((e) => ({ ...e, numero: formatoNumero(numeros.get(e.id)?.numero ?? 0) }))
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
}

export const getEdicion = (id: string) => getEdiciones().find((e) => e.id === id);
/** Ediciones visibles al público ahora mismo: publicadas y cuya hora programada ya llegó. */
export const getPublicadas = () => {
  const ahora = Date.now();
  return getEdiciones().filter((e) => estadoEdicion(e, ahora) === "publicada");
};
export const getUltima = () => getPublicadas()[0];
