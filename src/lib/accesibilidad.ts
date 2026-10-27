import { esAltDeEjemplo } from "./ejemplos";
import { DEGRADADOS } from "./esquema";
import type { Elemento, EdicionDatos, Pagina } from "./esquema";
import type { Aviso } from "./revision";

/**
 * Revisión de accesibilidad de los datos de la edición (sin dibujar nada): contraste de los textos (WCAG AA), textos muy chicos, descripciones
 * de imágenes inútiles, enlaces sin nombre o poco claros, objetivos táctiles pequeños, contenido que desaparece solo y páginas sin título.
 * El fondo de cada texto se estima con lo que hay debajo en la hoja (cuadros de color, degradados, el fondo de la página); sobre una foto no se
 * puede medir y solo se avisa si no hay capa que ayude. Es una guía, no un dictamen: por eso casi todo son avisos o sugerencias.
 */

/* ----------------------------- colores ----------------------------- */

/** La paleta en su versión clara (las hojas de la revista siempre se ven claras: ver .paleta-clara). */
const PALETA: Record<string, string> = {
  papel: "#f1f5f9",
  papel2: "#e2e8f0",
  tinta: "#1e293b",
  tintaSuave: "#475569",
  blanco: "#ffffff",
  terracota: "#068562",
  ocre: "#49c59f",
  oliva: "#046a4b",
  indigo: "#013f4a",
};
const NOMBRE_COLOR: Record<string, string> = { papel: "papel", papel2: "papel oscuro", tinta: "tinta", tintaSuave: "tinta suave", blanco: "blanco", terracota: "terracota", ocre: "ocre", oliva: "oliva", indigo: "índigo" };

type RGB = [number, number, number];

function aRgb(color: string | undefined): RGB | null {
  if (!color) return null;
  const hex = PALETA[color] ?? color;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex);
  if (!m) return null;
  const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

const lineal = (c: number) => {
  const s = c / 255;
  return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
};
const luminancia = ([r, g, b]: RGB) => 0.2126 * lineal(r) + 0.7152 * lineal(g) + 0.0722 * lineal(b);

