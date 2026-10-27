/**
 * Cuentagotas del lienzo: el color que se ve en un punto de la pantalla, pero solo de lo que hay DENTRO del área de trabajo
 * (la hoja y todo lo que se vea sobre el fondo gris, aunque un elemento sobresalga de la hoja; no los botones y paneles del
 * editor, como haría el cuentagotas del navegador). Recorre lo que hay bajo el punto, de arriba abajo: una foto (lee el píxel
 * que se ve), el texto (su color) o el primer fondo que no sea transparente, y por último el fondo de la hoja si el punto cae
 * sobre ella. El fondo gris del área de trabajo no es un color de la revista: ahí no se puede elegir. Es una aproximación: no incluye filtros ni capas translúcidas de la foto.
 */

const cacheFotos = new WeakMap<HTMLImageElement, { lienzo: HTMLCanvasElement; k: number } | null>();

function rgbAHex(css: string): string | null {
  const m = /^rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)(?:[ ,/]+([\d.]+%?))?\s*\)$/.exec(css.trim());
  if (!m) return null;
  const alfa = m[4] === undefined ? 1 : m[4].endsWith("%") ? parseFloat(m[4]) / 100 : parseFloat(m[4]);
  if (alfa < 0.05) return null;
  return "#" + [m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, "0")).join("");
}

/** La foto reducida (máx. 512 px) en un lienzo, para leer píxeles sin volver a dibujarla cada vez. */
function copiaDeFoto(img: HTMLImageElement) {
  if (cacheFotos.has(img)) return cacheFotos.get(img)!;
  let r: { lienzo: HTMLCanvasElement; k: number } | null = null;
  try {
    if (img.complete && img.naturalWidth > 0) {
      const k = Math.min(1, 512 / Math.max(img.naturalWidth, img.naturalHeight));
      const lienzo = document.createElement("canvas");
      lienzo.width = Math.max(1, Math.round(img.naturalWidth * k));
      lienzo.height = Math.max(1, Math.round(img.naturalHeight * k));
      const ctx = lienzo.getContext("2d", { willReadFrequently: true });
      ctx?.drawImage(img, 0, 0, lienzo.width, lienzo.height);
      ctx?.getImageData(0, 0, 1, 1); // falla si la foto «mancha» el lienzo (otro sitio)
      r = ctx ? { lienzo, k } : null;
    }
  } catch {
    r = null;
  }
  cacheFotos.set(img, r);
  return r;
}

/** El píxel de una foto tal como se ve (con su ajuste «cubrir» o «contener» y su enfoque), o null si ahí no hay foto. */
function pixelDeFoto(img: HTMLImageElement, x: number, y: number): string | null {
  const copia = copiaDeFoto(img);
  if (!copia) return null;
  const r = img.getBoundingClientRect();
  const cs = getComputedStyle(img);
  const nw = img.naturalWidth;
  const nh = img.naturalHeight;
  const escala = cs.objectFit === "contain" ? Math.min(r.width / nw, r.height / nh) : cs.objectFit === "fill" ? 0 : Math.max(r.width / nw, r.height / nh);
  const [px, py] = (cs.objectPosition || "50% 50%").split(" ").map((v) => (v.endsWith("%") ? parseFloat(v) / 100 : 0.5));
  let u: number;
  let v: number;
  if (escala === 0) {
    u = ((x - r.left) / r.width) * nw;
    v = ((y - r.top) / r.height) * nh;
  } else {
    const dw = nw * escala;
    const dh = nh * escala;
    u = (x - r.left - (r.width - dw) * px) / escala;
    v = (y - r.top - (r.height - dh) * py) / escala;
  }
  if (u < 0 || v < 0 || u >= nw || v >= nh) return null;
  const d = copia.lienzo.getContext("2d", { willReadFrequently: true })!.getImageData(Math.min(copia.lienzo.width - 1, Math.floor(u * copia.k)), Math.min(copia.lienzo.height - 1, Math.floor(v * copia.k)), 1, 1).data;
  if (d[3] < 13) return null;
  return "#" + [d[0], d[1], d[2]].map((c) => c.toString(16).padStart(2, "0")).join("");
}

/** ¿El punto cae sobre alguna línea de texto de este elemento (sus propios textos, no los de sus hijos)? */
function sobreTexto(el: Element, x: number, y: number): boolean {
  for (const n of Array.from(el.childNodes)) {
    if (n.nodeType !== Node.TEXT_NODE || !n.textContent?.trim()) continue;
    const rango = document.createRange();
    rango.selectNodeContents(n);
    for (const r of Array.from(rango.getClientRects())) if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return true;
  }
  return false;
}

/** El color visible en (x, y) dentro del `area` de trabajo (`hoja` es la hoja, dentro de ella); null si ahí no hay nada que elegir. */
export function colorEnPunto(area: HTMLElement, hoja: HTMLElement | null, x: number, y: number): string | null {
  const caja = area.getBoundingClientRect();
  if (x < caja.left || x > caja.right || y < caja.top || y > caja.bottom) return null;
  for (const el of document.elementsFromPoint(x, y)) {
    if (el === area) break; // el fondo gris del área de trabajo no cuenta
    if (!area.contains(el)) continue;
    if (el instanceof HTMLImageElement) {
      const c = pixelDeFoto(el, x, y);
      if (c) return c;
      continue;
    }
    // Las figuras e iconos son SVG: su color está en el relleno (o el trazo), no en el fondo.
    if (el instanceof SVGElement) {
      if (el instanceof SVGSVGElement) continue;
      const cs = getComputedStyle(el);
      const c = rgbAHex(cs.fill) ?? rgbAHex(cs.stroke);
      if (c) return c;
      continue;
    }
    // Tiradores y guías de la selección del editor: no son colores de la hoja.
    if (el.closest("[data-sin-color]") || String(el.getAttribute("class") ?? "").includes("border-terracota")) continue;
    const cs = getComputedStyle(el);
    if (sobreTexto(el, x, y) && cs.webkitTextFillColor !== "rgba(0, 0, 0, 0)") {
      const c = rgbAHex(cs.color);
      if (c) return c;
    }
    const fondo = rgbAHex(cs.backgroundColor);
    if (fondo && cs.backgroundImage === "none") return fondo;
  }
  if (hoja) {
    const h = hoja.getBoundingClientRect();
    if (x >= h.left && x <= h.right && y >= h.top && y <= h.bottom) return rgbAHex(getComputedStyle(hoja).backgroundColor);
  }
  return null;
}
