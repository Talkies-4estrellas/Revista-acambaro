import fs from "node:fs";
import path from "node:path";

/**
 * Ajustes del sitio: las variables de entorno que hoy se escriben a mano en `.env.local`. El panel las muestra y deja cambiar las
 * seguras; las que abren el panel a otras computadoras solo se muestran. `.env.local` no se sube a git; en Vercel se ponen aparte
 * (Settings → Environment Variables). Antes de escribir se guarda una copia en content/respaldos/env-local/.
 */

export type Ajuste = {
  clave: string;
  nombre: string;
  ayuda: string;
  ejemplo: string;
  /** Se puede cambiar desde el panel. */
  editable: boolean;
  /** No mostrar el valor completo (direcciones de webhooks: quien las tenga puede mandar datos). */
  ocultar?: boolean;
  /** Dónde va: en tu equipo, en Vercel o en los dos. */
  donde: string;
  validar?: (v: string) => string | null;
};

const esUrl = (v: string, protocolos: string[]) => {
  try {
    return protocolos.includes(new URL(v).protocol);
  } catch {
    return false;
  }
};

export const AJUSTES: Ajuste[] = [
  {
    clave: "NEXT_PUBLIC_SITE_URL",
    nombre: "Dirección del sitio",
    ayuda: "La dirección pública de la revista. Se usa en los enlaces del newsletter y para la imagen al compartir en WhatsApp o Facebook.",
    ejemplo: "https://revista-acambaro.vercel.app",
    editable: true,
    donde: "Tu equipo y Vercel",
    validar: (v) => (esUrl(v, ["https:", "http:"]) ? null : "Escribe la dirección completa, con https://"),
  },
  {
    clave: "NEXT_PUBLIC_CONTACTO_ANUNCIOS",
    nombre: "Contacto para anunciantes",
    ayuda: "A dónde lleva «Quiero anunciarme» en la página de bienvenida: un enlace de WhatsApp, un correo o una página. Es público: lo ve cualquiera.",
    ejemplo: "https://wa.me/5214170000000",
    editable: true,
    donde: "Tu equipo y Vercel",
    validar: (v) => (esUrl(v, ["https:", "mailto:", "tel:"]) ? null : "Usa un enlace https:// (por ejemplo de WhatsApp: https://wa.me/52…), mailto:correo o tel:número"),
  },
  {
    clave: "CLICS_WEBHOOK_URL",
    nombre: "Webhook de clics y vistas",
    ayuda: "En Vercel no se pueden guardar archivos: cada clic y cada vista se envía a esta dirección (una hoja de cálculo o un servicio).",
    ejemplo: "https://script.google.com/macros/s/…/exec",
    editable: true,
    ocultar: true,
    donde: "Vercel (en tu equipo es opcional)",
    validar: (v) => (esUrl(v, ["https:"]) ? null : "Debe ser una dirección https://"),
  },
  {
    clave: "SUSCRIPCION_WEBHOOK_URL",
    nombre: "Webhook de suscripciones",
    ayuda: "Envía cada alta del newsletter a esta dirección (una hoja de cálculo o un servicio), porque en Vercel no se guarda el archivo de suscriptores.",
    ejemplo: "https://script.google.com/macros/s/…/exec",
    editable: true,
    ocultar: true,
    donde: "Vercel (en tu equipo es opcional)",
    validar: (v) => (esUrl(v, ["https:"]) ? null : "Debe ser una dirección https://"),
  },
  {
    clave: "ADMIN_ENABLED",
    nombre: "Panel en una compilación local",
    ayuda: "Abre este panel en `next start` (compilación de producción en tu equipo). Por seguridad no se cambia desde aquí: edítalo a mano en .env.local si lo necesitas. Nunca en Vercel.",
    ejemplo: "1",
    editable: false,
    donde: "Solo tu equipo",
  },
  {
    clave: "ADMIN_ALLOW_REMOTE",
    nombre: "Panel desde otra computadora",
    ayuda: "Deja abrir el panel desde otra computadora de tu red (no recomendado). Por seguridad no se cambia desde aquí.",
    ejemplo: "1",
    editable: false,
    donde: "Solo tu equipo",
  },
];

