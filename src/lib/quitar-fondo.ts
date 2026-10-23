/**
 * Quitar el fondo de color liso de una imagen (por ejemplo, el blanco de una foto de producto o el verde de un estudio).
 * Trabaja sobre los píxeles RGBA de un canvas y no usa ningún servicio externo. No es magia: funciona bien con fondos de un solo
 * color y mal con fondos con degradados, sombras o texturas.
 */

export type OpcionesFondo = {
  /** Color del fondo [r, g, b]. */
  color: readonly [number, number, number];
  /** Cuánto se parece un color al del fondo para quitarlo, de 0 a 100 (% de la distancia máxima entre dos colores). */
  tolerancia: number;
  /** Suavizado del borde, en píxeles (0 = borde duro). */
  suavizado: number;
  /** Solo quita el fondo conectado con los bordes de la imagen (así no se borra, por ejemplo, el blanco de una camisa). */
  conectado: boolean;
};

const MAX_DISTANCIA = Math.sqrt(3 * 255 * 255);

/** Desenfoque de caja separable sobre un mapa 0–1 (para suavizar el borde de la máscara). */
function desenfocar(m: Float32Array, ancho: number, alto: number, radio: number): Float32Array {
  if (radio < 1) return m;
  const tmp = new Float32Array(m.length);
  const out = new Float32Array(m.length);
  const n = radio * 2 + 1;
  for (let y = 0; y < alto; y++) {
    let suma = 0;
    for (let x = -radio; x <= radio; x++) suma += m[y * ancho + Math.min(ancho - 1, Math.max(0, x))];
    for (let x = 0; x < ancho; x++) {
      tmp[y * ancho + x] = suma / n;
      suma += m[y * ancho + Math.min(ancho - 1, x + radio + 1)] - m[y * ancho + Math.max(0, x - radio)];
    }
  }
  for (let x = 0; x < ancho; x++) {
    let suma = 0;
    for (let y = -radio; y <= radio; y++) suma += tmp[Math.min(alto - 1, Math.max(0, y)) * ancho + x];
    for (let y = 0; y < alto; y++) {
      out[y * ancho + x] = suma / n;
      suma += tmp[Math.min(alto - 1, y + radio + 1) * ancho + x] - tmp[Math.max(0, y - radio) * ancho + x];
    }
  }
  return out;
}

/**
 * Pone transparentes los píxeles del fondo (modifica `datos` en sitio). Devuelve la fracción de la imagen que quedó transparente (0–1).
 * `datos` es el arreglo RGBA de un `ImageData`.
 */
export function quitarFondo(datos: Uint8ClampedArray, ancho: number, alto: number, op: OpcionesFondo): number {
  const total = ancho * alto;
  const limite = (Math.max(0, Math.min(100, op.tolerancia)) / 100) * MAX_DISTANCIA;
  const [r0, g0, b0] = op.color;
  const parecido = (i: number) => {
    if (datos[i * 4 + 3] === 0) return true; // ya era transparente
    const dr = datos[i * 4] - r0;
    const dg = datos[i * 4 + 1] - g0;
    const db = datos[i * 4 + 2] - b0;
    return Math.sqrt(dr * dr + dg * dg + db * db) <= limite;
  };

  const fondo = new Uint8Array(total);
  if (op.conectado) {
    // Relleno desde los bordes: solo cuenta como fondo lo que se parece al color y está unido al borde.
    const cola = new Int32Array(total);
    let ini = 0;
    let fin = 0;
    const meter = (i: number) => {
      if (fondo[i] === 0 && parecido(i)) {
        fondo[i] = 1;
        cola[fin++] = i;
      }
    };
    for (let x = 0; x < ancho; x++) {
      meter(x);
      meter((alto - 1) * ancho + x);
    }
    for (let y = 0; y < alto; y++) {
      meter(y * ancho);
      meter(y * ancho + ancho - 1);
    }
    while (ini < fin) {
      const i = cola[ini++];
      const x = i % ancho;
      if (x > 0) meter(i - 1);
      if (x < ancho - 1) meter(i + 1);
      if (i >= ancho) meter(i - ancho);
      if (i < total - ancho) meter(i + ancho);
    }
  } else {
    for (let i = 0; i < total; i++) if (parecido(i)) fondo[i] = 1;
  }

  // Máscara suave: 1 = fondo seguro, 0 = sujeto; el borde se desenfoca para que no quede dentado.
  let mascara: Float32Array = new Float32Array(total);
  for (let i = 0; i < total; i++) mascara[i] = fondo[i];
  mascara = desenfocar(mascara, ancho, alto, Math.round(Math.max(0, Math.min(6, op.suavizado))));

  let quitados = 0;
  for (let i = 0; i < total; i++) {
    const a = datos[i * 4 + 3];
    const nueva = Math.round(a * (1 - mascara[i]));
    if (nueva !== a) datos[i * 4 + 3] = nueva;
    if (nueva < 128) quitados++;
  }
  return quitados / total;
}
