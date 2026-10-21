import type { AnimacionEl } from "./animaciones";

/**
 * Animación de texto que aparece letra por letra o palabra por palabra. Solo funciona en el navegador (usa el DOM).
 *
 * No se cambia el texto original (React lo administra): se hace un clon superpuesto, partido en piezas que aparecen una tras otra,
 * y al terminar se retira el clon y el original vuelve a verse. Así el texto real nunca deja de estar en la página.
 */

type ModoTexto = "letras" | "palabras";

const PIEZA_MS = 420; // lo que tarda en aparecer cada letra o palabra
const FOTOGRAMAS: Keyframe[] = [
  { opacity: 0, transform: "translateY(0.35em)" },
  { opacity: 1, transform: "none" },
];

/** Parte los textos de `raiz` en piezas (palabras con letras dentro, o solo palabras) y devuelve las que se animan, en orden de lectura. */
function trocear(raiz: HTMLElement, modo: ModoTexto): HTMLElement[] {
  const doc = raiz.ownerDocument;
  const piezas: HTMLElement[] = [];
  const caminante = doc.createTreeWalker(raiz, NodeFilter.SHOW_TEXT);
  const nodos: Text[] = [];
  while (caminante.nextNode()) nodos.push(caminante.currentNode as Text);
  for (const nodo of nodos) {
    const texto = nodo.nodeValue ?? "";
    if (!texto.trim()) continue;
    const trozos = doc.createDocumentFragment();
    for (const trozo of texto.split(/(\s+)/)) {
      if (!trozo) continue;
      if (/^\s+$/.test(trozo)) {
        trozos.append(trozo); // los espacios y saltos de línea se quedan como texto normal
        continue;
      }
      const palabra = doc.createElement("span");
      palabra.style.display = "inline-block";
      if (modo === "palabras") {
        palabra.textContent = trozo;
        piezas.push(palabra);
      } else {
        for (const letra of Array.from(trozo)) {
          const l = doc.createElement("span");
          l.style.display = "inline-block";
          l.textContent = letra;
          palabra.append(l);
          piezas.push(l);
        }
      }
      trozos.append(palabra);
    }
    nodo.replaceWith(trozos);
  }
  return piezas;
}

/** Duración total por defecto: proporcional al largo del texto, entre 0,7 y unos 4 segundos. */
function duracionAutomatica(n: number, modo: ModoTexto) {
  return modo === "letras" ? Math.min(4500, Math.max(700, n * 45)) : Math.min(4000, Math.max(700, n * 160));
}

/**
 * Anima el texto de `original` (el contenido de un elemento de texto) con el efecto `a.efecto` ("letras" o "palabras").
 * `contenedor` es el elemento donde se coloca el clon (debe ser el padre de `original` o cubrir lo mismo). `a.duracion` es el tiempo
 * TOTAL de la escritura (vacío = según el largo del texto) y `a.retraso` la espera antes de empezar.
 * Devuelve false si no hay texto que animar (el llamador usa entonces otro efecto); `alEmpezar` se llama justo después de crear las animaciones
 * (el sitio publicado lo usa para mostrar el elemento sin que se vea un parpadeo) y `alTerminar` cuando todo volvió a su estado normal.
 */
export function animarTexto(
  original: HTMLElement,
  contenedor: HTMLElement,
  a: Pick<AnimacionEl, "efecto" | "duracion" | "retraso">,
  alEmpezar?: () => void,
  alTerminar?: () => void,
): boolean {
  const modo: ModoTexto | null = a.efecto === "letras" ? "letras" : a.efecto === "palabras" ? "palabras" : null;
  const raizOriginal = original.matches("[data-texto]") ? original : original.querySelector<HTMLElement>("[data-texto]");
  if (!modo || !raizOriginal || typeof original.animate !== "function") return false;

  const clon = original.cloneNode(true) as HTMLElement;
  clon.setAttribute("aria-hidden", "true");
  clon.style.position = "absolute";
  clon.style.inset = "0";
  clon.style.pointerEvents = "none";
  const raizClon = clon.matches("[data-texto]") ? clon : clon.querySelector<HTMLElement>("[data-texto]");
  if (!raizClon) return false;
  const piezas = trocear(raizClon, modo);
  if (piezas.length === 0) return false;

  const posicionAntes = contenedor.style.position;
  const visibilidadAntes = original.style.visibility;
  if (!posicionAntes && getComputedStyle(contenedor).position === "static") contenedor.style.position = "relative";
  original.style.visibility = "hidden";
  contenedor.append(clon);

  const total = a.duracion && a.duracion > 0 ? a.duracion : duracionAutomatica(piezas.length, modo);
  const porPieza = Math.min(PIEZA_MS, total);
  const paso = piezas.length > 1 ? Math.max(0, (total - porPieza) / (piezas.length - 1)) : 0;
  const base = a.retraso ?? 0;
  const animaciones = piezas.map((p, i) => p.animate(FOTOGRAMAS, { duration: porPieza, delay: base + i * paso, easing: "cubic-bezier(.2,.7,.2,1)", fill: "both" }));
  alEmpezar?.();

  const limpiar = () => {
    animaciones.forEach((x) => x.cancel());
    clon.remove();
    original.style.visibility = visibilidadAntes;
    contenedor.style.position = posicionAntes;
    alTerminar?.();
  };
  Promise.all(animaciones.map((x) => x.finished)).then(limpiar, limpiar);
  return true;
}
