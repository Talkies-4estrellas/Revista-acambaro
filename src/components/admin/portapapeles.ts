/**
 * Copiar y pegar elementos del lienzo. Los elementos viajan en el portapapeles del sistema como texto JSON con
 * una marca, así se pueden pegar en otra página, otra edición o incluso otra pestaña del panel. Además se
 * guarda una copia interna por si el navegador no deja acceder al portapapeles.
 */
import { CATALOGO } from "@/lib/catalogo-iconos";
import type { Elemento } from "@/lib/esquema";

export const MARCA_PORTAPAPELES = "revista-acambaro/elementos";
const MAX_ELEMENTOS = 200;
const TIPOS = ["texto", "imagen", "video", "forma", "icono"];

export type Carga = {
  marca: typeof MARCA_PORTAPAPELES;
  v: 1;
  /** Edición de la que se copió (los enlaces a números de página solo valen en ella). */
  edicion: string;
  elementos: Elemento[];
};

let interno: Carga | null = null;
/** El texto parece venir de la revista (aunque su contenido pueda no ser válido). */
export const pareceDeLaRevista = (texto: string) => texto.includes(MARCA_PORTAPAPELES);

export const guardarInterno = (c: Carga) => {
  interno = c;
};
export const leerInterno = () => interno;

export const aCarga = (edicion: string, elementos: Elemento[]): Carga => ({
  marca: MARCA_PORTAPAPELES,
  v: 1,
  edicion,
  elementos,
});

/**
 * Lee el texto del portapapeles y devuelve los elementos que contiene, o null si no es de la revista.
 * El contenido viene de fuera, así que se descarta lo que no tenga la forma esperada; la validación completa
 * se repite al guardar la edición.
 */
export function desdeTexto(texto: string): Carga | null {
  if (!texto || texto.length > 5_000_000 || !texto.includes(MARCA_PORTAPAPELES)) return null;
  try {
    const c = JSON.parse(texto);
    if (!c || c.marca !== MARCA_PORTAPAPELES || !Array.isArray(c.elementos)) return null;
    const elementos = (c.elementos as unknown[])
      .filter((e): e is Elemento => {
        if (!e || typeof e !== "object") return false;
        const o = e as Record<string, unknown>;
        if (typeof o.tipo !== "string" || !TIPOS.includes(o.tipo)) return false;
        if (![o.x, o.y, o.w, o.h].every((n) => typeof n === "number" && Number.isFinite(n))) return false;
        if ((o.w as number) <= 0 || (o.h as number) <= 0) return false;
        if (o.tipo === "icono" && !(typeof o.icono === "string" && o.icono in CATALOGO)) return false;
        if (o.tipo === "texto" && typeof o.texto !== "string") return false;
        return true;
      })
      .slice(0, MAX_ELEMENTOS);
    if (elementos.length === 0) return null;
    return { marca: MARCA_PORTAPAPELES, v: 1, edicion: String(c.edicion ?? ""), elementos };
  } catch {
    return null;
  }
}
