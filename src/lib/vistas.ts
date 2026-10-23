import fs from "node:fs";
import path from "node:path";
import { getPublicadas } from "./ediciones";

/**
 * Vistas de cada página de la revista (para saber cuánta gente vio un anuncio y calcular su tasa de clics).
 * Se guardan por edición, página y día en content/vistas.json (privado, como clics.json). Una página cuenta cuando
 * el lector la tuvo a la vista un momento (lo decide ContarVistas en el navegador); el servidor solo acepta páginas
 * que existen en una edición publicada. Un mismo visitante cuenta una vez por página cada 30 minutos (mejor esfuerzo).
 * Con CLICS_WEBHOOK_URL cada vista también se envía por POST (evento "vista"), como los clics.
 */

export type RegistroVistas = {
  edicion: string;
  pagina: number;
  total: number;
  /** Vistas por día (AAAA-MM-DD, hora UTC). */
  dias: Record<string, number>;
  ultimo: string;
};

const ARCHIVO = path.join(process.cwd(), "content", "vistas.json");
const MAX_REGISTROS = 20000;
const MAX_DIAS = 400;
const VENTANA_MS = 30 * 60 * 1000;
const recientes = new Map<string, number>();

export function leerVistas(): RegistroVistas[] {
  if (!fs.existsSync(ARCHIVO)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
    return Array.isArray(raw) ? raw.filter((r) => r && typeof r.edicion === "string" && typeof r.pagina === "number" && typeof r.total === "number") : [];
  } catch {
    return [];
  }
}

function escribir(lista: RegistroVistas[]) {
  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  const tmp = `${ARCHIVO}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(lista, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, ARCHIVO);
}

/** Devuelve false si la página no existe en una edición publicada. */
export async function registrarVista(edicion: unknown, pagina: unknown, visitante: string): Promise<boolean> {
  if (typeof edicion !== "string" || edicion.length > 40 || typeof pagina !== "number" || !Number.isInteger(pagina) || pagina < 1) return false;
  const ed = getPublicadas().find((e) => e.id === edicion);
  if (!ed || pagina > ed.paginas.length) return false;

  const ahora = Date.now();
  const marca = `${visitante}|${edicion}|${pagina}`;
  for (const [m, t] of recientes) if (ahora - t > VENTANA_MS) recientes.delete(m);
  if (recientes.has(marca)) return true;
  if (recientes.size < 50_000) recientes.set(marca, ahora);

  const fecha = new Date(ahora).toISOString();
  const dia = fecha.slice(0, 10);
  try {
    const lista = leerVistas();
    let r = lista.find((x) => x.edicion === edicion && x.pagina === pagina);
    if (!r) {
      if (lista.length >= MAX_REGISTROS) return true;
      r = { edicion, pagina, total: 0, dias: {}, ultimo: fecha };
      lista.push(r);
    }
    r.total += 1;
    r.ultimo = fecha;
    r.dias[dia] = (r.dias[dia] ?? 0) + 1;
    const dias = Object.keys(r.dias).sort();
    for (const d of dias.slice(0, Math.max(0, dias.length - MAX_DIAS))) delete r.dias[d];
    escribir(lista);
  } catch {
    // Hosting de solo lectura: sin webhook la vista simplemente no se guarda.
  }
  const webhook = process.env.CLICS_WEBHOOK_URL;
  if (webhook) {
    try {
      await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ evento: "vista", fecha, edicion, pagina }),
        signal: AbortSignal.timeout(5000),
      });
    } catch {
      // No se interrumpe la lectura por un fallo del webhook.
    }
  }
  return true;
}

/** Suma de vistas en los últimos `n` días (contando hoy). */
export function vistasRecientes(r: RegistroVistas, n: number, ahora = new Date()): number {
  const limite = new Date(ahora.getTime() - (n - 1) * 86_400_000).toISOString().slice(0, 10);
  return Object.entries(r.dias).reduce((s, [d, c]) => (d >= limite ? s + c : s), 0);
}
