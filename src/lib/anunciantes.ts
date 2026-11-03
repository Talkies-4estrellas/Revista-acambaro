import fs from "node:fs";
import path from "node:path";
import { getEdiciones, type Edicion } from "./ediciones";
import { SECCION_PUBLICIDAD } from "./esquema";
import { leerClics, type RegistroClics } from "./clics";
import { leerVistas, type RegistroVistas } from "./vistas";

/**
 * Anunciantes de la revista y los números de sus anuncios. Se guardan en content/anunciantes.json (privado: lleva contactos;
 * no se sube a git, como suscriptores.json). Las vistas y los clics salen de vistas.json y clics.json, que ya se registran.
 */

export type Anunciante = {
  id: string;
  nombre: string;
  /** Teléfono, WhatsApp, correo o persona de contacto (texto libre). */
  contacto?: string;
  notas?: string;
  /** Día en que termina lo contratado (AAAA-MM-DD); el panel avisa cuando se acerca o ya pasó. */
  vence?: string;
  /** Páginas donde sale su anuncio. */
  anuncios: { edicion: string; pagina: number }[];
  /**
   * Partes de la dirección que identifican SUS enlaces («hobbyrieles.mx», «wa.me/5214171234567»). En una página con varios anuncios
   * solo cuentan los clics a esos enlaces; si está vacío, cuentan todos los clics de sus páginas.
   */
  enlaces: string[];
  creado: string;
};

const ARCHIVO = path.join(process.cwd(), "content", "anunciantes.json");
const ID_RE = /^[a-z0-9][a-z0-9-]{0,39}$/;
const FECHA_RE = /^\d{4}-\d{2}-\d{2}$/;

export class ErrorAnunciante extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function leerAnunciantes(): Anunciante[] {
  if (!fs.existsSync(ARCHIVO)) return [];
  try {
    const raw = JSON.parse(fs.readFileSync(ARCHIVO, "utf8"));
    return Array.isArray(raw) ? raw.filter((a) => a && typeof a.id === "string" && typeof a.nombre === "string") : [];
  } catch {
    return [];
  }
}

