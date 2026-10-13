import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

/**
 * Suscriptores del newsletter. Se guardan en content/suscriptores.json (privado: no está en public/).
 * Si defines SUSCRIPCION_WEBHOOK_URL, cada alta nueva también se envía por POST (JSON {email, fecha}) a esa
 * dirección, útil para mandarlas a una hoja de cálculo o a un servicio de correo (Zapier, Make, Buttondown…).
 * Es la única parte que habría que cambiar para llevar los suscriptores a Supabase.
 */

export type Suscriptor = { email: string; fecha: string; token: string };

const ARCHIVO = path.join(process.cwd(), "content", "suscriptores.json");
const MAX_SUSCRIPTORES = 50_000;

export const EMAIL_RE = /^[^\s@<>"',;]+@[^\s@<>"',;]+\.[^\s@<>"',;]{2,}$/;

export function normalizarEmail(v: unknown): string | null {
  if (typeof v !== "string") return null;
  const e = v.trim().toLowerCase();
  return e.length <= 254 && EMAIL_RE.test(e) ? e : null;
}

export function leerSuscriptores(): Suscriptor[] {
  if (!fs.existsSync(ARCHIVO)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
    return Array.isArray(raw) ? raw.filter((s) => s && typeof s.email === "string" && typeof s.token === "string") : [];
  } catch {
    return [];
  }
}

function escribir(lista: Suscriptor[]) {
  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  const tmp = `${ARCHIVO}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(lista, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, ARCHIVO);
}

export type ResultadoAlta = "nuevo" | "existente";

/** Da de alta un correo. Repetirlo no es un error (y no revela si ya estaba). */
export async function agregarSuscriptor(email: string): Promise<ResultadoAlta> {
  const lista = leerSuscriptores();
  if (lista.some((s) => s.email === email)) return "existente";
  if (lista.length >= MAX_SUSCRIPTORES) throw new Error("Lista llena");

  const nuevo: Suscriptor = { email, fecha: new Date().toISOString(), token: crypto.randomBytes(16).toString("hex") };
  const webhook = process.env.SUSCRIPCION_WEBHOOK_URL;
  let guardado = false;
  try {
    escribir([...lista, nuevo]);
    guardado = true;
  } catch (e) {
    // Hosting de solo lectura (p. ej. Vercel): sin webhook no hay dónde guardar.
    if (!webhook) throw e;
  }
  if (webhook) {
    try {
      const r = await fetch(webhook, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, fecha: nuevo.fecha }),
        signal: AbortSignal.timeout(8000),
      });
      if (!r.ok && !guardado) throw new Error(`El webhook respondió ${r.status}`);
    } catch (e) {
      if (!guardado) throw e;
    }
  }
  return "nuevo";
}

/** Baja por el token personal del enlace del correo. */
export function quitarPorToken(token: string): boolean {
  if (!/^[a-f0-9]{32}$/.test(token)) return false;
  const lista = leerSuscriptores();
  const resto = lista.filter((s) => s.token !== token);
  if (resto.length === lista.length) return false;
  escribir(resto);
  return true;
}

export function quitarPorEmail(email: string): boolean {
  const lista = leerSuscriptores();
  const resto = lista.filter((s) => s.email !== email);
  if (resto.length === lista.length) return false;
  escribir(resto);
  return true;
}

/** Campo de CSV a prueba de inyección de fórmulas en hojas de cálculo. */
const celdaCsv = (v: string) => {
  const seguro = /^[=+\-@\t\r]/.test(v) ? `'${v}` : v;
  return `"${seguro.replace(/"/g, '""')}"`;
};

export function suscriptoresCsv(lista: Suscriptor[], baseUrl = ""): string {
  const filas = lista.map((s) => [celdaCsv(s.email), celdaCsv(s.fecha), celdaCsv(`${baseUrl}/baja?t=${s.token}`)].join(","));
  return ["email,fecha_alta,enlace_baja", ...filas].join("\r\n") + "\r\n";
}
