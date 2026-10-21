/**
 * Animaciones de entrada de los elementos del lienzo. Sin dependencias del servidor: las usan el sitio
 * publicado (al entrar el elemento en pantalla) y el panel (vista previa).
 * Las distancias van en `cqw` (unidades del contenedor del lienzo) para que escalen con la hoja.
 */

export const EFECTOS = {
  aparecer: { nombre: "Aparecer", easing: "ease-out" },
  subir: { nombre: "Subir", easing: "cubic-bezier(.2,.7,.2,1)" },
  bajar: { nombre: "Bajar", easing: "cubic-bezier(.2,.7,.2,1)" },
  izquierda: { nombre: "Desde la izquierda", easing: "cubic-bezier(.2,.7,.2,1)" },
  derecha: { nombre: "Desde la derecha", easing: "cubic-bezier(.2,.7,.2,1)" },
  zoom: { nombre: "Zoom", easing: "cubic-bezier(.2,.7,.2,1)" },
  girar: { nombre: "Girar", easing: "cubic-bezier(.2,.7,.2,1)" },
  rebotar: { nombre: "Rebotar", easing: "ease-out" },
  revelar: { nombre: "Revelar (de izquierda a derecha)", easing: "cubic-bezier(.7,0,.2,1)" },
  cortina: { nombre: "Cortina (de arriba hacia abajo)", easing: "cubic-bezier(.7,0,.2,1)" },
  difuminar: { nombre: "Difuminar (de borroso a nítido)", easing: "ease-out" },
  letras: { nombre: "Texto letra por letra", easing: "linear" },
  palabras: { nombre: "Texto palabra por palabra", easing: "linear" },
} as const;

/** Efectos que solo tienen sentido en un texto (lib/animaciones-texto.ts). En otro elemento se comportan como «Aparecer». */
export const EFECTOS_TEXTO = ["letras", "palabras"] as const;
export const esEfectoTexto = (e: string): boolean => (EFECTOS_TEXTO as readonly string[]).includes(e);

/** Efecto al pasar el cursor (o el dedo, donde no hay cursor) por encima del elemento. Se dibuja con CSS (ver globals.css, «.fx-h»). */
export const HOVERS = {
  subir: "Se levanta con sombra",
  acercar: "Acerca (en una foto, el zoom queda dentro de su marco)",
  inclinar: "Se inclina un poco",
  brillo: "Se ilumina",
  encoger: "Se hunde (como al presionar)",
} as const;
export type Hover = keyof typeof HOVERS;
export const HOVERS_IDS = Object.keys(HOVERS) as Hover[];

/** Movimiento que se repite todo el tiempo (con CSS, «.fx-b»). Se desactiva si el lector pide menos movimiento. */
export const BUCLES = {
  flotar: "Flota suavemente arriba y abajo",
  latir: "Late (crece y se encoge)",
  balancear: "Se balancea de lado a lado",
  brillar: "Parpadea con un brillo",
} as const;
export type Bucle = keyof typeof BUCLES;
export const BUCLES_IDS = Object.keys(BUCLES) as Bucle[];

export type Efecto = keyof typeof EFECTOS;
export const EFECTOS_IDS = Object.keys(EFECTOS) as Efecto[];

export type AnimacionEl = {
  efecto: Efecto;
  /** Milisegundos (por defecto 700). */
  duracion?: number;
  /** Milisegundos de espera antes de empezar, desde que el elemento entra en pantalla (por defecto 0). */
  retraso?: number;
};

export const DURACION_DEFECTO = 700;

/** Fotogramas de cada efecto: del estado inicial al estado normal del elemento. */
export function fotogramas(efecto: Efecto): Keyframe[] {
  switch (efecto) {
    case "aparecer":
    case "letras": // en un texto se anima por piezas (animarTexto); si no hay texto, se queda en un simple fundido
    case "palabras":
      return [{ opacity: 0 }, { opacity: 1 }];
    case "subir":
      return [{ opacity: 0, transform: "translateY(6cqw)" }, { opacity: 1, transform: "translateY(0)" }];
    case "bajar":
      return [{ opacity: 0, transform: "translateY(-6cqw)" }, { opacity: 1, transform: "translateY(0)" }];
    case "izquierda":
      return [{ opacity: 0, transform: "translateX(-8cqw)" }, { opacity: 1, transform: "translateX(0)" }];
    case "derecha":
      return [{ opacity: 0, transform: "translateX(8cqw)" }, { opacity: 1, transform: "translateX(0)" }];
    case "zoom":
      return [{ opacity: 0, transform: "scale(.82)" }, { opacity: 1, transform: "scale(1)" }];
    case "girar":
      return [{ opacity: 0, transform: "rotate(-10deg) scale(.9)" }, { opacity: 1, transform: "rotate(0) scale(1)" }];
    case "rebotar":
      return [
        { opacity: 0, transform: "scale(.4)", offset: 0 },
        { opacity: 1, transform: "scale(1.1)", offset: 0.6 },
        { opacity: 1, transform: "scale(1)", offset: 1 },
      ];
    case "revelar":
      return [
        { opacity: 1, clipPath: "inset(0 100% 0 0)" },
        { opacity: 1, clipPath: "inset(0 0 0 0)" },
      ];
    case "cortina":
      return [
        { opacity: 1, clipPath: "inset(0 0 100% 0)" },
        { opacity: 1, clipPath: "inset(0 0 0 0)" },
      ];
    case "difuminar":
      return [
        { opacity: 0, filter: "blur(1.8cqw)", transform: "scale(1.03)" },
        { opacity: 1, filter: "blur(0)", transform: "scale(1)" },
      ];
  }
}

/** Opciones de `Element.animate` para una animación del modelo. */
export function opcionesAnimacion(a: AnimacionEl, relleno: FillMode = "backwards"): KeyframeAnimationOptions {
  return {
    duration: a.duracion ?? DURACION_DEFECTO,
    delay: a.retraso ?? 0,
    easing: EFECTOS[a.efecto].easing,
    fill: relleno,
  };
}
