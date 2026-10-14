import fs from "node:fs";
import path from "node:path";
import { getPublicadas } from "./ediciones";

/**
 * Clics en enlaces externos de la revista (anuncios, redes, sitios de anunciantes). Se cuentan por elemento
 * y por día en content/clics.json (privado: no está en public/ ni se sube a git).
 * Si defines CLICS_WEBHOOK_URL, cada clic también se envía por POST (JSON) a esa dirección; es lo que hay que
 * usar en un hosting de solo lectura (p. ej. Vercel), donde no se puede escribir el archivo.
 * Solo se cuentan enlaces que existen de verdad en una edición publicada: el servidor los busca, no confía en el cliente.
 */

export type RegistroClics = {
  edicion: string;
  pagina: number;
  elemento: string;
  url: string;
  /** Texto o descripción del elemento, para reconocerlo en el reporte. */
  etiqueta: string;
  /** Verdadero si la página es de la sección "Publicidad". */
  anuncio: boolean;
  total: number;
  /** Clics por día (AAAA-MM-DD, hora UTC). */
  dias: Record<string, number>;
  ultimo: string;
};

const ARCHIVO = path.join(process.cwd(), "content", "clics.json");
const MAX_REGISTROS = 5000;
const MAX_DIAS = 400;
/** Un mismo visitante no suma dos veces el mismo enlace en este lapso (mejor esfuerzo, en memoria). */
const VENTANA_MS = 10 * 60 * 1000;
const recientes = new Map<string, number>();

const clave = (r: { edicion: string; elemento: string; url: string }) => `${r.edicion}|${r.elemento}|${r.url}`;

export function leerClics(): RegistroClics[] {
  if (!fs.existsSync(ARCHIVO)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
    return Array.isArray(raw) ? raw.filter((r) => r && typeof r.edicion === "string" && typeof r.total === "number") : [];
  } catch {
    return [];
  }
}

function escribir(lista: RegistroClics[]) {
  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  const tmp = `${ARCHIVO}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(lista, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, ARCHIVO);
}

/** Busca, en una edición publicada, el elemento con ese id y ese enlace externo. */
function buscarEnlace(edicionId: string, elementoId: string, url: string) {
  const ed = getPublicadas().find((e) => e.id === edicionId);
  if (!ed) return null;
  for (let i = 0; i < ed.paginas.length; i++) {
    const p = ed.paginas[i];
    const el = p.elementos?.find((x) => x.id === elementoId && typeof x.enlace === "string" && x.enlace === url);
    if (el) {
      const etiqueta = el.tipo === "imagen" ? (el.alt ?? "") : el.tipo === "texto" ? el.texto : el.tipo === "icono" ? (el.alt ?? el.icono) : "";
      return { pagina: i + 1, etiqueta: etiqueta.replace(/\s+/g, " ").trim().slice(0, 80), anuncio: p.seccion === "Publicidad" };
    }
  }
  return null;
}

/** Devuelve false si el clic no corresponde a un enlace externo real o es un repetido reciente. */
export async function registrarClic(edicion: unknown, elemento: unknown, url: unknown, visitante: string): Promise<boolean> {
  if (typeof edicion !== "string" || typeof elemento !== "string" || typeof url !== "string") return false;
  if (edicion.length > 40 || elemento.length > 60 || url.length > 2000 || !/^https?:\/\//i.test(url)) return false;
  const hallado = buscarEnlace(edicion, elemento, url);
  if (!hallado) return false;

  const k = clave({ edicion, elemento, url });
  const ahora = Date.now();
  const marca = `${visitante}|${k}`;
  for (const [m, t] of recientes) if (ahora - t > VENTANA_MS) recientes.delete(m);
  if (recientes.has(marca)) return true;
  if (recientes.size < 20_000) recientes.set(marca, ahora);

  const fecha = new Date(ahora).toISOString();
  const dia = fecha.slice(0, 10);

  const webhook = process.env.CLICS_WEBHOOK_URL;
  try {
    const lista = leerClics();
    let r = lista.find((x) => clave(x) === k);
    if (!r) {
      if (lista.length >= MAX_REGISTROS) return true;
      r = { edicion, pagina: hallado.pagina, elemento, url, etiqueta: hallado.etiqueta, anuncio: hallado.anuncio, total: 0, dias: {}, ultimo: fecha };
      lista.push(r);
    }
    r.total += 1;
    r.ultimo = fecha;
    r.pagina = hallado.pagina;
    r.etiqueta = hallado.etiqueta;
    r.anuncio = hallado.anuncio;
    r.dias[dia] = (r.dias[dia] ?? 0) + 1;
    const dias = Object.keys(r.dias).sort();
    for (const d of dias.slice(0, Math.max(0, dias.length - MAX_DIAS))) delete r.dias[d];
    escribir(lista);
  } catch {
    // Hosting de solo lectura: sin webhook el clic simplemente no se guarda.
  }
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ fecha, edicion, pagina: hallado.pagina, elemento, url, etiqueta: hallado.etiqueta, anuncio: hallado.anuncio }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // No se interrumpe la lectura por un fallo del webhook.
    }
  }
  return true;
}

const celdaCsv = (v: string | number) => {
  const s = String(v);
  const seguro = /^[=+\-@\t\r]/.test(s) ? `'${s}` : s;
  return `"${seguro.replace(/"/g, '""')}"`;
};

export function clicsCsv(lista: RegistroClics[]): string {
  const filas = lista.map((r) =>
    [r.edicion, r.pagina, r.anuncio ? "sí" : "no", r.etiqueta, r.url, r.total, r.ultimo].map(celdaCsv).join(","),
  );
  return ["edicion,pagina,anuncio,elemento,url,clics,ultimo_clic", ...filas].join("\r\n") + "\r\n";
}

/** Suma de clics en los últimos `n` días (contando hoy). */
export function clicsRecientes(r: RegistroClics, n: number, ahora = new Date()): number {
  const limite = new Date(ahora.getTime() - (n - 1) * 86_400_000).toISOString().slice(0, 10);
  return Object.entries(r.dias).reduce((s, [d, c]) => (d >= limite ? s + c : s), 0);
}
