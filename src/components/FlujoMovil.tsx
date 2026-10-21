"use client";

import Link from "next/link";
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { cargarPaginaFlujo } from "@/lib/flujo-actions";

// Sin separación ni sombra: las hojas se pegan una a otra para que el scroll se sienta continuo.
const HOJA = ""; // el ancho lo decide cada página (CuerpoFlujo): las de lienzo van en una hoja de 900 px, las clásicas ocupan todo el ancho

/** Color de fondo de una página ya dibujada: el de su hoja de lienzo o, en las plantillas clásicas, el de su <main> (o el de la página). */
function fondoDe(pagina: Element | null): string {
  if (!pagina) return getComputedStyle(document.body).backgroundColor;
  const candidatos = [
    ...Array.from(pagina.querySelectorAll<HTMLElement>(".pagina-lienzo > *")).filter((e) => e.offsetParent !== null),
    pagina.querySelector<HTMLElement>("main"),
    pagina as HTMLElement,
  ];
  for (const e of candidatos) {
    if (!e) continue;
    const c = getComputedStyle(e).backgroundColor;
    if (c && c !== "transparent" && c !== "rgba(0, 0, 0, 0)") return c;
  }
  return getComputedStyle(document.body).backgroundColor;
}

/**
 * Franja entre dos páginas con fondos distintos: un degradado corto del color de la de arriba al de la de abajo, para que el paso no sea un corte seco.
 * Los colores se leen de lo que realmente se dibujó (y se recalculan al cambiar entre modo claro y oscuro).
 */
function Union() {
  const ref = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const pintar = () => {
      const antes = el.previousElementSibling ?? el.parentElement?.previousElementSibling ?? null;
      const despues = el.nextElementSibling;
      el.style.background = `linear-gradient(to bottom, ${fondoDe(antes)}, ${fondoDe(despues)})`;
    };
    pintar();
    const obs = new MutationObserver(pintar);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => obs.disconnect();
  }, []);
  return <div ref={ref} aria-hidden data-union className="h-6" />;
}

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
}: {
  id: string;
  /** Número de la edición (para el título del navegador). */
  numero: string;
  /** Número de la página con la que se abrió la ruta. */
  desde: number;
  hrefs: string[];
  titulos: string[];
}) {
  const total = hrefs.length;
  const [movil, setMovil] = useState(false);
  const [paginas, setPaginas] = useState<{ n: number; nodo: ReactNode }[]>([]);
  const [siguiente, setSiguiente] = useState(desde + 1);
  const [estado, setEstado] = useState<"reposo" | "cargando" | "error">("reposo");
  const [intento, setIntento] = useState(0);
  const centinela = useRef<HTMLDivElement>(null);
  const cargando = useRef(false);
  const lejanasRef = useRef(new Set<number>());

  const [detenido, setDetenido] = useState(false); // la acción no devolvió la página: se ofrece un enlace para continuar
  const [visible, setVisible] = useState(desde);
  const [pastilla, setPastilla] = useState(false);
  // Páginas muy atrás: en una edición larga el DOM y las fotos decodificadas se acumulaban (a 20 páginas, ~2800 nodos y 62 imágenes). Las que quedan a más de
  // 3 pantallas arriba (o 4 abajo, si el lector regresó) se sustituyen por un espacio de la misma altura y se vuelven a dibujar si el lector regresa.
  const [lejanas, setLejanas] = useState<Set<number>>(() => new Set());
  const alturas = useRef(new Map<number, number>());
  const hay = siguiente <= total && !detenido;

  // Solo en celular.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 639px)");
    setMovil(mq.matches);
    setPastilla(!document.querySelector("[data-contador]")); // las páginas de lienzo ya muestran n/total arriba; las clásicas, no
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
            } else setDetenido(true);
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
      const nuevas = new Set(lejanasRef.current);
      for (const s of Array.from(document.querySelectorAll<HTMLElement>("[data-flujo-n]"))) {
        const r = s.getBoundingClientRect();
        const num = Number(s.dataset.flujoN);
        if (!visible && r.top <= linea && r.bottom >= linea) visible = num;
        if (num === desde) continue; // la primera página llega del servidor, no se descarga
        const alto = window.innerHeight;
        const lejos = r.bottom < -alto * 3 || r.top > alto * 4; // muy arriba (ya leída) o muy abajo (el lector regresó)
        const cerca = r.bottom > -alto * 2 && r.top < alto * 3;
        if (!nuevas.has(num) && lejos) {
          alturas.current.set(num, r.height);
          nuevas.add(num);
        } else if (nuevas.has(num) && cerca) nuevas.delete(num); // vuelve a acercarse: se dibuja otra vez
      }
      if (nuevas.size !== lejanasRef.current.size || [...nuevas].some((n) => !lejanasRef.current.has(n))) {
        lejanasRef.current = nuevas;
        setLejanas(nuevas);
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
      setVisible(visible);
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
  }, [movil, hrefs, titulos, numero, total, paginas.length, desde]);

  return (
    <div className="sm:hidden">
      {pastilla && movil && (
        <div aria-hidden className="pointer-events-none fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full bg-ink/85 px-3 py-1 font-sans text-xs font-bold tabular-nums text-paper shadow-lg">
          {visible} / {total}
        </div>
      )}
      {paginas.map((p) => (
        <Fragment key={p.n}>
          <Union />
          {lejanas.has(p.n) ? (
            <div data-flujo-n={p.n} aria-hidden style={{ height: alturas.current.get(p.n) }} />
          ) : (
            <div data-flujo-n={p.n} className={HOJA}>
              {p.nodo}
            </div>
          )}
        </Fragment>
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
        <div className="mx-auto max-w-[900px] border-t-4 border-double border-ink px-5 py-8 text-center">
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
