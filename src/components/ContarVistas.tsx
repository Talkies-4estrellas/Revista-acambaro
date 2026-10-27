"use client";

import { useEffect } from "react";

/**
 * Avisa al servidor qué páginas de la edición se están leyendo (alimenta las estadísticas del panel). Una página cuenta
 * cuando al menos la mitad está a la vista durante un segundo; en una sesión del navegador cada página se avisa una vez.
 * Mira todos los [data-flujo-n] (en PC hay uno; en el celular se agregan más al bajar). No dibuja nada.
 */
export default function ContarVistas({ edicion }: { edicion: string }) {
  useEffect(() => {
    if (typeof IntersectionObserver === "undefined") return;
    // Dentro de un marco (la vista previa del editor) no es un lector: no se cuenta.
    if (window.self !== window.top) return;
    const temporizadores = new Map<Element, number>();
    const visto = (n: number) => {
      const k = `vista:${edicion}:${n}`;
      try {
        if (sessionStorage.getItem(k)) return;
        sessionStorage.setItem(k, "1");
      } catch {
        // Sin sessionStorage se avisa igual (el servidor evita repetidos).
      }
      try {
        navigator.sendBeacon?.("/api/vista", new Blob([JSON.stringify({ e: edicion, n })], { type: "text/plain" }));
      } catch {
        // Sin conteo.
      }
    };
    const obs = new IntersectionObserver(
      (entradas) => {
        for (const en of entradas) {
          const n = Number((en.target as HTMLElement).dataset.flujoN);
          if (!n) continue;
          const t = temporizadores.get(en.target);
          if (en.isIntersecting) {
            if (t === undefined) temporizadores.set(en.target, window.setTimeout(() => visto(n), 1000));
          } else if (t !== undefined) {
            clearTimeout(t);
            temporizadores.delete(en.target);
          }
        }
      },
      { threshold: [0.5] },
    );
    const vigiladas = new WeakSet<Element>();
    const revisar = () => {
      for (const el of Array.from(document.querySelectorAll<HTMLElement>("[data-flujo-n]"))) {
        // Los huecos de páginas descargadas (aria-hidden) no son páginas leídas.
        if (el.getAttribute("aria-hidden") === "true") {
          if (vigiladas.has(el)) {
            obs.unobserve(el);
            vigiladas.delete(el);
          }
          continue;
        }
        if (!vigiladas.has(el)) {
          vigiladas.add(el);
          obs.observe(el);
        }
      }
    };
    revisar();
    const mo = new MutationObserver(revisar);
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      obs.disconnect();
      temporizadores.forEach((t) => clearTimeout(t));
    };
  }, [edicion]);
  return null;
}
