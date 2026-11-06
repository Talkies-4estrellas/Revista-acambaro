import { etiqueta, getPublicadas, hrefPagina, type Edicion, type Pagina } from "./ediciones";

/**
 * Los temas de la revista. Las páginas ya traen una `seccion` de texto libre («Gastronomía», «Yuriria»…); aquí se agrupan en cuatro
 * temas. Una sección nueva que no esté en estas listas no sale en ningún tema: basta con agregarla.
 */
export type Tema = { slug: string; nombre: string; texto: string; icono: string; secciones: string[] };

export const TEMAS: Tema[] = [
  {
    slug: "historia",
    nombre: "Historia",
    texto: "El ferrocarril, los barrios, los edificios y los hechos que explican cómo se hizo Acámbaro y su región.",
    icono: "landmark",
    secciones: [
      "Historia", "Patrimonio", "Fundación", "Memoria", "Legado", "Independencia", "Crónica", "El comienzo", "Contexto", "Chupícuaro", "Plazuelas", "Peralta", "El Cóporo",
      "Cañada de la Virgen", "Tzintzuntzan", "Catedral", "Acueducto", "La máquina", "Ingeniería", "Centro histórico", "Clavijero y Las Rosas",
    ],
  },
  {
    slug: "sabor",
    nombre: "Sabor",
    texto: "El pan, los guisos, los mercados y las recetas que se heredan en la mesa.",
    icono: "utensils",
    secciones: ["Sabor", "Gastronomía", "A la mesa", "Cocina", "La carta"],
  },
  {
    slug: "gente",
    nombre: "Gente",
    texto: "Oficios, familias, personajes y tradiciones: quienes hacen que el pueblo sea lo que es.",
    icono: "users",
    secciones: ["Gente", "Melchor Ocampo", "Cultura", "Tradiciones", "Fiestas", "Noche de ánimas", "La ofrenda", "Cervantino", "Las momias", "Callejón del Beso", "Leyenda de Acámbaro"],
  },
  {
    slug: "paisajes",
    nombre: "Paisajes",
    texto: "Lugares para visitar, caminos y rincones de Acámbaro y sus alrededores.",
    icono: "mountain",
    secciones: [
      "Paisajes", "Naturaleza", "Balnearios", "Para recorrerlo", "La ruta", "Alrededores", "Paseo", "Para ir", "Cómo llegar", "Relax", "Campo", "Guanajuato", "San Miguel de Allende",
      "Mineral de Pozos", "Dolores Hidalgo", "Salvatierra", "Yuriria", "Pátzcuaro",
    ],
  },
];

const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();
const POR_SECCION = new Map(TEMAS.flatMap((t) => t.secciones.map((s) => [normalizar(s), t.slug] as const)));

/** El tema de una sección, sin importar acentos ni mayúsculas; undefined si no pertenece a ninguno. */
export const temaDeSeccion = (seccion?: string) => (seccion ? POR_SECCION.get(normalizar(seccion)) : undefined);

export type PaginaDeTema = { edicion: Edicion; n: number; pagina: Pagina; titulo: string; href: string };

/** Páginas de un tema, de la edición más reciente a la más antigua. */
export function paginasDeTema(slug: string, ediciones: Edicion[] = getPublicadas()): PaginaDeTema[] {
  return ediciones.flatMap((ed) =>
    ed.paginas.flatMap((pagina, i) => (temaDeSeccion(pagina.seccion) === slug ? [{ edicion: ed, n: i + 1, pagina, titulo: etiqueta(pagina), href: hrefPagina(ed, i + 1) }] : [])),
  );
}

/** Para el final de una edición: las que más temas comparten con ella; a igual cantidad, las más recientes. */
export function edicionesRelacionadas(ed: Edicion, ediciones: Edicion[] = getPublicadas(), max = 3): Edicion[] {
  const temas = (e: Edicion) => new Set(e.paginas.map((p) => temaDeSeccion(p.seccion)).filter(Boolean));
  const propios = temas(ed);
  return ediciones
    .filter((e) => e.id !== ed.id)
    .map((e, orden) => ({ e, orden, comunes: [...temas(e)].filter((t) => propios.has(t)).length }))
    .sort((a, b) => b.comunes - a.comunes || a.orden - b.orden)
    .slice(0, max)
    .map((x) => x.e);
}
