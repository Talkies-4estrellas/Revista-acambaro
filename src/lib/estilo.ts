import type { Elemento } from "./esquema";

/**
 * Copiar y pegar estilo (como la «brocha» de otros editores): se copia el aspecto de un elemento —no su contenido, posición, tamaño,
 * enlace ni texto— y se aplica a otros. Cada tipo de elemento tiene su lista de campos de estilo; al pegar solo se tocan los campos que
 * ambos tipos comparten, y un campo que el origen no tiene se quita del destino (pegar el estilo de un elemento liso deja liso al otro).
 */

/** Se aplican a cualquier elemento. */
const COMUNES = ["opacidad", "animacion", "salida", "hover", "bucle"] as const;
/** Borde y esquinas: texto, imagen, video y forma. */
const MARCO = ["borde", "colorBorde", "radio", "molde"] as const;

const POR_TIPO: Record<Elemento["tipo"], readonly string[]> = {
  texto: ["fuente", "tam", "peso", "cursiva", "color", "alinear", "vertical", "interlineado", "espaciado", "mayusculas", "fondo", "relleno", "sombraTexto", "degradado", "anguloDegradado", "borde", "colorBorde", "radio"],
  imagen: ["ajuste", "filtro", "capa", "sombra", "parallax", ...MARCO],
  video: [...MARCO],
  forma: ["color", "forma", "degradado", "anguloDegradado", ...MARCO],
  icono: ["color", "trazo"],
};

/** Campos de estilo de un tipo de elemento. */
export const camposDeEstilo = (tipo: Elemento["tipo"]): string[] => [...COMUNES, ...POR_TIPO[tipo]];

export type EstiloCopiado = {
  tipo: Elemento["tipo"];
  /** Valores del origen; un campo ausente significa «no tiene». */
  valores: Record<string, unknown>;
};

/** El estilo de un elemento, listo para guardar (copia profunda: no comparte objetos con el elemento). */
export function copiarEstilo(el: Elemento): EstiloCopiado {
  const valores: Record<string, unknown> = {};
  const origen = el as unknown as Record<string, unknown>;
  for (const campo of camposDeEstilo(el.tipo)) if (origen[campo] !== undefined) valores[campo] = structuredClone(origen[campo]);
  return { tipo: el.tipo, valores };
}

/** El elemento con el estilo aplicado (solo los campos que comparten el tipo de origen y el de destino). Devuelve cuántos campos cambiaron. */
export function aplicarEstilo(el: Elemento, estilo: EstiloCopiado): { elemento: Elemento; cambios: number } {
  const compartidos = camposDeEstilo(el.tipo).filter((c) => camposDeEstilo(estilo.tipo).includes(c));
  const nuevo = { ...el } as unknown as Record<string, unknown>;
  const actual = el as unknown as Record<string, unknown>;
  let cambios = 0;
  for (const campo of compartidos) {
    const v = estilo.valores[campo];
    if (JSON.stringify(v) === JSON.stringify(actual[campo])) continue;
    cambios++;
    if (v === undefined) delete nuevo[campo];
    else nuevo[campo] = structuredClone(v);
  }
  return { elemento: nuevo as unknown as Elemento, cambios };
}