/** Relación de contraste WCAG entre dos colores (de 1 a 21). */
export function contraste(a: RGB, b: RGB): number {
  const la = luminancia(a);
  const lb = luminancia(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

const mezclar = (sobre: RGB, base: RGB, opacidad: number): RGB => [0, 1, 2].map((i) => Math.round(sobre[i] * opacidad + base[i] * (1 - opacidad))) as RGB;

/** Colores (paradas) de un degradado. */
const paradas = (id: string | undefined): RGB[] =>
  id && id in DEGRADADOS
    ? (DEGRADADOS as Record<string, { paradas: string }>)[id].paradas.split(",").map((s) => aRgb(s.trim())).filter((c): c is RGB => !!c)
    : [];

const nombreColor = (c: string | undefined) => (c ? (NOMBRE_COLOR[c] ?? c) : "tinta");

/* ------------------------------- fondo ------------------------------- */

type Caja = { x: number; y: number; w: number; h: number };
const contiene = (c: Caja, px: number, py: number) => px >= c.x && px <= c.x + c.w && py >= c.y && py <= c.y + c.h;

/** Qué hay detrás de un punto de la hoja, mirando los elementos que se dibujan antes que el de índice `hasta`. */
type Fondo = { colores: RGB[]; foto?: Elemento & { tipo: "imagen" }; descripcion: string };

function fondoEn(elementos: Elemento[], hasta: number, px: number, py: number, base: string | undefined): Fondo {
  for (let j = hasta - 1; j >= 0; j--) {
    const e = elementos[j];
    if (e.oculto || !contiene(e, px, py)) continue;
    // Cuadros pequeños o líneas no son un fondo.
    if (e.tipo === "forma" && Math.min(e.w, e.h) > 14) {
      const propios = e.degradado ? paradas(e.degradado) : [aRgb(e.color ?? "tinta")].filter((c): c is RGB => !!c);
      if (propios.length === 0) continue;
      const op = e.opacidad ?? 1;
      if (op >= 0.97) return { colores: propios, descripcion: e.degradado ? `degradado ${DEGRADADOS[e.degradado as keyof typeof DEGRADADOS]?.nombre.toLowerCase() ?? ""}` : nombreColor(e.color ?? "tinta") };
      const debajo = fondoEn(elementos, j, px, py, base);
      if (debajo.foto) return debajo;
      return { colores: debajo.colores.flatMap((d) => propios.map((p) => mezclar(p, d, op))), descripcion: `${nombreColor(e.color ?? "tinta")} translúcido` };
    }
    if (e.tipo === "texto" && e.fondo && (e.opacidad ?? 1) >= 0.97) {
      const c = aRgb(e.fondo);
      if (c) return { colores: [c], descripcion: nombreColor(e.fondo) };
    }
    if (e.tipo === "imagen" && Math.min(e.w, e.h) > 40) return { colores: [], foto: e, descripcion: "una foto" };
  }
  const fondoPagina = aRgb(base ?? "papel") ?? aRgb("papel")!;
  return { colores: [fondoPagina], descripcion: base ? `fondo de la página (${nombreColor(base)})` : "fondo de la página" };
}

/* ------------------------------ textos ------------------------------ */

const recortar = (t: string, n = 38) => {
  const s = t.replace(/\s+/g, " ").trim();
  return s.length > n ? s.slice(0, n - 1) + "…" : s;
};

/** Colores con que se dibuja un texto (el del bloque y los de sus tramos), o los del degradado de sus letras. */
function coloresDeTexto(e: Elemento & { tipo: "texto" }): { clave: string; rgb: RGB[] }[] {
  if (e.degradado) return [{ clave: `degradado`, rgb: paradas(e.degradado) }];
  const claves = new Set<string>([e.color ?? "tinta"]);
  for (const par of e.contenido ?? []) for (const t of par) if (t.texto.trim() && t.color) claves.add(t.color);
  // Si todos los tramos con texto tienen color propio, el del bloque no se ve.
  return [...claves].map((c) => ({ clave: c, rgb: [aRgb(c)].filter((x): x is RGB => !!x) })).filter((c) => c.rgb.length > 0);
}

const GENERICOS = /^(aqu[ií]|clic aqu[ií]|click aqu[ií]|haz clic aqu[ií]|pulsa aqu[ií]|toca aqu[ií]|m[aá]s|ver|leer|link|enlace|esto|ah[ií])\.?$/i;
const NOMBRE_ARCHIVO = /(\.(jpe?g|png|webp|gif|avif|svg)\b)|^(img|dsc|image|imagen|foto|photo|screenshot|captura|whatsapp)[\s_-]*\d*$|^\d[\d\s_-]*$/i;

function revisarPagina(p: Pagina, n: number, avisos: Aviso[]) {
  const elementos = (p.elementos ?? []) as Elemento[];

  if (!p.titulo?.trim()) {
    avisos.push({ pagina: n, nivel: "aviso", tipo: "Página sin título", grupo: "accesibilidad", texto: "La página no tiene título: los lectores de pantalla, el índice y el buscador la anuncian sin nombre. Escríbelo en «Título» de la página." });
  }

  elementos.forEach((e, i) => {
    if (e.oculto) return;

    if (e.tipo === "texto") {
      const tam = e.tam ?? 24;
      const grande = tam >= 24 || (tam >= 19 && (e.peso ?? 400) >= 700);
      const minimo = grande ? 3 : 4.5;
      const muestra = recortar(e.texto);
      if (!e.texto.trim()) return;

      // Contraste con lo que hay debajo
      const centro = { x: e.x + e.w / 2, y: e.y + e.h / 2 };
      const fondo = e.fondo && aRgb(e.fondo) ? ({ colores: [aRgb(e.fondo)!], descripcion: nombreColor(e.fondo) } as Fondo) : fondoEn(elementos, i, centro.x, centro.y, p.fondo);
      if (fondo.foto) {
        const f = fondo.foto;
        if (!f.capa && !(e.sombraTexto && e.sombraTexto !== "suave")) {
          avisos.push({ pagina: n, nivel: "info", tipo: "Texto sobre foto", grupo: "accesibilidad", elemento: e.id, texto: `«${muestra}» está sobre una foto sin capa oscura o clara: según la foto puede costar leerlo. Agrega una capa a la foto (panel «Estilo de la imagen»), una sombra al texto o un fondo a la caja.` });
        }
      } else {
        const op = e.opacidad ?? 1;
        let peor = Infinity;
        let colorPeor = "";
        for (const t of coloresDeTexto(e)) {
          for (const bg of fondo.colores) for (const fg of t.rgb) {
            const real = op < 1 ? mezclar(fg, bg, op) : fg;
            const r = contraste(real, bg);
            if (r < peor) {
              peor = r;
              colorPeor = t.clave;
            }
          }
        }
        if (peor < minimo) {
          // Entre blanco y tinta, el que cumple; si cumplen los dos, el que da más contraste con el fondo más difícil.
          const puntaje = (c: string) => Math.min(...fondo.colores.map((bg) => contraste(aRgb(c)!, bg)));
          const pasan = (["blanco", "tinta"] as const).filter((c) => puntaje(c) >= minimo).sort((a, b) => puntaje(b) - puntaje(a));
          const mejor = pasan[0];
          const soloTransparencia = op < 1 && mejor === (e.color ?? "tinta");
          avisos.push({
            pagina: n,
            nivel: peor < 3 ? "error" : "aviso",
            tipo: "Contraste insuficiente",
            grupo: "accesibilidad",
            elemento: e.id,
            texto: `«${muestra}» (${colorPeor === "degradado" ? "degradado" : nombreColor(colorPeor)}${op < 1 ? `, ${Math.round(op * 100)} % de opacidad` : ""}) sobre ${fondo.descripcion}: contraste ${peor.toFixed(1).replace(".", ",")}:1; se pide al menos ${minimo.toString().replace(".", ",")}:1${grande ? " (texto grande)" : ""}.${mejor && !e.degradado ? (soloTransparencia ? " Sin la transparencia sí se lee bien." : ` Con ${nombreColor(mejor)} sí se lee bien.`) : ""}`,
            arreglo: mejor && !e.degradado && !(e.contenido ?? []).some((par) => par.some((t) => t.color)) ? { descripcion: soloTransparencia ? "Quitar la transparencia del texto" : `Poner el texto en ${nombreColor(mejor)}`, cambios: { color: mejor, opacidad: undefined } } : undefined,
          });
        }
      }

      // Tamaño
      if (tam < 12) {
        avisos.push({ pagina: n, nivel: tam < 10 ? "aviso" : "info", tipo: "Texto muy pequeño", grupo: "accesibilidad", elemento: e.id, texto: `«${muestra}» mide ${tam}: en pantallas pequeñas la hoja se reduce y se vuelve casi ilegible. Se recomienda 12 o más (14 para párrafos).`, arreglo: { descripcion: "Subir a 14", cambios: { tam: 14 } } });
      }

      // Mayúsculas largas
      if (e.mayusculas && e.texto.replace(/\s+/g, " ").trim().length > 70) {
        avisos.push({ pagina: n, nivel: "info", tipo: "Mayúsculas largas", grupo: "accesibilidad", elemento: e.id, texto: `«${muestra}» está todo en mayúsculas y es largo: cuesta leerlo y algunos lectores de pantalla lo deletrean.` });
      }

      // Desaparece solo
      if (e.salida && (e.salida.despues ?? 3000) < 6000 && e.texto.trim().length > 40) {
        avisos.push({ pagina: n, nivel: "info", tipo: "Contenido que desaparece", grupo: "accesibilidad", elemento: e.id, texto: `«${muestra}» se va solo a los ${((e.salida.despues ?? 3000) / 1000).toString().replace(".", ",")} s: a quien lee despacio no le da tiempo. Déjalo más tiempo o no lo hagas desaparecer.` });
      }
    }

    // Descripciones de imágenes
    if (e.tipo === "imagen" && e.alt?.trim()) {
      const alt = e.alt.trim();
      const sospechoso = NOMBRE_ARCHIVO.test(alt) || (/^[\w-]+$/.test(alt) && /[-_\d]/.test(alt) && !alt.includes(" "));
      if (e.src && esAltDeEjemplo(alt)) {
        avisos.push({ pagina: n, nivel: "info", tipo: "Descripción de ejemplo", grupo: "accesibilidad", elemento: e.id, texto: `La foto sigue con la descripción de la plantilla («${recortar(alt)}»). Cámbiala por lo que muestra tu foto (Texto alternativo).` });
      } else if (sospechoso) {
        avisos.push({ pagina: n, nivel: "info", tipo: "Descripción poco útil", grupo: "accesibilidad", elemento: e.id, texto: `La descripción «${recortar(alt)}» parece un nombre de archivo. Escribe qué muestra la imagen (por ejemplo, «Laguna rodeada de pinos al amanecer»).` });
      }
    }

    // Enlaces
    if (e.enlace !== undefined && e.enlace !== "") {
      const sinTexto = (e.tipo === "imagen" || e.tipo === "icono") && !(e.alt ?? "").trim() && e.tipo !== "icono";
      if (sinTexto) {
        avisos.push({ pagina: n, nivel: "aviso", tipo: "Enlace sin nombre", grupo: "accesibilidad", elemento: e.id, texto: "Una imagen que lleva a otra parte no tiene descripción: un lector de pantalla solo dice «enlace». Descríbela en «Texto alternativo» (qué es o a dónde lleva)." });
      }
      if (e.tipo === "texto" && GENERICOS.test(e.texto.trim())) {
        avisos.push({ pagina: n, nivel: "info", tipo: "Texto de enlace poco claro", grupo: "accesibilidad", elemento: e.id, texto: `El enlace «${recortar(e.texto)}» no dice a dónde lleva (quien navega por enlaces los oye sueltos). Prueba con algo como «Ver el programa completo».` });
      }
      const lado = Math.min(e.w, e.h);
      if (lado < 24) {
        avisos.push({ pagina: n, nivel: "aviso", tipo: "Objetivo táctil pequeño", grupo: "accesibilidad", elemento: e.id, texto: `Un elemento con enlace mide solo ${Math.round(e.w)}×${Math.round(e.h)}: es muy difícil tocarlo con el dedo. Hazlo de al menos 40 de alto.` });
      } else if (lado < 36 && e.tipo !== "texto") {
        avisos.push({ pagina: n, nivel: "info", tipo: "Objetivo táctil pequeño", grupo: "accesibilidad", elemento: e.id, texto: `Un elemento con enlace mide ${Math.round(e.w)}×${Math.round(e.h)}: en el celular conviene que sea de unos 40 o más.` });
      }
    }
  });
}

/** Avisos de accesibilidad de todas las páginas (y de los elementos que se repiten, que se miden sobre el fondo de la primera página). */
export function revisarAccesibilidad(datos: Pick<EdicionDatos, "paginas" | "maestra">): Aviso[] {
  const avisos: Aviso[] = [];
  datos.paginas.forEach((p, i) => revisarPagina(p, i + 1, avisos));
  return avisos;
}
