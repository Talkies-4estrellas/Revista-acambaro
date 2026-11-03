import fs from "node:fs";
import path from "node:path";
import { DIR_EDICIONES } from "./ediciones";
import { DIR_MEDIA, ErrorAdmin, ID_RE, TIPOS_MEDIO, archivoEdicion, borrarMedio, guardarEdicion, leerCrudo, verificarId } from "./admin";

/* ------------------------------ Papelera ------------------------------ */

const DIR_PAPELERA = path.join(path.dirname(DIR_EDICIONES), "papelera");
const DIR_PAPELERA_MEDIOS = path.join(path.dirname(DIR_EDICIONES), "papelera-medios");
/** Fecha con la que se nombran los archivos de la papelera: 2026-11-03T18-22-05-123Z. */
const RE_FECHA = "(\\d{4}-\\d{2}-\\d{2}T\\d{2}-\\d{2}-\\d{2}-\\d{3}Z)";
const RE_EDICION = new RegExp(`^(.+)-${RE_FECHA}\\.json$`);
const RE_MEDIO = new RegExp(`^([\\w-]+)__${RE_FECHA}__(.+)$`);

/** «2026-11-03T18-22-05-123Z» → milisegundos. */
const fechaDeNombre = (f: string) => Date.parse(f.replace(/T(\d{2})-(\d{2})-(\d{2})-(\d{3})Z$/, "T$1:$2:$3.$4Z"));

export type EnPapelera = {
  archivo: string;
  borrado: number;
  bytes: number;
} & ({ tipo: "edicion"; id: string; tema?: string; paginas?: number; numero?: string } | { tipo: "medio"; carpeta: string; nombre: string; esImagen: boolean });

/** Lo que hay en la papelera (ediciones borradas y archivos de medios quitados), lo más reciente primero. */
export function listarPapelera(): EnPapelera[] {
  const lista: EnPapelera[] = [];
  if (fs.existsSync(DIR_PAPELERA)) {
    for (const archivo of fs.readdirSync(DIR_PAPELERA)) {
      const m = RE_EDICION.exec(archivo);
      if (!m) continue;
      const ruta = path.join(DIR_PAPELERA, archivo);
      let datos: { tema?: string; paginas?: unknown[]; numero?: string; numeroFijo?: boolean } = {};
      try {
        datos = JSON.parse(fs.readFileSync(ruta, "utf8"));
      } catch {}
      lista.push({ tipo: "edicion", archivo, id: m[1], borrado: fechaDeNombre(m[2]), bytes: fs.statSync(ruta).size, tema: datos.tema, paginas: Array.isArray(datos.paginas) ? datos.paginas.length : undefined, numero: datos.numeroFijo ? datos.numero : undefined });
    }
  }
  if (fs.existsSync(DIR_PAPELERA_MEDIOS)) {
    for (const archivo of fs.readdirSync(DIR_PAPELERA_MEDIOS)) {
      const m = RE_MEDIO.exec(archivo);
      if (!m) continue;
      const ext = path.extname(m[3]).slice(1).toLowerCase();
      lista.push({ tipo: "medio", archivo, carpeta: m[1], nombre: m[3], borrado: fechaDeNombre(m[2]), bytes: fs.statSync(path.join(DIR_PAPELERA_MEDIOS, archivo)).size, esImagen: ext !== "mp4" && ext !== "webm" });
    }
  }
  return lista.sort((a, b) => b.borrado - a.borrado);
}

/** Un nombre libre: «nombre», «nombre-recuperada», «nombre-recuperada-2»… */
function libre(existe: (n: string) => boolean, base: string, sufijo = "-recuperada"): string {
  if (!existe(base)) return base;
  for (let i = 1; i < 100; i++) {
    const n = `${base}${sufijo}${i > 1 ? `-${i}` : ""}`;
    if (!existe(n)) return n;
  }
  throw new ErrorAdmin("No encontré un nombre libre para recuperarlo.", 409);
}

/** Saca una edición de la papelera. Si ya hay otra con su id, vuelve como «<id>-recuperada». Devuelve el id con el que quedó. */
export function recuperarEdicion(archivo: string): string {
  const m = RE_EDICION.exec(archivo);
  const ruta = path.join(DIR_PAPELERA, path.basename(archivo));
  if (!m || path.basename(archivo) !== archivo || !fs.existsSync(ruta)) throw new ErrorAdmin("Ese archivo no está en la papelera.", 404);
  const id = libre((n) => fs.existsSync(path.join(DIR_EDICIONES, `${n}.json`)), m[1].slice(0, 28));
  verificarId(id);
  fs.renameSync(ruta, archivoEdicion(id));
  return id;
}

