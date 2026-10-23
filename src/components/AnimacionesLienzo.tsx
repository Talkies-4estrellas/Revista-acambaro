"use client";

import { useEffect } from "react";
import { DESPUES_DEFECTO, EFECTOS, EFECTOS_IDS, fotogramas, fotogramasSalida, opcionesAnimacion, opcionesSalida, type Efecto } from "@/lib/animaciones";
import { animarTexto } from "@/lib/animaciones-texto";

/**
 * Reproduce las animaciones de entrada de la página publicada. Los elementos animados llegan del servidor ya
 * invisibles (`data-anim`); aquí se observan y, al entrar en pantalla, se animan y quedan visibles. Sirve igual
 * para lo que se ve al cargar y para lo que aparece al hacer scroll en páginas altas.
 * Con "reducir movimiento" activado en el sistema, todo se muestra sin animar.
 */
export default function AnimacionesLienzo() {
  useEffect(() => {
    // Se ignoran las copias de la página anterior que usa el giro de página (dentro de [data-pageflow]).
    // Con el scroll continuo del celular se montan varias instancias (una por página): cada una se queda con los elementos que aún nadie reclamó.
    const nodos = Array.from(document.querySelectorAll<HTMLElement>("[data-anim]:not([data-anim-obs]), [data-salida]:not([data-anim-obs])")).filter((n) => !n.closest("[data-pageflow]"));
    if (nodos.length === 0) return;
    nodos.forEach((n) => n.setAttribute("data-anim-obs", ""));
    const soltar = () => nodos.forEach((n) => n.removeAttribute("data-anim-obs")); // por si el efecto se vuelve a montar (modo estricto)

    const mostrar = (n: HTMLElement) => {
      n.style.opacity = "1";
    };
    const temporizadores: number[] = [];
    /** Salida: pasado el tiempo, el elemento se va con su efecto y queda oculto. Sin entrada propia, cuenta desde que aparece en pantalla. */
    const programarSalida = (n: HTMLElement, esperaExtra = 0) => {
      const efecto = n.dataset.salida as Efecto | undefined;
      if (!efecto || !(efecto in EFECTOS) || typeof n.animate !== "function") return;
      const desp = Number(n.dataset.salDesp);
      const dur = Number(n.dataset.salDur);
      temporizadores.push(
        window.setTimeout(
          () => {
            const a = n.animate(fotogramasSalida(efecto), opcionesSalida({ efecto, duracion: Number.isFinite(dur) && dur > 0 ? dur : undefined }));
            a.finished.then(() => (n.style.opacity = "0")).catch(() => (n.style.opacity = "0"));
          },
          esperaExtra + (Number.isFinite(desp) && n.dataset.salDesp !== undefined ? desp : DESPUES_DEFECTO),
        ),
      );
    };
    const sinMovimiento =
      window.matchMedia("(prefers-reduced-motion: reduce)").matches || typeof IntersectionObserver === "undefined";
    if (sinMovimiento) {
      nodos.forEach(mostrar);
      return soltar;
    }

    const reproducir = (n: HTMLElement) => {
      const efecto = n.dataset.anim as Efecto;
      // Solo salida (sin animación de entrada): ya está visible; basta con programar su salida.
      if (n.dataset.anim === undefined) {
        programarSalida(n);
        return;
      }
      if (!EFECTOS_IDS.includes(efecto) || !(efecto in EFECTOS) || typeof n.animate !== "function") {
        mostrar(n);
        programarSalida(n);
        return;
      }
      const dur = Number(n.dataset.dur);
      const ret = Number(n.dataset.ret);
      // Texto letra por letra / palabra por palabra: se anima un clon por piezas; el elemento se muestra al empezar.
      if ((efecto === "letras" || efecto === "palabras") && n.firstElementChild instanceof HTMLElement) {
        const hecho = animarTexto(
          n.firstElementChild,
          n,
          { efecto, duracion: Number.isFinite(dur) && dur > 0 ? dur : undefined, retraso: Number.isFinite(ret) && ret > 0 ? ret : undefined },
          () => {
            mostrar(n);
            programarSalida(n);
          },
        );
        if (hecho) return;
      }
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
          programarSalida(n);
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
    return () => {
      obs.disconnect();
      temporizadores.forEach((t) => clearTimeout(t));
      soltar();
    };
  }, []);

  return null;
}
