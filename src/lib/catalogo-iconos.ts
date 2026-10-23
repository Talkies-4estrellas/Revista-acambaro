import { FIGURAS, type DatosFigura } from "./figuras-datos";
import { ICONOS } from "./iconos-datos";

/** Todo lo que puede dibujar un elemento «icono»: los iconos del catálogo y las figuras decorativas («fig-…»). */
export type DatosCatalogo = Omit<DatosFigura, "caja"> & { caja?: readonly [number, number] };
export const CATALOGO: Record<string, DatosCatalogo> = { ...ICONOS, ...FIGURAS };
export const esFigura = (id: string) => id in FIGURAS;