function escribir(lista: Anunciante[]) {
  fs.mkdirSync(path.dirname(ARCHIVO), { recursive: true });
  const tmp = `${ARCHIVO}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(lista, null, 2) + "\n", "utf8");
  fs.renameSync(tmp, ARCHIVO);
}

/** «Hobby Rieles» → «hobby-rieles» (sin acentos), y un número si ya existe. */
function idDesdeNombre(nombre: string, existentes: Set<string>) {
  const base =
    nombre
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 34) || "anunciante";
  let id = base;
  for (let i = 2; existentes.has(id); i++) id = `${base}-${i}`;
  return id;
}

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Valida lo que manda el formulario y devuelve los campos limpios (sin id ni fecha de creación). */
function limpiarDatos(b: Record<string, unknown>): Omit<Anunciante, "id" | "creado"> {
  const nombre = texto(b.nombre, 80);
  if (!nombre) throw new ErrorAnunciante("Escribe el nombre del anunciante.");
  const vence = texto(b.vence, 10);
  if (vence && !FECHA_RE.test(vence)) throw new ErrorAnunciante("La fecha de vencimiento no es válida.");
  const anuncios = (Array.isArray(b.anuncios) ? b.anuncios : [])
    .map((a) => ({ edicion: texto((a as { edicion?: unknown })?.edicion, 40), pagina: Number((a as { pagina?: unknown })?.pagina) }))
    .filter((a) => /^[a-z0-9][a-z0-9_-]{0,39}$/i.test(a.edicion) && Number.isInteger(a.pagina) && a.pagina >= 1 && a.pagina <= 500);
  const unicos = [...new Map(anuncios.map((a) => [`${a.edicion}|${a.pagina}`, a])).values()].slice(0, 200);
  const enlaces = [...new Set((Array.isArray(b.enlaces) ? b.enlaces : String(b.enlaces ?? "").split(/[\n,]/)).map((x) => texto(x, 120).toLowerCase()).filter(Boolean))].slice(0, 20);
  return {
    nombre,
    ...(texto(b.contacto, 160) ? { contacto: texto(b.contacto, 160) } : {}),
    ...(texto(b.notas, 1000) ? { notas: texto(b.notas, 1000) } : {}),
    ...(vence ? { vence } : {}),
    anuncios: unicos,
    enlaces,
  };
}

export function crearAnunciante(b: Record<string, unknown>): Anunciante {
  const lista = leerAnunciantes();
  const datos = limpiarDatos(b);
  const nuevo: Anunciante = { id: idDesdeNombre(datos.nombre, new Set(lista.map((a) => a.id))), ...datos, creado: new Date().toISOString() };
  escribir([...lista, nuevo]);
  return nuevo;
}

export function actualizarAnunciante(id: string, b: Record<string, unknown>): Anunciante {
  const lista = leerAnunciantes();
  const i = lista.findIndex((a) => a.id === id);
  if (!ID_RE.test(id) || i < 0) throw new ErrorAnunciante("Ese anunciante no existe.", 404);
  const nuevo: Anunciante = { id, ...limpiarDatos(b), creado: lista[i].creado };
  lista[i] = nuevo;
  escribir(lista);
  return nuevo;
}

export function borrarAnunciante(id: string) {
  const lista = leerAnunciantes();
  if (!lista.some((a) => a.id === id)) throw new ErrorAnunciante("Ese anunciante no existe.", 404);
  escribir(lista.filter((a) => a.id !== id));
}

/* ------------------------------ Números ------------------------------ */

const DIA = 86_400_000;
const hoyIso = (ahora = new Date()) => ahora.toISOString().slice(0, 10);
const diasAtras = (n: number, ahora = new Date()) => new Date(ahora.getTime() - n * DIA).toISOString().slice(0, 10);

/** Una página de publicidad de una edición (para elegirla en el formulario y mostrarla en el reporte). */
export type PaginaAnuncio = { edicion: string; pagina: number; titulo: string; tema: string; numero: string; publicada: boolean; muestra: boolean };

/** Todas las páginas de la sección Publicidad, de todas las ediciones (también borradores). */
export function paginasDePublicidad(ediciones: Edicion[] = getEdiciones()): PaginaAnuncio[] {
  return ediciones.flatMap((e) =>
    e.paginas
      .map((p, i) => ({ p, n: i + 1 }))
      .filter(({ p }) => p.seccion === SECCION_PUBLICIDAD)
      .map(({ p, n }) => ({ edicion: e.id, pagina: n, titulo: p.titulo ?? `Página ${n}`, tema: e.tema, numero: e.numero, publicada: !!e.publicada, muestra: !!e.muestra })),
  );
}

export type NumerosAnuncio = PaginaAnuncio & { existe: boolean; vistas: { d7: number; d30: number; total: number }; clics: { d7: number; d30: number; total: number } };
export type NumerosAnunciante = {
  vistas: { d7: number; d30: number; total: number };
  clics: { d7: number; d30: number; total: number };
  /** Clics ÷ vistas en todo el periodo (null si no hay vistas). */
  tasa: number | null;
  anuncios: NumerosAnuncio[];
  /** Clics por enlace (para ver cuál le funcionó mejor). */
  porEnlace: { url: string; etiqueta: string; total: number; d30: number }[];
  /** Vistas y clics de cada uno de los últimos 30 días (del más antiguo al de hoy). */
  dias: { dia: string; vistas: number; clics: number }[];
  /** Días que faltan para que venza (negativo: ya venció); null si no tiene fecha. */
  venceEn: number | null;
};

const sumaDesde = (dias: Record<string, number>, desde: string) => Object.entries(dias).reduce((s, [d, c]) => (d >= desde ? s + c : s), 0);

/** ¿Este clic es del anunciante? Si tiene enlaces propios, solo los que coinciden; si no, todos los de sus páginas. */
const esSuyo = (a: Anunciante, r: RegistroClics) => a.enlaces.length === 0 || a.enlaces.some((e) => r.url.toLowerCase().includes(e));

export function numerosDe(
  a: Anunciante,
  datos: { vistas?: RegistroVistas[]; clics?: RegistroClics[]; ediciones?: Edicion[]; ahora?: Date } = {},
): NumerosAnunciante {
  const ahora = datos.ahora ?? new Date();
  const vistas = datos.vistas ?? leerVistas();
  const clics = datos.clics ?? leerClics();
  const ediciones = datos.ediciones ?? getEdiciones();
  const d7 = diasAtras(6, ahora);
  const d30 = diasAtras(29, ahora);
  const clave = (e: string, p: number) => `${e}|${p}`;
  const suyas = new Set(a.anuncios.map((x) => clave(x.edicion, x.pagina)));

  const anuncios: NumerosAnuncio[] = a.anuncios.map((x) => {
    // Cualquier página de la edición (normalmente de Publicidad, pero también si se le quitó la sección).
    const ed = ediciones.find((e) => e.id === x.edicion);
    const pag = ed?.paginas[x.pagina - 1];
    const info: PaginaAnuncio | undefined = ed && pag ? { edicion: ed.id, pagina: x.pagina, titulo: pag.titulo ?? `Página ${x.pagina}`, tema: ed.tema, numero: ed.numero, publicada: !!ed.publicada, muestra: !!ed.muestra } : undefined;
    const v = vistas.filter((r) => r.edicion === x.edicion && r.pagina === x.pagina);
    const c = clics.filter((r) => r.edicion === x.edicion && r.pagina === x.pagina && esSuyo(a, r));
    return {
      ...(info ?? { edicion: x.edicion, pagina: x.pagina, titulo: `Página ${x.pagina}`, tema: x.edicion, numero: "", publicada: false, muestra: false }),
      existe: !!info,
      vistas: { d7: v.reduce((s, r) => s + sumaDesde(r.dias, d7), 0), d30: v.reduce((s, r) => s + sumaDesde(r.dias, d30), 0), total: v.reduce((s, r) => s + r.total, 0) },
      clics: { d7: c.reduce((s, r) => s + sumaDesde(r.dias, d7), 0), d30: c.reduce((s, r) => s + sumaDesde(r.dias, d30), 0), total: c.reduce((s, r) => s + r.total, 0) },
    };
  });
  const suma = (k: "vistas" | "clics") => ({
    d7: anuncios.reduce((s, x) => s + x[k].d7, 0),
    d30: anuncios.reduce((s, x) => s + x[k].d30, 0),
    total: anuncios.reduce((s, x) => s + x[k].total, 0),
  });
  const totV = suma("vistas");
  const totC = suma("clics");

  const susClics = clics.filter((r) => suyas.has(clave(r.edicion, r.pagina)) && esSuyo(a, r));
  const porUrl = new Map<string, { url: string; etiqueta: string; total: number; d30: number }>();
  for (const r of susClics) {
    const p = porUrl.get(r.url) ?? { url: r.url, etiqueta: r.etiqueta, total: 0, d30: 0 };
    p.total += r.total;
    p.d30 += sumaDesde(r.dias, d30);
    porUrl.set(r.url, p);
  }

  const susVistas = vistas.filter((r) => suyas.has(clave(r.edicion, r.pagina)));
  const dias = Array.from({ length: 30 }, (_, i) => {
    const dia = diasAtras(29 - i, ahora);
    return { dia, vistas: susVistas.reduce((s, r) => s + (r.dias[dia] ?? 0), 0), clics: susClics.reduce((s, r) => s + (r.dias[dia] ?? 0), 0) };
  });

  return {
    vistas: totV,
    clics: totC,
    tasa: totV.total > 0 ? totC.total / totV.total : null,
    anuncios,
    porEnlace: [...porUrl.values()].sort((x, y) => y.total - x.total),
    dias,
    venceEn: a.vence ? Math.round((Date.parse(`${a.vence}T12:00:00Z`) - Date.parse(`${hoyIso(ahora)}T12:00:00Z`)) / DIA) : null,
  };
}
