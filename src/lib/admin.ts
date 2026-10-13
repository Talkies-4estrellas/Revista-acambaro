import fs from "node:fs";
import path from "node:path";
import { DIR_EDICIONES, validarEdicion } from "./ediciones";
import { limpiar, paginaNueva, type EdicionDatos } from "./esquema";
import { calcularNumeracion, formatoNumero, numeroFijoDe } from "./numeracion";

/**
 * Almacenamiento del panel: archivos JSON en content/ediciones y medios en public/media.
 * Toda la lógica de disco está aquí, para poder cambiarla por Supabase sin tocar el editor.
 */

export const ID_RE = /^[a-z0-9][a-z0-9_-]{0,39}$/i;

const DIR_MEDIA = path.join(process.cwd(), "public", "media");
const MAX_MEDIO = 60 * 1024 * 1024; // 60 MB
const TIPOS_MEDIO: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  mp4: "video/mp4",
  webm: "video/webm",
};

export class ErrorAdmin extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

/* ------------------------------ Acceso ------------------------------- */

/**
 * El panel escribe archivos del proyecto, así que solo está disponible en desarrollo
 * (o con ADMIN_ENABLED=true) y únicamente desde esta misma máquina.
 */
export function adminPermitido(host: string | null | undefined) {
  if (process.env.NODE_ENV === "production" && process.env.ADMIN_ENABLED !== "true") return false;
  if (process.env.ADMIN_ALLOW_REMOTE === "true") return true;
  const nombre = (host ?? "").replace(/:\d+$/, "").replace(/^\[|\]$/g, "");
  return nombre === "localhost" || nombre === "127.0.0.1" || nombre === "::1";
}

/** Para peticiones que modifican datos: además exige que el Origin sea este mismo sitio. */
export function verificarPeticion(req: Request) {
  const host = req.headers.get("host");
  if (!adminPermitido(host)) throw new ErrorAdmin("No encontrado", 404);
  const origin = req.headers.get("origin");
  if (origin) {
    let oh = "";
    try {
      oh = new URL(origin).host;
    } catch {}
    if (oh !== host) throw new ErrorAdmin("Origen no permitido", 403);
  }
}

export function verificarId(id: string) {
  if (!ID_RE.test(id)) throw new ErrorAdmin("El identificador solo admite letras, números, - y _ (máx. 40).");
  return id;
}

const archivoEdicion = (id: string) => path.join(DIR_EDICIONES, `${verificarId(id)}.json`);

/* ---------------------------- Ediciones ------------------------------ */

export type ResumenEdicion = {
  id: string;
  numero?: string;
  fecha?: string;
  tema?: string;
  publicada?: boolean;
  publicarEn?: string;
  /** Número previsto de un borrador que nunca se publicó (aún no cuenta como edición). */
  provisional?: boolean;
  /** Ya se publicó alguna vez: conserva su número aunque se desactive. */
  fijo?: boolean;
  paginas?: number;
  error?: string;
};

/** Lista tolerante: una edición con errores aparece marcada en lugar de romper el panel. */
export function listarEdicionesAdmin(): ResumenEdicion[] {
  if (!fs.existsSync(DIR_EDICIONES)) return [];
  const lista = fs
    .readdirSync(DIR_EDICIONES)
    .filter((f) => f.endsWith(".json"))
    .map((f): ResumenEdicion => {
      const id = f.replace(/\.json$/, "");
      try {
        const raw = JSON.parse(fs.readFileSync(path.join(DIR_EDICIONES, f), "utf8"));
        const ed = validarEdicion(raw, id);
        return { id, numero: ed.numero, fecha: ed.fecha, tema: ed.tema, publicada: ed.publicada, publicarEn: ed.publicarEn, fijo: numeroFijoDe(ed) !== undefined, paginas: ed.paginas.length };
      } catch (e) {
        return { id, error: e instanceof Error ? e.message : String(e) };
      }
    });
  // Número automático: las que ya se publicaron lo conservan; las nuevas toman el siguiente; los borradores solo
  // muestran el que recibirían.
  const numeros = calcularNumeracion(
    lista.filter((e) => !e.error).map((e) => ({ id: e.id, fecha: e.fecha!, publicada: !!e.publicada, publicarEn: e.publicarEn, fijo: e.fijo ? Number.parseInt(e.numero ?? "", 10) : undefined })),
  );
  return lista
    .map((e) => {
      const n = numeros.get(e.id);
      return n ? { ...e, numero: formatoNumero(n.numero), provisional: n.provisional } : e;
    })
    .sort((a, b) => (b.fecha ?? "").localeCompare(a.fecha ?? "") || b.id.localeCompare(a.id));
}

/** Resumen de las demás ediciones para calcular el número en el editor. */
export function entradasNumeracion(): { id: string; fecha: string; publicada: boolean; publicarEn?: string; fijo?: number }[] {
  return listarEdicionesAdmin()
    .filter((e) => !e.error)
    .map((e) => ({ id: e.id, fecha: e.fecha!, publicada: !!e.publicada, publicarEn: e.publicarEn, fijo: e.fijo ? Number.parseInt(e.numero ?? "", 10) : undefined }));
}

/** Lee el JSON tal cual (sin validar) para poder abrir y corregir ediciones con errores. */
export function leerCrudo(id: string): EdicionDatos | null {
  const archivo = archivoEdicion(id);
  if (!fs.existsSync(archivo)) return null;
  const raw = JSON.parse(fs.readFileSync(archivo, "utf8"));
  return {
    numero: String(raw.numero ?? ""),
    fecha: String(raw.fecha ?? ""),
    tema: String(raw.tema ?? ""),
    publicada: raw.publicada !== false,
    publicarEn: typeof raw.publicarEn === "string" ? raw.publicarEn : undefined,
    numeroFijo: raw.numeroFijo === true ? true : undefined,
    paginas: Array.isArray(raw.paginas) ? raw.paginas : [],
  };
}