const ARCHIVO = path.join(process.cwd(), ".env.local");
const DIR_RESPALDO = path.join(process.cwd(), "content", "respaldos", "env-local");

export class ErrorAjustes extends Error {}

/** Valores de `.env.local` (lo que está escrito en el archivo, no lo que el servidor cargó al arrancar). */
export function leerEnvLocal(): Record<string, string> {
  if (!fs.existsSync(ARCHIVO)) return {};
  const valores: Record<string, string> = {};
  for (const linea of fs.readFileSync(ARCHIVO, "utf8").split(/\r?\n/)) {
    const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=\s*(.*)\s*$/.exec(linea);
    if (!m) continue;
    let v = m[2];
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    valores[m[1]] = v;
  }
  return valores;
}

/** «https://script.google.com/macros/s/AKfy…/exec» → «https://script.google.com/…» (para no mostrar la dirección entera). */
export const ocultarValor = (v: string) => {
  try {
    const u = new URL(v);
    return `${u.protocol}//${u.host}/…`;
  } catch {
    return v.length > 8 ? `${v.slice(0, 4)}…` : "…";
  }
};

/**
 * Cambia ajustes en `.env.local`: `cambios` = clave → valor nuevo ("" para quitarla). Solo las editables. Conserva las demás
 * líneas (comentarios y otras variables) y guarda antes una copia del archivo.
 */
export function guardarAjustes(cambios: Record<string, string>) {
  const editables = new Map(AJUSTES.filter((a) => a.editable).map((a) => [a.clave, a]));
  const limpios: Record<string, string> = {};
  for (const [clave, valor] of Object.entries(cambios)) {
    const a = editables.get(clave);
    if (!a) throw new ErrorAjustes(`«${clave}» no se puede cambiar desde el panel.`);
    const v = String(valor ?? "").trim();
    if (/[\r\n"]/.test(v)) throw new ErrorAjustes(`${a.nombre}: no puede llevar saltos de línea ni comillas.`);
    if (v && a.validar) {
      const error = a.validar(v);
      if (error) throw new ErrorAjustes(`${a.nombre}: ${error}`);
    }
    limpios[clave] = v;
  }

  const lineas = fs.existsSync(ARCHIVO) ? fs.readFileSync(ARCHIVO, "utf8").split(/\r?\n/) : [];
  if (fs.existsSync(ARCHIVO)) {
    fs.mkdirSync(DIR_RESPALDO, { recursive: true });
    fs.copyFileSync(ARCHIVO, path.join(DIR_RESPALDO, `env-local-${new Date().toISOString().replace(/[:.]/g, "-")}.txt`));
  }
  const pendientes = new Map(Object.entries(limpios));
  const nuevas: string[] = [];
  for (const linea of lineas) {
    const m = /^\s*(?:export\s+)?([A-Z0-9_]+)\s*=/.exec(linea);
    if (m && pendientes.has(m[1])) {
      const v = pendientes.get(m[1])!;
      pendientes.delete(m[1]);
      if (v) nuevas.push(`${m[1]}="${v}"`);
      continue; // vacío = se quita la línea
    }
    nuevas.push(linea);
  }
  while (nuevas.length && nuevas[nuevas.length - 1] === "") nuevas.pop();
  const agregar = [...pendientes].filter(([, v]) => v);
  if (agregar.length && !lineas.length) nuevas.push("# Ajustes de la revista (también se cambian en el panel: /admin/ajustes). No se sube a git.");
  for (const [k, v] of agregar) nuevas.push(`${k}="${v}"`);
  const tmp = `${ARCHIVO}.tmp`;
  fs.writeFileSync(tmp, nuevas.join("\n") + "\n", "utf8");
  fs.renameSync(tmp, ARCHIVO);
}