/** Devuelve un archivo de medios a su carpeta. Si ya hay otro con su nombre, vuelve como «nombre-recuperada.ext». Devuelve su ruta /media/…. */
export function recuperarMedio(archivo: string): string {
  const m = RE_MEDIO.exec(archivo);
  const ruta = path.join(DIR_PAPELERA_MEDIOS, path.basename(archivo));
  if (!m || path.basename(archivo) !== archivo || !fs.existsSync(ruta) || !ID_RE.test(m[1])) throw new ErrorAdmin("Ese archivo no está en la papelera.", 404);
  const ext = path.extname(m[3]);
  if (!(ext.slice(1).toLowerCase() in TIPOS_MEDIO) || /[\\/]/.test(m[3])) throw new ErrorAdmin("Nombre de archivo no válido.");
  const dir = path.join(DIR_MEDIA, m[1]);
  fs.mkdirSync(dir, { recursive: true });
  const nombre = libre((n) => fs.existsSync(path.join(dir, `${n}${ext}`)), path.basename(m[3], ext)) + ext;
  fs.renameSync(ruta, path.join(dir, nombre));
  return `/media/${m[1]}/${nombre}`;
}

/* ------------------------- Publicar desde la lista ------------------------- */

export type ModoPublicacion = "publicar" | "programar" | "desactivar";
const RE_PUBLICAR_EN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

/**
 * Publica ya, programa (fecha y hora del centro de México, «2026-11-10T09:00») o desactiva una edición sin abrir el
 * editor. Guarda igual que el editor (respaldo, número fijo al publicar). Las muestras no se publican.
 */
export function cambiarPublicacion(id: string, modo: ModoPublicacion, publicarEn?: string) {
  const datos = leerCrudo(id);
  if (!datos) throw new ErrorAdmin("La edición no existe.", 404);
  if (datos.muestra) throw new ErrorAdmin("Una edición de muestra no se publica: solo se hojea en la presentación.", 409);
  if (modo === "programar" && (!publicarEn || !RE_PUBLICAR_EN.test(publicarEn))) throw new ErrorAdmin("Elige el día y la hora para programarla.");
  const nuevo =
    modo === "desactivar"
      ? { ...datos, publicada: false, publicarEn: undefined }
      : modo === "publicar"
        ? { ...datos, publicada: true, publicarEn: undefined }
        : { ...datos, publicada: true, publicarEn };
  return guardarEdicion(id, nuevo, null);
}

/* ------------------------------ Medios ------------------------------ */

const RE_RUTA_MEDIO = /\/media\/[\w-]+\/[^"'`\s)\\<>]+?\.(?:jpe?g|png|webp|svg|gif|avif|mp4|webm)\b/gi;

/** Archivos de /media que se usan fuera de las ediciones: en el código del sitio, en plantillas y en «Mis elementos». */
export function usoFueraDeEdiciones(): Map<string, string[]> {
  const uso = new Map<string, string[]>();
  const anotar = (texto: string, donde: string) => {
    for (const ruta of texto.match(RE_RUTA_MEDIO) ?? []) if (!uso.get(ruta)?.includes(donde)) uso.set(ruta, [...(uso.get(ruta) ?? []), donde]);
  };
  const recorrer = (dir: string, extensiones: RegExp, nombre: (archivo: string) => string) => {
    if (!fs.existsSync(dir)) return;
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const ruta = path.join(dir, e.name);
      if (e.isDirectory()) recorrer(ruta, extensiones, nombre);
      else if (extensiones.test(e.name)) anotar(fs.readFileSync(ruta, "utf8"), nombre(ruta));
    }
  };
  const raiz = process.cwd();
  recorrer(path.join(raiz, "src"), /\.(tsx?|css)$/, (r) => `el sitio (${path.relative(raiz, r).split(path.sep).join("/")})`);
  recorrer(path.join(raiz, "content", "plantillas"), /\.json$/, () => "una plantilla guardada");
  recorrer(path.join(raiz, "content", "elementos"), /\.json$/, () => "«Mis elementos»");
  return uso;
}

/** Quita un archivo de medios (a la papelera) solo si nada lo usa: ni las ediciones ni el sitio, plantillas o «Mis elementos». */
export function quitarMedio(src: string) {
  const fuera = usoFueraDeEdiciones().get(src);
  if (fuera?.length) throw new ErrorAdmin(`No se puede borrar: lo usa ${fuera[0]}.`, 409);
  borrarMedio(src);
}

/** Ruta en disco de un archivo de la papelera de medios (solo nombres que la papelera reconoce). */
export function rutaEnPapeleraMedios(archivo: string): string {
  const ruta = path.join(DIR_PAPELERA_MEDIOS, path.basename(archivo));
  if (path.basename(archivo) !== archivo || !RE_MEDIO.test(archivo) || !fs.existsSync(ruta)) throw new ErrorAdmin("Ese archivo no está en la papelera.", 404);
  return ruta;
}
