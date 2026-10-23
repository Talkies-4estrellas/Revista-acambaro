/**
 * Encuadre de una foto dentro de su marco: `enfoque` (x, y en %) y `zoom` (1 = sin acercar). El navegador coloca la foto con
 * `object-position: x% y%` (cubrir o contener) y el zoom se aplica con `transform: scale(zoom)` y `transform-origin: x% y%`; con el mismo
 * punto como posición y como centro del zoom, mover el enfoque de 0 a 100 recorre la foto completa, acercada o no.
 */

export type Enfoque = { x: number; y: number };

const acotar = (n: number) => Math.min(100, Math.max(0, n));

/** Ancho y alto con que se dibuja la foto dentro de la caja, antes del zoom. */
function tamanoDibujado(caja: { w: number; h: number }, natural: { w: number; h: number }, ajuste: "cubrir" | "contener") {
  const k = ajuste === "contener" ? Math.min(caja.w / natural.w, caja.h / natural.h) : Math.max(caja.w / natural.w, caja.h / natural.h);
  return { w: natural.w * k, h: natural.h * k };
}

/**
 * Nuevo enfoque al arrastrar la foto `dx`, `dy` (en las mismas unidades que la caja) con el puntero. La foto sigue al puntero.
 * Si en un eje no hay nada que mover (la foto cabe justa), ese eje no cambia.
 */
export function desplazarEnfoque(
  caja: { w: number; h: number },
  natural: { w: number; h: number },
  zoom: number,
  ajuste: "cubrir" | "contener",
  enfoque: Enfoque,
  dx: number,
  dy: number,
): Enfoque {
  if (!(natural.w > 0 && natural.h > 0 && caja.w > 0 && caja.h > 0)) return enfoque;
  const d = tamanoDibujado(caja, natural, ajuste);
  // Píxeles que se mueve la foto por cada unidad (0–1) de enfoque: la posición final es x·caja + (x·(caja − dibujado) − x·caja)·zoom → pendiente = caja − dibujado·zoom.
  const kx = caja.w - d.w * zoom;
  const ky = caja.h - d.h * zoom;
  return {
    x: Math.abs(kx) < 1 ? enfoque.x : acotar(Math.round((enfoque.x + (dx / kx) * 100) * 10) / 10),
    y: Math.abs(ky) < 1 ? enfoque.y : acotar(Math.round((enfoque.y + (dy / ky) * 100) * 10) / 10),
  };
}
