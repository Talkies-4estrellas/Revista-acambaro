"use client";

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import { btnCls } from "./campos";

export type PasoRecorrido = {
  /** Valor de data-tour de la pieza que se resalta; sin él, el paso va al centro. */
  objetivo?: string;
  titulo: string;
  texto: string;
};

/** El recorrido de bienvenida: de lo que se hace primero a lo último. */
export const PASOS_BIENVENIDA: PasoRecorrido[] = [
  { titulo: "¡Bienvenido al editor!", texto: "En menos de un minuto te muestro dónde está lo importante. Puedes saltarte esto cuando quieras, y volver a verlo desde el botón «?» de arriba." },
  { objetivo: "riel", titulo: "1. Las herramientas", texto: "Aquí empiezas: Plantillas (páginas ya diseñadas), Elementos (figuras, formas, iconos…), Texto y Subidos (tus fotos). Haz clic en una y se abre su panel; un clic en lo que elijas lo agrega a la página." },
  { objetivo: "hoja", titulo: "2. La hoja", texto: "Esta es tu página. Haz clic en cualquier cosa para elegirla, arrástrala para moverla y haz doble clic en un texto para escribir." },
  { objetivo: "barra", titulo: "3. Los ajustes", texto: "Cuando eliges algo, aquí aparecen sus ajustes: tipo de letra, tamaño, color, reemplazar una foto, animar… Sin nada elegido, aquí cambias el fondo de la página." },
  { objetivo: "paginas", titulo: "4. Las páginas", texto: "Aquí están todas las páginas de la edición. Haz clic en una para abrirla, arrastra para cambiarla de lugar y agrega una nueva abajo." },
  { objetivo: "archivo", titulo: "5. Archivo", texto: "Guardar, volver a una versión anterior, ver todas tus fotos, buscar y reemplazar un texto en toda la edición… todo está en este menú." },
  { objetivo: "revisar", titulo: "6. Revisar", texto: "Antes de publicar, pulsa «Revisar»: te avisa de textos de ejemplo sin cambiar, letra muy chica, botones sin enlace y más. A veces lo arregla con un clic." },
  { objetivo: "publicar", titulo: "7. Publicar", texto: "Cuando esté lista, aquí la publicas, la programas para otro día o la dejas como borrador. Mientras es borrador, nadie la ve." },
  { objetivo: "ayuda", titulo: "¡Listo! ¿Dudas?", texto: "Este botón «?» abre la ayuda con búsqueda («¿cómo subo una foto?») y repite este recorrido cuando quieras. ¡A crear!" },
];

const MARGEN = 8;

/**
 * Recorrido guiado: oscurece la pantalla, resalta una pieza del editor y explica para qué sirve. Los pasos cuya pieza no está a la vista
 * (por ejemplo, en un teléfono) se saltan solos. Se cierra con «Saltar», con Esc o al terminar.
 */
