import { ErrorAdmin, guardarMedio } from "./admin";

/**
 * Fotos libres de Wikimedia Commons: búsqueda (miniatura, autor, licencia) y descarga a la carpeta de medios de una edición.
 * Solo se ofrecen licencias que permiten reutilizar con crédito (CC0, dominio público, CC BY y CC BY-SA); se descartan NC, ND y «uso justo».
 * Corre solo en el servidor del panel (local).
 */

const API = "https://commons.wikimedia.org/w/api.php";
const UA = { "User-Agent": "RevistaAcambaro/1.0 (panel local de la revista)" };
const EXT_OK = /\.(jpe?g|png|webp)$/i;

export type FotoLibre = { titulo: string; miniatura: string; ancho: number; alto: number; autor: string; licencia: string; pagina: string };

const sinHtml = (t: unknown) =>
  String(t ?? "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

/** ¿La licencia permite reutilizar? */
export function licenciaPermitida(nombre: string): boolean {
  const n = nombre.toLowerCase();
  if (/\b(nc|nd)\b|non-?commercial|no ?derivs|fair use|uso justo|copyrighted/.test(n)) return false;
  return /^cc0|public domain|dominio p|^pd\b|^cc[ -]by(-sa)?\b|attribution/.test(n);
}

type Pagina = { title: string; imageinfo?: { thumburl?: string; url?: string; thumbwidth?: number; thumbheight?: number; descriptionurl?: string; extmetadata?: Record<string, { value?: string }> }[] };

async function consultar(params: Record<string, string>): Promise<Pagina[]> {
  const url = `${API}?${new URLSearchParams({ action: "query", format: "json", origin: "*", ...params })}`;
  const r = await fetch(url, { headers: UA, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  if (!r.ok) throw new ErrorAdmin(`Wikimedia respondió ${r.status}. Intenta de nuevo en un momento.`, 502);
  const j = (await r.json()) as { query?: { pages?: Record<string, Pagina> } };
  return Object.values(j.query?.pages ?? {});
}

const metadatos = (p: Pagina) => {
  const i = p.imageinfo?.[0];
  const m = i?.extmetadata ?? {};
  return { i, autor: sinHtml(m.Artist?.value) || "Autor desconocido", licencia: sinHtml(m.LicenseShortName?.value) };
};

/** Busca fotos (jpg, png, webp) con licencia reutilizable. */
export async function buscarFotosLibres(consulta: string): Promise<FotoLibre[]> {
  const q = consulta.trim().slice(0, 100);
  if (q.length < 2) throw new ErrorAdmin("Escribe al menos 2 letras para buscar.");
  const paginas = await consultar({ generator: "search", gsrnamespace: "6", gsrlimit: "30", gsrsearch: `${q} filetype:bitmap`, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "360" });
  return paginas
    .map((p) => ({ p, ...metadatos(p) }))
    .filter(({ p, i, licencia }) => i?.thumburl && EXT_OK.test(p.title) && licenciaPermitida(licencia))
    .map(({ p, i, autor, licencia }) => ({ titulo: p.title, miniatura: i!.thumburl!, ancho: i!.thumbwidth ?? 0, alto: i!.thumbheight ?? 0, autor, licencia, pagina: i!.descriptionurl ?? "" }));
}

/** Descarga una foto (a 1600 px de ancho como máximo) a la carpeta de la edición. Devuelve la ruta y el crédito listo para ponerlo. */
export async function descargarFotoLibre(titulo: string, edicionId: string): Promise<{ src: string; credito: string }> {
  if (!/^File:[^\n]{3,200}$/.test(titulo) || !EXT_OK.test(titulo)) throw new ErrorAdmin("Esa foto no es válida.");
  const [p] = await consultar({ titles: titulo, prop: "imageinfo", iiprop: "url|extmetadata", iiurlwidth: "1600" });
  const { i, autor, licencia } = p ? metadatos(p) : { i: undefined, autor: "", licencia: "" };
  if (!i) throw new ErrorAdmin("No encontré esa foto en Wikimedia Commons.", 404);
  if (!licenciaPermitida(licencia)) throw new ErrorAdmin(`La licencia «${licencia || "desconocida"}» no permite reutilizar la foto.`, 403);
  const url = i.thumburl || i.url;
  // Solo se descarga de los servidores de archivos de Wikimedia (upload y thumb).
  if (!url || !/^(upload|thumb)\.wikimedia\.org$/.test(new URL(url).hostname)) throw new ErrorAdmin("Dirección de descarga no permitida.", 403);
  const r = await fetch(url, { headers: UA, signal: AbortSignal.timeout(30_000) });
  if (!r.ok) throw new ErrorAdmin(`No se pudo descargar la foto (${r.status}).`, 502);
  const datos = await r.arrayBuffer();
  const nombre = titulo.replace(/^File:/, "").replace(/\.[^.]+$/, "") + (url.match(/\.(jpe?g|png|webp)(?:\?|$)/i)?.[0].replace("?", "") ?? ".jpg");
  const guardado = await guardarMedio(edicionId, new File([datos], nombre));
  return { src: guardado.src, credito: `Foto: ${autor}, ${licencia} (Wikimedia Commons)` };
}