function escribir(id: string, datos: EdicionDatos) {
  const limpio = limpiar(datos);
  validarEdicion(limpio, id); // lanza un error legible si algo no cuadra
  fs.mkdirSync(DIR_EDICIONES, { recursive: true });
  const archivo = archivoEdicion(id);
  const tmp = `${archivo}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(limpio, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, archivo);
}

export function guardarEdicion(id: string, datos: unknown) {
  if (!fs.existsSync(archivoEdicion(id))) throw new ErrorAdmin("La edición no existe.", 404);
  try {
    const nuevos = datos as EdicionDatos;
    // El número no se escribe a mano (ver lib/numeracion.ts): la primera vez que se publica toma el siguiente
    // y desde entonces queda fijo, aunque la edición se desactive. Se lee del archivo, no de lo que mande el cliente.
    const actual = leerCrudo(id);
    const fijoActual = actual ? numeroFijoDe(actual) : undefined;
    const publicada = nuevos.publicada !== false;
    const otras = entradasNumeracion().filter((e) => e.id !== id);
    const n = calcularNumeracion([...otras, { id, fecha: String(nuevos.fecha), publicada, publicarEn: nuevos.publicarEn, fijo: fijoActual }]).get(id);
    const fijo = fijoActual !== undefined || publicada;
    escribir(id, { ...nuevos, numero: formatoNumero(n?.numero ?? 1), numeroFijo: fijo ? true : undefined });
  } catch (e) {
    if (e instanceof ErrorAdmin) throw e;
    throw new ErrorAdmin(e instanceof Error ? e.message.replace(/^\[ediciones\] /, "") : String(e));
  }
}

export function crearEdicion(
  id: string,
  base: { numero: string; fecha: string; tema: string },
  duplicarDe?: string,
) {
  if (fs.existsSync(archivoEdicion(id))) throw new ErrorAdmin(`Ya existe una edición con el id "${id}".`, 409);

  let paginas: EdicionDatos["paginas"] = [{ ...paginaNueva("lienzo"), titulo: "Portada" }];
  if (duplicarDe) {
    const origen = leerCrudo(duplicarDe);
    if (!origen) throw new ErrorAdmin("La edición base no existe.", 404);
    paginas = origen.paginas;
  }
  try {
    const otras = entradasNumeracion();
    const n = calcularNumeracion([...otras, { id, fecha: base.fecha, publicada: false }]).get(id);
    escribir(id, { ...base, numero: formatoNumero(n?.numero ?? 1), publicada: false, paginas });
  } catch (e) {
    throw new ErrorAdmin(e instanceof Error ? e.message.replace(/^\[ediciones\] /, "") : String(e));
  }
}

/**
 * Borra un borrador (o una edición desactivada). No se borra del disco: el archivo pasa a content/papelera/ para
 * poder recuperarlo. Una edición publicada no se puede borrar desde el panel: primero hay que desactivarla.
 */
export function borrarBorrador(id: string) {
  const archivo = archivoEdicion(id);
  if (!fs.existsSync(archivo)) throw new ErrorAdmin("La edición no existe.", 404);
  let publicada = true;
  try {
    publicada = JSON.parse(fs.readFileSync(archivo, "utf8")).publicada !== false;
  } catch {
    // Un archivo con JSON roto no es una edición publicable; se deja borrar como borrador.
    publicada = false;
  }
  if (publicada) throw new ErrorAdmin("Una edición publicada no se puede borrar. Desactívala primero (Publicación → Desactivada) y luego bórrala.", 409);
  const papelera = path.join(path.dirname(DIR_EDICIONES), "papelera");
  fs.mkdirSync(papelera, { recursive: true });
  fs.renameSync(archivo, path.join(papelera, `${id}-${new Date().toISOString().replace(/[:.]/g, "-")}.json`));
}

/* ------------------------------ Medios ------------------------------- */

const dirMedios = (id: string) => path.join(DIR_MEDIA, verificarId(id));

export function listarMedios(id: string): string[] {
  const dir = dirMedios(id);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => path.extname(f).slice(1).toLowerCase() in TIPOS_MEDIO)
    .sort()
    .map((f) => `/media/${id}/${f}`);
}

export async function guardarMedio(id: string, file: File): Promise<string> {
  const dir = dirMedios(id);
  const ext = path.extname(file.name).slice(1).toLowerCase();
  if (!(ext in TIPOS_MEDIO)) throw new ErrorAdmin(`Formato no permitido (.${ext}). Usa: ${Object.keys(TIPOS_MEDIO).join(", ")}.`);
  if (file.size > MAX_MEDIO) throw new ErrorAdmin("El archivo pesa más de 60 MB.");

  const base =
    path
      .basename(file.name, path.extname(file.name))
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-zA-Z0-9_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase()
      .slice(0, 60) || "archivo";

  fs.mkdirSync(dir, { recursive: true });
  let nombre = `${base}.${ext}`;
  for (let n = 2; fs.existsSync(path.join(dir, nombre)); n++) nombre = `${base}-${n}.${ext}`;

  fs.writeFileSync(path.join(dir, nombre), Buffer.from(await file.arrayBuffer()));
  return `/media/${id}/${nombre}`;
}
