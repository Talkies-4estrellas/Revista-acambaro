import fs from "node:fs";
import path from "node:path";
import { ErrorAdmin, ID_RE } from "./admin";
import { validarPagina } from "./ediciones";
import { limpiar, type Pagina } from "./esquema";

/**
 * Plantillas de página guardadas por el usuario: content/plantillas/<id>.json, compartidas por todas las
 * ediciones. Al guardar una plantilla se copian sus imágenes a public/media/_plantillas/<id>/ para que siga
 * funcionando aunque se cambie o borre la edición de origen.
 */

const DIR = path.join(process.cwd(), "content", "plantillas");
const DIR_MEDIA = path.join(process.cwd(), "public", "media");
const PREFIJO_MEDIA = "/media/_plantillas";

export type PlantillaGuardada = {
  id: string;
  nombre: string;
  /** ISO 8601 */
  creada: string;
  pagina: Pagina;
};

const archivo = (id: string) => {
  if (!ID_RE.test(id)) throw new ErrorAdmin("Identificador de plantilla no válido.");
  return path.join(DIR, `${id}.json`);
};

function limpiarNombre(nombre: unknown) {
  const n = typeof nombre === "string" ? nombre.trim().replace(/\s+/g, " ") : "";
  if (!n) throw new ErrorAdmin("Escribe un nombre para la plantilla.");
  if (n.length > 60) throw new ErrorAdmin("El nombre admite hasta 60 caracteres.");
  return n;
}

function idDesde(nombre: string) {
  const base =
    nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 30) || "plantilla";
  let id = base;
  for (let n = 2; fs.existsSync(archivo(id)); n++) id = `${base}-${n}`;
  return id;
}

/** Una plantilla no debe llevar enlaces a números de página de una edición concreta. */
function sinReferenciasDePagina(p: Pagina): Pagina {
  const copia = structuredClone(p) as Pagina;
  delete copia.enlace;
  delete copia.destacados;
  // El identificador es único dentro de una edición: la plantilla no lo lleva.
  delete copia.ancla;
  if (copia.elementos)
    copia.elementos = copia.elementos.map((e) => {
      let el = e;
      if (typeof el.enlace === "number" || (typeof el.enlace === "string" && el.enlace.startsWith("#"))) {
        const { enlace, ...resto } = el;
        void enlace;
        el = resto as typeof e;
      }
      // {p:identificador} apunta a una página de la edición de origen; {n} (el número de la propia página) sí sirve.
      if (el.tipo === "texto" && el.texto.includes("{p:")) el = { ...el, texto: el.texto.replace(/\{p:[\w-]+(?::\d)?\}/g, "—") };
      return el;
    });
  return copia;
}

/** Copia a la carpeta de la plantilla los archivos de /media/ que use, y reescribe sus rutas. */
function copiarMedios(valor: unknown, id: string, copiados: Map<string, string>): unknown {
  if (Array.isArray(valor)) return valor.map((v) => copiarMedios(v, id, copiados));
  if (valor && typeof valor === "object") {
    const salida: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      if ((k === "src" || k === "poster") && typeof v === "string" && v.startsWith("/media/") && !v.startsWith(`${PREFIJO_MEDIA}/${id}/`)) {
        salida[k] = copiarArchivo(v, id, copiados);
      } else salida[k] = copiarMedios(v, id, copiados);
    }
    return salida;
  }
  return valor;
}

function copiarArchivo(ruta: string, id: string, copiados: Map<string, string>): string {
  const ya = copiados.get(ruta);
  if (ya) return ya;
  const origen = path.resolve(DIR_MEDIA, ruta.replace(/^\/media\//, ""));
  // Solo archivos dentro de public/media; si no existe, se deja la ruta tal cual.
  if (!origen.startsWith(DIR_MEDIA + path.sep) || !fs.existsSync(origen) || !fs.statSync(origen).isFile()) return ruta;
  const destDir = path.join(DIR_MEDIA, "_plantillas", id);
  fs.mkdirSync(destDir, { recursive: true });
  const ext = path.extname(origen);
  const base = path.basename(origen, ext);
  let nombre = `${base}${ext}`;
  for (let n = 2; fs.existsSync(path.join(destDir, nombre)); n++) nombre = `${base}-${n}${ext}`;
  fs.copyFileSync(origen, path.join(destDir, nombre));
  const nueva = `${PREFIJO_MEDIA}/${id}/${nombre}`;
  copiados.set(ruta, nueva);
  return nueva;
}

export function listarPlantillas(): PlantillaGuardada[] {
  if (!fs.existsSync(DIR)) return [];
  const lista: PlantillaGuardada[] = [];
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
    const id = f.replace(/\.json$/, "");
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
      lista.push({
        id,
        nombre: String(raw.nombre ?? id),
        creada: String(raw.creada ?? ""),
        pagina: validarPagina(raw.pagina, `Plantilla "${id}"`, 1000),
      });
    } catch {
      // Una plantilla dañada no debe romper el listado.
    }
  }
  return lista.sort((a, b) => b.creada.localeCompare(a.creada));
}

export function guardarPlantilla(nombreRaw: unknown, paginaRaw: unknown): PlantillaGuardada {
  const nombre = limpiarNombre(nombreRaw);
  let pagina: Pagina;
  try {
    pagina = validarPagina(limpiar(paginaRaw), "Plantilla", 1000);
  } catch (e) {
    throw new ErrorAdmin(e instanceof Error ? e.message.replace(/^\[ediciones\] /, "") : String(e));
  }
  fs.mkdirSync(DIR, { recursive: true });
  const id = idDesde(nombre);
  const limpia = copiarMedios(sinReferenciasDePagina(pagina), id, new Map()) as Pagina;
  const plantilla: PlantillaGuardada = { id, nombre, creada: new Date().toISOString(), pagina: limpia };
  const { id: _id, ...contenido } = plantilla;
  void _id;
  fs.writeFileSync(archivo(id), JSON.stringify(contenido, null, 2) + "\n", "utf8");
  return plantilla;
}

export function renombrarPlantilla(id: string, nombreRaw: unknown) {
  const nombre = limpiarNombre(nombreRaw);
  const ruta = archivo(id);
  if (!fs.existsSync(ruta)) throw new ErrorAdmin("La plantilla no existe.", 404);
  const raw = JSON.parse(fs.readFileSync(ruta, "utf8"));
  fs.writeFileSync(ruta, JSON.stringify({ ...raw, nombre }, null, 2) + "\n", "utf8");
}

export function borrarPlantilla(id: string) {
  const ruta = archivo(id);
  if (!fs.existsSync(ruta)) throw new ErrorAdmin("La plantilla no existe.", 404);
  fs.rmSync(ruta);
  // Sus imágenes eran copias propias: se pueden quitar sin afectar a ninguna edición.
  const medios = path.join(DIR_MEDIA, "_plantillas", id);
  if (medios.startsWith(path.join(DIR_MEDIA, "_plantillas") + path.sep) && fs.existsSync(medios)) {
    fs.rmSync(medios, { recursive: true, force: true });
  }
}
