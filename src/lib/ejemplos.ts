import type { Elemento } from "./esquema";
import { PLANTILLAS_BASE } from "./plantillas-base";
import { PLANTILLAS_EXTRA } from "./plantillas-extra";
import { PLANTILLAS_ANUNCIO } from "./plantillas-anuncio";
import { PLANTILLAS_COLLAGE, PLANTILLAS_EDITORIAL } from "./plantillas-editorial";

/**
 * Detecta lo que quedó «de ejemplo» al usar una plantilla: textos idénticos a los de las plantillas integradas y fotos sin
 * archivo (el bloque de color que ocupa su lugar). No cambia los datos: el editor lo resalta sobre la hoja y la revisión lo cuenta,
 * y deja de marcarse solo en cuanto el texto se edita o la foto se reemplaza.
 */

const normal = (t: string) => t.replace(/\s+/g, " ").trim().toLowerCase();

/** Los textos muy cortos («HISTORIA», «N.º») suelen quedarse tal cual a propósito: no se marcan. */
const MIN_LARGO = 12;

/** Palabras de relleno que delatan un rótulo en mayúsculas que todavía no se escribió («NOMBRE DE LA REVISTA», «CATEGORÍA»…). */
const RELLENO_ROTULO = /\b(NOMBRE|SECCI[OÓ]N|CATEGOR[IÍ]A|ETIQUETA|MES|AÑO|T[IÍ]TULO|LOCALIDAD|FUENTE|APELLIDO)\b/;

/** Un rótulo de sección en mayúsculas («CARTA DEL EDITOR», «PARA VISITAR») suele quedarse como está a propósito: no cuenta como ejemplo. */
function esRotuloValido(texto: string): boolean {
  const t = texto.trim();
  return t === t.toUpperCase() && /[A-ZÁÉÍÓÚÑ]{3}/.test(t) && !/\d/.test(t) && !RELLENO_ROTULO.test(t);
}

let textos: Set<string> | null = null;

function textosDePlantillas(): Set<string> {
  if (textos) return textos;
  textos = new Set();
  for (const p of [...PLANTILLAS_BASE, ...PLANTILLAS_EXTRA, ...PLANTILLAS_ANUNCIO, ...PLANTILLAS_COLLAGE, ...PLANTILLAS_EDITORIAL]) {
    for (const e of p.pagina.elementos ?? []) if (e.tipo === "texto" && normal(e.texto).length >= MIN_LARGO && !esRotuloValido(e.texto)) textos.add(normal(e.texto));
  }
  return textos;
}

let altsEjemplo: Set<string> | null = null;

/** ¿Es la descripción que traen de fábrica las fotos de las plantillas («Foto principal», «Foto del lugar»…)? Tras poner una foto real, describe a otra cosa. */
export function esAltDeEjemplo(alt: string | undefined): boolean {
  if (!alt?.trim()) return false;
  if (!altsEjemplo) {
    altsEjemplo = new Set();
    for (const p of [...PLANTILLAS_BASE, ...PLANTILLAS_EXTRA, ...PLANTILLAS_ANUNCIO, ...PLANTILLAS_COLLAGE, ...PLANTILLAS_EDITORIAL]) {
      for (const e of p.pagina.elementos ?? []) if (e.tipo === "imagen" && !e.src && e.alt?.trim()) altsEjemplo.add(normal(e.alt));
    }
  }
  return altsEjemplo.has(normal(alt));
}

/** Textos de plantilla que son títulos válidos tal cual (no cuentan como ejemplo). */
const TITULOS_VALIDOS = new Set(["con el apoyo de"]);

export function esTextoDeEjemplo(texto: string): boolean {
  const n = normal(texto);
  if (TITULOS_VALIDOS.has(n)) return false;
  return n.length >= MIN_LARGO && textosDePlantillas().has(n);
}

/** Qué le falta cambiar a este elemento, si es de ejemplo («texto» o «foto»); undefined si no lo es. */
export function ejemploDe(el: Elemento): "texto" | "foto" | undefined {
  if (el.tipo === "texto") return esTextoDeEjemplo(el.texto) ? "texto" : undefined;
  if (el.tipo === "imagen" && !el.src && !el.comparar) return "foto";
  return undefined;
}
