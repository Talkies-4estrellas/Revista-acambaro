/**
 * «Seguir leyendo»: la última página que el lector tuvo abierta. Se guarda solo en su navegador (localStorage); no sale de ahí.
 * Abrir la portada de una edición no borra lo que ya llevaba; al llegar al final de la edición se olvida, para no invitar a seguir algo ya terminado.
 */
export type Lectura = { id: string; n: number; total: number; tema: string; numero: string; href: string };

const CLAVE = "acomdi-leyendo";

export function guardarLectura(l: Lectura) {
  try {
    if (window.self !== window.top || l.n <= 1) return; // la muestra de la bienvenida no cuenta como lectura
    if (l.n < l.total) localStorage.setItem(CLAVE, JSON.stringify(l));
    else if (leerLectura()?.id === l.id) localStorage.removeItem(CLAVE);
  } catch {}
}

export function leerLectura(): Lectura | null {
  try {
    const l = JSON.parse(localStorage.getItem(CLAVE) ?? "null");
    return l && typeof l.id === "string" && typeof l.href === "string" && l.href.startsWith("/ediciones/") && l.n > 1 ? l : null;
  } catch {
    return null;
  }
}
