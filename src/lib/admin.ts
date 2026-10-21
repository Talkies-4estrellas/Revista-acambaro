import fs from "node:fs";
import path from "node:path";
import { DIR_EDICIONES, validarEdicion } from "./ediciones";
import { construirResumen } from "./resumen";
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
    ...(raw.maestra && typeof raw.maestra === "object" ? { maestra: raw.maestra } : {}),
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

/* ------------------------- Versiones anteriores ------------------------- */

/** Copias de las versiones anteriores de cada edición (no se suben al repositorio: ver .gitignore). */
const DIR_RESPALDOS = path.join(path.dirname(DIR_EDICIONES), "respaldos");
const MAX_RESPALDOS = 40;
/** Con el autoguardado se escribe cada pocos segundos: solo se conserva una copia nueva si la última tiene más de esto. */
const SEPARACION_RESPALDOS_MS = 3 * 60 * 1000;
const RE_RESPALDO = /^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}\.json$/;

const dirRespaldos = (id: string) => path.join(DIR_RESPALDOS, verificarId(id));

/** Guarda el archivo actual de la edición como versión anterior (si la última copia es de hace rato) y poda las más viejas. */
function respaldarAntes(id: string) {
  try {
    const archivo = archivoEdicion(id);
    if (!fs.existsSync(archivo)) return;
    const dir = dirRespaldos(id);
    fs.mkdirSync(dir, { recursive: true });
    const previas = fs.readdirSync(dir).filter((n) => RE_RESPALDO.test(n)).sort();
    const ultima = previas[previas.length - 1];
    if (ultima && Date.now() - fs.statSync(path.join(dir, ultima)).mtimeMs < SEPARACION_RESPALDOS_MS) return;
    const nombre = `${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    fs.copyFileSync(archivo, path.join(dir, nombre));
    for (const viejo of [...previas, nombre].sort().slice(0, -MAX_RESPALDOS)) fs.rmSync(path.join(dir, viejo), { force: true });
  } catch {
    // Un fallo al respaldar nunca debe impedir guardar.
  }
}

export type Respaldo = { nombre: string; fecha: number; paginas: number; tema: string };

export function listarRespaldos(id: string): Respaldo[] {
  const dir = dirRespaldos(id);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((n) => RE_RESPALDO.test(n))
    .sort()
    .reverse()
    .map((nombre) => {
      const ruta = path.join(dir, nombre);
      let paginas = 0;
      let tema = "";
      try {
        const raw = JSON.parse(fs.readFileSync(ruta, "utf8"));
        paginas = Array.isArray(raw.paginas) ? raw.paginas.length : 0;
        tema = String(raw.tema ?? "");
      } catch {
        // copia ilegible: se lista igual, sin detalles
      }
      return { nombre, fecha: fs.statSync(ruta).mtimeMs, paginas, tema };
    });
}

/** Una versión anterior tal cual (para cargarla en el editor; no se escribe nada hasta que el usuario guarde). */
export function leerRespaldo(id: string, nombre: string): EdicionDatos {
  if (!RE_RESPALDO.test(nombre)) throw new ErrorAdmin("Nombre de versión no válido.");
  const ruta = path.join(dirRespaldos(id), nombre);
  if (!fs.existsSync(ruta)) throw new ErrorAdmin("Esa versión ya no existe.", 404);
  const raw = JSON.parse(fs.readFileSync(ruta, "utf8"));
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
    const nuevo = { ...nuevos, numero: formatoNumero(n?.numero ?? 1), numeroFijo: fijo ? true : undefined };
    validarEdicion(limpiar(nuevo), id); // si no es válida, ni siquiera se respalda ni se toca el archivo
    respaldarAntes(id);
    escribir(id, nuevo);
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
  let maestra: EdicionDatos["maestra"];
  if (duplicarDe) {
    const origen = leerCrudo(duplicarDe);
    if (!origen) throw new ErrorAdmin("La edición base no existe.", 404);
    paginas = origen.paginas;
    maestra = origen.maestra; // también los elementos que se repiten en todas las páginas
  }
  try {
    const otras = entradasNumeracion();
    const n = calcularNumeracion([...otras, { id, fecha: base.fecha, publicada: false }]).get(id);
    escribir(id, { ...base, numero: formatoNumero(n?.numero ?? 1), publicada: false, ...(maestra ? { maestra } : {}), paginas });
  } catch (e) {
    throw new ErrorAdmin(e instanceof Error ? e.message.replace(/^\[ediciones\] /, "") : String(e));
  }
}

/**
 * Crea una edición resumida (borrador) con las páginas elegidas de otra, en el orden dado (índices desde 0).
 * Devuelve los avisos de lo que se ajustó (índice, portada, enlaces).
 */
export function crearResumen(id: string, base: { fecha: string; tema: string }, origenId: string, indices: number[]): string[] {
  if (fs.existsSync(archivoEdicion(id))) throw new ErrorAdmin(`Ya existe una edición con el id "${id}".`, 409);
  const origen = leerCrudo(origenId);
  if (!origen) throw new ErrorAdmin("La edición de origen no existe.", 404);
  let resultado;
  try {
    resultado = construirResumen(origen.paginas, indices);
  } catch (e) {
    throw new ErrorAdmin(e instanceof Error ? e.message : String(e));
  }
  try {
    const n = calcularNumeracion([...entradasNumeracion(), { id, fecha: base.fecha, publicada: false }]).get(id);
    escribir(id, { ...base, numero: formatoNumero(n?.numero ?? 1), publicada: false, ...(origen.maestra ? { maestra: origen.maestra } : {}), paginas: resultado.paginas });
  } catch (e) {
    throw new ErrorAdmin(e instanceof Error ? e.message.replace(/^\[ediciones\] /, "") : String(e));
  }
  return resultado.avisos;
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

/* ----------------------- Optimización de fotos al subir ----------------------- */

/** Ancho máximo de una foto subida: la hoja mide 800 unidades; 2000 px sobra para pantallas de alta densidad. */
const ANCHO_MAX_FOTO = 2000;
/** Fotos que ya son pequeñas se dejan como están (cada recompresión pierde calidad). */
const PESO_MIN_OPTIMIZAR = 150 * 1024;

export type MedioGuardado = {
  src: string;
  /** Si la foto se redujo: peso original y final (bytes), formato y ancho final. */
  optimizado?: { antes: number; despues: number; formato: string; ancho?: number };
};

/**
 * Reduce y comprime una foto (jpg, png o webp) si vale la pena: gira según la orientación de la cámara, la limita a 2000 px de ancho, quita los
 * metadatos (ubicación, cámara…) y la recomprime. Un PNG sin transparencia grande pasa a WebP (mucho más ligero); los PNG con transparencia siguen
 * siendo PNG. GIF, AVIF, video y webp animado no se tocan. Devuelve null si no se puede o no se ahorra al menos un 5 %.
 * `sharp` (lo trae Next) se carga al usarlo: si no estuviera, la foto se guarda sin optimizar.
 */
async function optimizarFoto(datos: Buffer, ext: string): Promise<{ buffer: Buffer; ext: string; ancho?: number } | null> {
  if (!["jpg", "jpeg", "png", "webp"].includes(ext) || datos.length < PESO_MIN_OPTIMIZAR) return null;
  try {
    const sharp = (await import("sharp")).default;
    const meta = await sharp(datos, { failOn: "none" }).metadata();
    if ((meta.pages ?? 1) > 1) return null; // animada
    let tuberia = sharp(datos, { failOn: "none" }).rotate().resize({ width: ANCHO_MAX_FOTO, withoutEnlargement: true });
    let salida = ext === "jpeg" ? "jpg" : ext;
    // Muchos PNG (capturas de pantalla) traen canal alfa aunque todo sea opaco: solo cuenta como transparente si de verdad lo es.
    const opaca = ext === "png" ? !meta.hasAlpha || (await sharp(datos, { failOn: "none" }).stats()).isOpaque : false;
    if (ext === "png" && opaca) {
      tuberia = tuberia.webp({ quality: 85 });
      salida = "webp";
    } else if (ext === "png") tuberia = tuberia.png({ compressionLevel: 9, effort: 8 });
    else if (ext === "webp") tuberia = tuberia.webp({ quality: 82 });
    else tuberia = tuberia.jpeg({ quality: 82, mozjpeg: true });
    const { data, info } = await tuberia.toBuffer({ resolveWithObject: true });
    if (data.length > datos.length * 0.95) return null;
    return { buffer: data, ext: salida, ancho: info.width };
  } catch {
    return null; // cualquier problema: se conserva el archivo original
  }
}

export async function guardarMedio(id: string, file: File, conservarOriginal = false): Promise<MedioGuardado> {
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

  const original = Buffer.from(await file.arrayBuffer());
  const optimizada = conservarOriginal ? null : await optimizarFoto(original, ext);
  const extFinal = optimizada?.ext ?? ext;

  fs.mkdirSync(dir, { recursive: true });
  let nombre = `${base}.${extFinal}`;
  for (let n = 2; fs.existsSync(path.join(dir, nombre)); n++) nombre = `${base}-${n}.${extFinal}`;

  fs.writeFileSync(path.join(dir, nombre), optimizada?.buffer ?? original);
  return {
    src: `/media/${id}/${nombre}`,
    ...(optimizada ? { optimizado: { antes: original.length, despues: optimizada.buffer.length, formato: extFinal, ancho: optimizada.ancho } } : {}),
  };
}
