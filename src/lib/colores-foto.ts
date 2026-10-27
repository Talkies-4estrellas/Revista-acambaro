/**
 * Colores representativos de una foto (para el selector de color: «Colores de las fotos»). Se lee la foto en un lienzo
 * invisible, reducida, y se agrupan los píxeles parecidos (k-medias, con arranque determinista) para quedarse con los
 * colores que más aparecen. Solo funciona en el navegador y con fotos del propio sitio (/media/…): una de otra dirección web
 * no deja leer sus píxeles y da una lista vacía.
 */

type Rgb = [number, number, number];

const LADO = 64; // lado mayor de la foto reducida
const GRUPOS = 6;
const ITERACIONES = 8;
const MIN_PARTE = 0.02; // un color debe cubrir al menos el 2 % de la foto
const DISTANCIA_MIN = 40; // y diferenciarse de los ya elegidos (distancia en RGB, de 0 a 441)

const dist2 = (a: Rgb, b: Rgb) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
const hex = (c: Rgb) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

/** Los colores principales de una lista de píxeles RGBA, del que más aparece al que menos. */
export function coloresPrincipales(rgba: Uint8ClampedArray, k = GRUPOS): string[] {
  const px: Rgb[] = [];
  for (let i = 0; i < rgba.length; i += 4) if (rgba[i + 3] >= 128) px.push([rgba[i], rgba[i + 1], rgba[i + 2]]);
  if (px.length === 0) return [];

  // Arranque: el píxel más cercano a la media y, después, siempre el más lejano de los ya elegidos.
  const media: Rgb = [0, 0, 0];
  for (const p of px) for (let j = 0; j < 3; j++) media[j] += p[j] / px.length;
  let primero = px[0];
  for (const p of px) if (dist2(p, media) < dist2(primero, media)) primero = p;
  const centros: Rgb[] = [[...primero]];
  const minimas = px.map((p) => dist2(p, centros[0]));
  while (centros.length < Math.min(k, px.length)) {
    let mejor = 0;
    for (let i = 1; i < px.length; i++) if (minimas[i] > minimas[mejor]) mejor = i;
    if (minimas[mejor] === 0) break; // ya no hay colores distintos
    centros.push([...px[mejor]]);
    for (let i = 0; i < px.length; i++) minimas[i] = Math.min(minimas[i], dist2(px[i], px[mejor]));
  }

  const cuenta = new Array<number>(centros.length).fill(0);
  for (let it = 0; it < ITERACIONES; it++) {
    const suma = centros.map(() => [0, 0, 0]);
    cuenta.fill(0);
    for (const p of px) {
      let c = 0;
      let d = Infinity;
      for (let j = 0; j < centros.length; j++) {
        const dj = dist2(p, centros[j]);
        if (dj < d) {
          d = dj;
          c = j;
        }
      }
      cuenta[c]++;
      for (let j = 0; j < 3; j++) suma[c][j] += p[j];
    }
    for (let c = 0; c < centros.length; c++) if (cuenta[c]) centros[c] = [suma[c][0] / cuenta[c], suma[c][1] / cuenta[c], suma[c][2] / cuenta[c]];
  }

  const elegidos: Rgb[] = [];
  centros
    .map((c, i) => ({ c, n: cuenta[i] }))
    .sort((a, b) => b.n - a.n)
    .forEach(({ c, n }) => {
      if (n / px.length < MIN_PARTE) return;
      if (elegidos.some((e) => dist2(e, c) < DISTANCIA_MIN ** 2)) return;
      elegidos.push(c);
    });
  return elegidos.map(hex);
}

const memoria = new Map<string, Promise<string[]>>();

/** Colores principales de la foto en `src` (se calculan una vez por foto). Lista vacía si no se puede leer. */
export function coloresDeFoto(src: string): Promise<string[]> {
  let p = memoria.get(src);
  if (!p) {
    p = (async () => {
      try {
        const img = new Image();
        img.decoding = "async";
        img.src = src;
        await img.decode();
        const k = Math.min(1, LADO / Math.max(img.naturalWidth, img.naturalHeight, 1));
        const w = Math.max(1, Math.round(img.naturalWidth * k));
        const h = Math.max(1, Math.round(img.naturalHeight * k));
        const lienzo = document.createElement("canvas");
        lienzo.width = w;
        lienzo.height = h;
        const ctx = lienzo.getContext("2d", { willReadFrequently: true });
        if (!ctx) return [];
        ctx.drawImage(img, 0, 0, w, h);
        return coloresPrincipales(ctx.getImageData(0, 0, w, h).data);
      } catch {
        return []; // sin conexión, formato no legible o foto de otro sitio
      }
    })();
    memoria.set(src, p);
  }
  return p;
}
