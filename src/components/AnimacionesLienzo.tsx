"use client";

import { useEffect } from "react";
import { EFECTOS, EFECTOS_IDS, fotogramas, opcionesAnimacion, type Efecto } from "@/lib/animaciones";

/**
 * Reproduce las animaciones de entrada de la página publicada. Los elementos animados llegan del servidor ya
 * invisibles (`data-anim`); aquí se observan y, al entrar en pantalla, se animan y quedan visibles. Sirve igual
 * para lo que se ve al cargar y para lo que aparece al hacer scroll en páginas altas.
 * Con "reducir movimiento" activado en el sistema, todo se muestra sin animar.
 */
export default function AnimacionesLienzo() {
  useEffect(() => {
    // Se ignoran las copias de la página anterior que usa el giro de página (dentro de [data-pageflow]).
    const nodos = Array.from(document.querySelectorAll<HTMLElement>("[data-anim]")).filter((n) => !n.closest("[data-pageflow]"));
    if (nodos.length === 0) return;

    const mostrar = (n: HTMLElement) => {
      n.style.opacity = "1";
    };
    const sinMovimiento =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined";
    if (sinMovimiento) {
      nodos.forEach(mostrar);
      return;
    }

    const reproducir = (n: HTMLElement) => {
      const efecto = n.dataset.anim as Efecto;
      if (!EFECTOS_IDS.includes(efecto) || !(efecto in EFECTOS) || typeof n.animate !== "function") {
        mostrar(n);
        return;
      }
      const dur = Number(n.dataset.dur);
      const ret = Number(n.dataset.ret);
      const anim = n.animate(
        fotogramas(efecto),
        opcionesAnimacion({
          efecto,
          duracion: Number.isFinite(dur) && dur > 0 ? dur : undefined,
          retraso: Number.isFinite(ret) && ret > 0 ? ret : undefined,
        }, "both"),
      );
      // Al terminar queda el estado normal del elemento: se deja visible y se libera la animación.
      anim.finished
        .then(() => {
          mostrar(n);
          anim.cancel();
        })
        .catch(() => mostrar(n));
    };

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (!e.isIntersecting) continue;
          obs.unobserve(e.target);
          reproducir(e.target as HTMLElement);
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -4% 0px" },
    );
    nodos.forEach((n) => obs.observe(n));
    return () => obs.disconnect();
  }, []);

  return null;
}
