"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { cargarPaginaFlujo } from "@/lib/flujo-actions";

const HOJA = "mx-auto mt-6 max-w-[900px] shadow-[0_10px_40px_-12px_rgba(28,24,20,0.35)]";

/**
 * Scroll continuo en celular: al acercarse al final de la página, la siguiente se agrega debajo (sin giro de hoja), y así hasta el final de la
 * edición. Mientras se lee, la URL, el contador de arriba y el título se ajustan a la página que se está viendo, así que un enlace copiado o una
 * recarga caen en esa página. Si la página que sigue no es de lienzo (plantillas clásicas), el flujo termina con un enlace para continuar.
 * En pantallas anchas no hace nada (ahí sigue el giro de página de PageFlow).
 */
export default function FlujoMovil({
  id,
  numero,
  desde,
  hrefs,
  titulos,
  tipos,
}: {
  id: string;
  /** Número de la edición (para el título del navegador). */
  numero: string;
  /** Número de la página con la que se abrió la ruta. */
  desde: number;
  hrefs: string[];
  titulos: string[];
  tipos: string[];
}) {
  const total = hrefs.length;
  const [movil, setMovil] = useState(false);
  const [paginas, setPaginas] = useState<{ n: number; nodo: ReactNode }[]>([]);
  const [siguiente, setSiguiente] = useState(desde + 1);
  const [estado, setEstado] = useState<"reposo" | "cargando" | "error">("reposo");
  const [intento, setIntento] = useState(0);
  const centinela = useRef<HTMLDivElement>(null);
  const cargando = useRef(false);

  const hay = siguiente <= total && tipos[siguiente - 1] === "lienzo";

  // Solo en celular.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setMovil(mq.matches);
    const alCambiar = () => setMovil(mq.matches);
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, []);

  // Cargar la siguiente página cuando el final queda cerca (con margen, para que ya esté lista al llegar).
  useEffect(() => {
    const nodo = centinela.current;
    if (!movil || !hay || !nodo) return;
    const obs = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting) || cargando.current) return;
        cargando.current = true;
        setEstado("cargando");
        cargarPaginaFlujo(id, siguiente)
          .then((contenido) => {
            if (contenido) {
              setPaginas((p) => [...p, { n: siguiente, nodo: contenido }]);
              setSiguiente((s) => s + 1);
            } else setSiguiente(total + 1);
            setEstado("reposo");
          })
          .catch(() => setEstado("error"))
          .finally(() => {
            cargando.current = false;
          });
      },
      { rootMargin: "0px 0px 1400px 0px" },
    );
    obs.observe(nodo); // al observar, avisa de inmediato si ya está cerca (página corta o cargada la anterior)
    return () => obs.disconnect();
  }, [movil, hay, id, siguiente, total, intento]);

  // La página que se está viendo: ajusta URL, contador y título.
  useEffect(() => {
    if (!movil) return;
    let actual = 0;
    let cuadro = 0;
    const revisar = () => {
      cuadro = 0;
      const linea = window.innerHeight * 0.35;
      let visible = 0;
      for (const s of Array.from(document.querySelectorAll<HTMLElement>("[data-flujo-n]"))) {
        const r = s.getBoundingClientRect();
        if (r.top <= linea && r.bottom >= linea) {
          visible = Number(s.dataset.flujoN);
          break;
        }
      }
      // Al llegar al fondo, la última página que se alcanza a ver (el pie de «Fin de la edición» ya cuenta como estar en ella).
      if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 8) {
        const todas = Array.from(document.querySelectorAll<HTMLElement>("[data-flujo-n]"));
        const ultima = todas.filter((s) => s.getBoundingClientRect().top < window.innerHeight * 0.9).pop();
        if (ultima) visible = Number(ultima.dataset.flujoN);
      }
      if (!visible || visible === actual) return;
      actual = visible;
      window.history.replaceState(window.history.state, "", hrefs[visible - 1]);
      document.title = `${titulos[visible - 1]} — Acámbaro N.º ${numero}`;
      const contador = document.querySelector("[data-contador]");
      if (contador) contador.textContent = `${visible}/${total}`;
    };
    const programar = () => {
      if (!cuadro) cuadro = requestAnimationFrame(revisar);
    };
    window.addEventListener("scroll", programar, { passive: true });
    programar();
    return () => {
      window.removeEventListener("scroll", programar);
      if (cuadro) cancelAnimationFrame(cuadro);
    };
  }, [movil, hrefs, titulos, numero, total, paginas.length]);

  return (
    <div className="sm:hidden">
      {paginas.map((p) => (
        <div key={p.n} data-flujo-n={p.n} className={HOJA}>
          {p.nodo}
        </div>
      ))}

      {hay && (
        <div ref={centinela} className="px-5 py-10 text-center font-sans text-xs text-ink-soft">
          {estado === "error" ? (
            <button type="button" className="font-bold text-terracota underline" onClick={() => setIntento((i) => i + 1)}>
              No se pudo cargar la siguiente página. Reintentar
            </button>
          ) : (
            <span aria-live="polite">Cargando la siguiente página…</span>
          )}
        </div>
      )}

      {!hay && (
        <div className="mx-auto mt-8 max-w-[900px] border-t-4 border-double border-ink px-5 py-8 text-center">
          {siguiente <= total ? (
            <Link href={hrefs[siguiente - 1]} className="group block">
              <span className="kicker block text-[0.62rem] text-ink-soft">Continuar →</span>
              <span className="font-display line-clamp-2 text-xl font-bold leading-snug group-hover:underline">{titulos[siguiente - 1]}</span>
            </Link>
          ) : (
            <>
              <p className="font-display text-2xl font-black italic">Fin de la edición</p>
              <p className="font-sans mt-1 text-xs text-ink-soft">
                {total} {total === 1 ? "página" : "páginas"}
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 font-sans text-xs font-bold uppercase tracking-wider">
                <Link href={hrefs[0]} className="text-terracota hover:underline">
                  ↑ Volver a la primera página
                </Link>
                <Link href="/ediciones" className="text-terracota hover:underline">
                  Todas las ediciones
                </Link>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
