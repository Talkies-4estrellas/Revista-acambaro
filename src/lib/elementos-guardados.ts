import fs from "node:fs";
import path from "node:path";
import { ErrorAdmin, ID_RE } from "./admin";
import { validarPagina } from "./ediciones";
import { limpiar, type Elemento, type ElementoGuardado, type Pagina } from "./esquema";
import { copiarMedios, sinReferenciasDePagina } from "./plantillas";

/**
 * «Mis elementos»: grupos de elementos que el usuario guarda para reutilizarlos en cualquier edición (el anuncio de un cliente, una firma, un sello…).
 * content/elementos/<id>.json, compartidos por todas las ediciones. Como en las plantillas, las imágenes se copian a public/media/_plantillas/el-<id>/
 * para que sigan funcionando aunque cambie o se borre la edición de origen, y se quitan los enlaces a números de página y las referencias {p:…}.
 */

const DIR = path.join(process.cwd(), "content", "elementos");
const DIR_MEDIA = path.join(process.cwd(), "public", "media");
const MAX_ELEMENTOS = 80;

const archivo = (id: string) => {
  if (!ID_RE.test(id)) throw new ErrorAdmin("Identificador de elemento no válido.");
  return path.join(DIR, `${id}.json`);
};

function limpiarNombre(nombre: unknown) {
  const n = typeof nombre === "string" ? nombre.trim().replace(/\s+/g, " ") : "";
  if (!n) throw new ErrorAdmin("Escribe un nombre.");
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
      .slice(0, 30) || "elemento";
  let id = base;
  for (let n = 2; fs.existsSync(archivo(id)); n++) id = `${base}-${n}`;
  return id;
}

/** Los elementos viajan envueltos en una página de lienzo para reutilizar toda la validación de la edición. */
const envolver = (elementos: unknown): Pagina => ({ plantilla: "lienzo", transicion: "fundido", titulo: "Mis elementos", fondo: "papel", alto: 8000, elementos }) as Pagina;

export function listarElementos(): ElementoGuardado[] {
  if (!fs.existsSync(DIR)) return [];
  const lista: ElementoGuardado[] = [];
  for (const f of fs.readdirSync(DIR).filter((x) => x.endsWith(".json"))) {
    const id = f.replace(/\.json$/, "");
    try {
      const raw = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
      const pagina = validarPagina(envolver(raw.elementos), `Elementos "${id}"`, 1000);
      lista.push({ id, nombre: String(raw.nombre ?? id), creada: String(raw.creada ?? ""), w: Number(raw.w) || 100, h: Number(raw.h) || 100, elementos: pagina.elementos ?? [] });
    } catch {
      // Un elemento dañado no debe romper el listado.
    }
  }
  return lista.sort((a, b) => b.creada.localeCompare(a.creada));
}

export function guardarElemento(nombreRaw: unknown, elementosRaw: unknown): ElementoGuardado {
  const nombre = limpiarNombre(nombreRaw);
  if (!Array.isArray(elementosRaw) || elementosRaw.length === 0) throw new ErrorAdmin("No hay elementos seleccionados para guardar.");
  if (elementosRaw.length > MAX_ELEMENTOS) throw new ErrorAdmin(`Se pueden guardar hasta ${MAX_ELEMENTOS} elementos a la vez.`);

  // Identificadores propios (la validación los pide) y sin referencias a páginas de la edición de origen.
  const conId = (elementosRaw as Record<string, unknown>[]).map((e, i) => ({ ...e, id: `e${i + 1}` }));
  let elementos: Elemento[];
  try {
    const pagina = validarPagina(limpiar(envolver(conId)), "Elementos", 1000);
    elementos = sinReferenciasDePagina(pagina).elementos ?? [];
  } catch (e) {
    throw new ErrorAdmin(e instanceof Error ? e.message.replace(/^\[ediciones\] /, "") : String(e));
  }

  // Se mueve el conjunto a la esquina (0, 0) y se mide su caja.
  const minX = Math.min(...elementos.map((e) => e.x));
  const minY = Math.min(...elementos.map((e) => e.y));
  const maxX = Math.max(...elementos.map((e) => e.x + e.w));
  const maxY = Math.max(...elementos.map((e) => e.y + e.h));
  const movidos = elementos.map((e) => ({ ...e, x: Math.round(e.x - minX), y: Math.round(e.y - minY) })) as Elemento[];

  fs.mkdirSync(DIR, { recursive: true });
  const id = idDesde(nombre);
  const propios = copiarMedios(movidos, `el-${id}`, new Map()) as Elemento[];
  const guardado: ElementoGuardado = { id, nombre, creada: new Date().toISOString(), w: Math.round(maxX - minX), h: Math.round(maxY - minY), elementos: propios };
  const { id: _id, ...contenido } = guardado;
  void _id;
  fs.writeFileSync(archivo(id), JSON.stringify(contenido, null, 2) + "\n", "utf8");
  return guardado;
}

export function renombrarElemento(id: string, nombreRaw: unknown) {
  const nombre = limpiarNombre(nombreRaw);
  const ruta = archivo(id);
  if (!fs.existsSync(ruta)) throw new ErrorAdmin("El elemento no existe.", 404);
  const raw = JSON.parse(fs.readFileSync(ruta, "utf8"));
  fs.writeFileSync(ruta, JSON.stringify({ ...raw, nombre }, null, 2) + "\n", "utf8");
}

export function borrarElemento(id: string) {
  const ruta = archivo(id);
  if (!fs.existsSync(ruta)) throw new ErrorAdmin("El elemento no existe.", 404);
  fs.rmSync(ruta);
  // Sus imágenes eran copias propias: se pueden quitar sin afectar a ninguna edición.
  const base = path.join(DIR_MEDIA, "_plantillas");
  const medios = path.join(base, `el-${id}`);
  if (medios.startsWith(base + path.sep) && fs.existsSync(medios)) fs.rmSync(medios, { recursive: true, force: true });
}
