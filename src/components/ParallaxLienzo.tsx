"use client";

import { useEffect } from "react";
import { PARALLAX, type NivelParallax } from "@/lib/esquema";

/**
 * Efecto parallax de las fotos de la página publicada: la imagen (ya ampliada un poco, ver Lienzo.tsx) se desplaza dentro de su marco a medida
 * que se hace scroll, así que parece moverse más lento que la página. Solo se actualizan las fotos que están a la vista y todo se agrupa en un
 * fotograma (requestAnimationFrame). Con «reducir movimiento» activado no se hace nada (y el CSS quita la ampliación).
 */
export default function ParallaxLienzo() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined") return;
    // Se ignoran las copias de la página anterior que usa el giro de página (dentro de [data-pageflow]).
    const nodos = Array.from(document.querySelectorAll<HTMLElement>("[data-parallax]:not([data-par-obs])")).filter((n) => !n.closest("[data-pageflow]"));
    if (nodos.length === 0) return;
    nodos.forEach((n) => n.setAttribute("data-par-obs", "")); // cada instancia (una por página en el scroll continuo) se ocupa solo de sus fotos

    const visibles = new Set<HTMLElement>();
    let programado = false;

    const pintar = () => {
      programado = false;
      const alto = window.innerHeight;
      for (const n of visibles) {
        const marco = n.parentElement;
        if (!marco) continue;
        const r = marco.getBoundingClientRect();
        if (r.height === 0) continue;
        const escala = PARALLAX[n.dataset.parallax as NivelParallax]?.escala ?? 1.2;
        // -1 cuando el marco entra por abajo, +1 cuando sale por arriba: la imagen se corre en sentido contrario al scroll, sin salirse de su ampliación.
        const avance = Math.max(-1, Math.min(1, (r.top + r.height / 2 - alto / 2) / (alto / 2 + r.height / 2)));
        const maximo = ((escala - 1) / 2) * r.height;
        n.style.transform = `translate3d(0, ${(-avance * maximo).toFixed(1)}px, 0) scale(${escala})`;
      }
    };
    const programar = () => {
      if (programado) return;
      programado = true;
      requestAnimationFrame(pintar);
    };

    const obs = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          if (e.isIntersecting) visibles.add(e.target as HTMLElement);
          else visibles.delete(e.target as HTMLElement);
        }
        programar();
      },
      { rootMargin: "20% 0px 20% 0px" },
    );
    nodos.forEach((n) => obs.observe(n));
    // capture: también se oye el scroll de contenedores internos, no solo el de la ventana
    window.addEventListener("scroll", programar, { passive: true, capture: true });
    window.addEventListener("resize", programar);
    return () => {
      obs.disconnect();
      nodos.forEach((n) => n.removeAttribute("data-par-obs"));
      window.removeEventListener("scroll", programar, { capture: true });
      window.removeEventListener("resize", programar);
    };
  }, []);

  return null;
}
