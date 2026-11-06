import type { Elemento } from "./ediciones";

/**
 * Tamaños adaptados de las fotos: el archivo original se queda intacto y el optimizador de Next (/_next/image) entrega una copia WebP del
 * ancho que necesita cada pantalla, y la guarda en caché. En `src` sigue yendo el original, para navegadores sin srcset.
 * Los anchos deben estar en la lista de Next (deviceSizes e imageSizes); la calidad 75 es la que acepta por defecto.
 */
const ANCHOS = [384, 640, 828, 1200, 1920];

export function srcsetMedia(src?: string): string | undefined {
  if (!src || !/^\/media\/.+\.(jpe?g|png|webp)$/i.test(src)) return undefined;
  return ANCHOS.map((w) => `/_next/image?url=${encodeURIComponent(src)}&w=${w}&q=75 ${w}w`).join(", ");
}

type Foto = { w: number; h: number; ajuste?: string; zoom?: number };

const ANCHO_HOJA = 800;
const redondo = (n: number) => Math.ceil(n * 10) / 10;

/** Cuánto más ancha que su caja se dibuja la foto: con «cubrir» en una caja alta se escala por la altura (se supone una foto 3:2), y el zoom la agranda. */
function factor(foto: Foto) {
  const cubrir = foto.ajuste === "contener" ? 1 : Math.max(1, (foto.h / foto.w) * 1.5);
  return cubrir * Math.max(1, foto.zoom ?? 1);
}

/** Atributo `sizes` de una foto en la hoja de 800 unidades, que se dibuja a todo el ancho hasta 900 px. */
export function tamanosHoja(foto: Foto) {
  const f = Math.min(1, (foto.w / ANCHO_HOJA) * factor(foto));
  return `(max-width: 900px) ${redondo(f * 100)}vw, ${Math.ceil(f * 900)}px`;
}

/** Igual, en la miniatura de una portada o tarjeta (hasta unos 62 % de la pantalla del celular o 384 px). */
export function tamanosMiniatura(foto: Foto) {
  const f = Math.min(1, (foto.w / ANCHO_HOJA) * factor(foto));
  return `(max-width: 639px) ${redondo(f * 62)}vw, ${Math.ceil(f * 384)}px`;
}

/** Igual, en la columna del celular, donde la foto ocupa `ancho` % de la pantalla. */
export const tamanosColumna = (foto: Foto, ancho: number) => `${redondo(Math.min(100, ancho * factor(foto)))}vw`;

const fotos = (elementos: Elemento[] = []) =>
  elementos.filter((e): e is Extract<Elemento, { tipo: "imagen" }> => e.tipo === "imagen" && !e.oculto && !!srcsetMedia(e.src)).sort((a, b) => b.w * b.h - a.w * a.h);

/** La foto más grande que se ve al abrir la página: es la que conviene precargar. */
export const fotoDestacada = (elementos?: Elemento[]) => fotos(elementos).find((e) => !e.comparar && e.y < 700 && e.movil !== "ocultar");

/** La foto que representa a una página en una tarjeta: la más grande, esté donde esté. */
export const fotoDeTarjeta = (elementos?: Elemento[]) => fotos(elementos)[0];