export default function RecorridoEditor({ pasos, alTerminar }: { pasos: PasoRecorrido[]; alTerminar: () => void }) {
  // Solo los pasos cuya pieza existe y se ve (se decide una vez, al abrir).
  const lista = useMemo(
    () =>
      pasos.filter((p) => {
        if (!p.objetivo) return true;
        const el = document.querySelector(`[data-tour="${p.objetivo}"]`);
        if (!el) return false;
        const r = el.getBoundingClientRect();
        return r.width > 4 && r.height > 4;
      }),
    [pasos],
  );
  const [i, setI] = useState(0);
  const [caja, setCaja] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [vista, setVista] = useState({ w: 1200, h: 800 });
  const paso = lista[i];

  // Mide la pieza resaltada (y vuelve a medir si la ventana cambia o se desplaza).
  useLayoutEffect(() => {
    if (!paso) return;
    const medir = () => {
      setVista({ w: window.innerWidth, h: window.innerHeight });
      if (!paso.objetivo) return setCaja(null);
      const el = document.querySelector(`[data-tour="${paso.objetivo}"]`);
      if (!el) return setCaja(null);
      const r = el.getBoundingClientRect();
      setCaja({ x: Math.max(0, r.left - 6), y: Math.max(0, r.top - 6), w: Math.min(window.innerWidth, r.width + 12), h: Math.min(window.innerHeight, r.height + 12) });
    };
    if (paso.objetivo) document.querySelector(`[data-tour="${paso.objetivo}"]`)?.scrollIntoView({ block: "nearest", inline: "nearest" });
    medir();
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    const t = window.setInterval(medir, 400); // por si la pantalla se acomoda sola (paneles que se abren, etc.)
    return () => {
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
      window.clearInterval(t);
    };
  }, [paso]);

  const ultimo = i >= lista.length - 1;
  const siguiente = () => (ultimo ? alTerminar() : setI((n) => n + 1));
  const anterior = () => setI((n) => Math.max(0, n - 1));

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") alTerminar();
      else if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        siguiente();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        anterior();
      }
    };
    window.addEventListener("keydown", tecla, true);
    return () => window.removeEventListener("keydown", tecla, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i, lista.length]);

  // Sin ninguna pieza visible (pantalla muy distinta), no hay nada que enseñar.
  useEffect(() => {
    if (lista.length === 0) alTerminar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  if (!paso) return null;

  // La tarjeta va debajo de la pieza si cabe, si no arriba, a la derecha o a la izquierda; sin pieza, al centro.
  const ANCHO = Math.min(360, vista.w - 2 * MARGEN);
  const ALTO = 190;
  let left = (vista.w - ANCHO) / 2;
  let top = (vista.h - ALTO) / 2;
  if (caja) {
    const abajo = caja.y + caja.h + 12;
    const arriba = caja.y - ALTO - 12;
    if (abajo + ALTO <= vista.h - MARGEN) {
      top = abajo;
      left = caja.x + caja.w / 2 - ANCHO / 2;
    } else if (arriba >= MARGEN) {
      top = arriba;
      left = caja.x + caja.w / 2 - ANCHO / 2;
    } else if (caja.x + caja.w + ANCHO + 12 <= vista.w) {
      left = caja.x + caja.w + 12;
      top = Math.max(MARGEN, Math.min(vista.h - ALTO - MARGEN, caja.y));
    } else {
      left = Math.max(MARGEN, caja.x - ANCHO - 12);
      top = Math.max(MARGEN, Math.min(vista.h - ALTO - MARGEN, caja.y));
    }
    left = Math.max(MARGEN, Math.min(vista.w - ANCHO - MARGEN, left));
  }

  return (
    <div className="fixed inset-0 z-[90]" role="dialog" aria-modal="true" aria-label="Recorrido guiado">
      {/* Capa que impide tocar el editor mientras dura el recorrido */}
      <div className="absolute inset-0" />
      {caja ? (
        <div
          aria-hidden
          className="pointer-events-none absolute rounded-lg border-2 border-white transition-all duration-300"
          style={{ left: caja.x, top: caja.y, width: caja.w, height: caja.h, boxShadow: "0 0 0 9999px rgba(15, 23, 42, 0.66)" }}
        />
      ) : (
        <div aria-hidden className="absolute inset-0 bg-slate-900/66" style={{ background: "rgba(15, 23, 42, 0.66)" }} />
      )}
      <div className="absolute rounded-xl border-2 border-ink bg-paper p-4 shadow-2xl transition-all duration-300" style={{ left, top, width: ANCHO }}>
        <p className="font-sans text-[0.68rem] font-bold uppercase tracking-wider text-ink-soft">
          Paso {i + 1} de {lista.length}
        </p>
        <h2 className="font-display mt-1 text-xl font-black leading-tight">{paso.titulo}</h2>
        <p className="font-sans mt-2 text-sm leading-relaxed text-ink">{paso.texto}</p>
        <div className="mt-4 flex items-center gap-2">
          <button type="button" className="font-sans mr-auto text-xs font-semibold text-ink-soft underline hover:text-ink" onClick={alTerminar}>
            {ultimo ? "Cerrar" : "Saltar el recorrido"}
          </button>
          {i > 0 && (
            <button type="button" className={btnCls} onClick={anterior}>
              ← Atrás
            </button>
          )}
          <button type="button" className={`${btnCls} !bg-ink !px-4 !text-paper`} onClick={siguiente} autoFocus>
            {ultimo ? "¡Entendido!" : i === 0 ? "Empezar →" : "Siguiente →"}
          </button>
        </div>
      </div>
    </div>
  );
}
