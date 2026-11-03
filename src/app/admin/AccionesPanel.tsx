"use client";

import { useEffect, useState, type ReactNode } from "react";

type Panel = "nueva" | "resumen";

/**
 * Botones de arriba del panel (Estadísticas y Newsletter están en el menú lateral). «Nueva edición» y «Edición resumida» abren su formulario justo debajo (en vez de
 * tenerlo al final de la lista). También se abren con #nueva o #resumen en la dirección.
 */
export default function AccionesPanel({ nueva, resumen }: { nueva: ReactNode; resumen: ReactNode }) {
  const [abierto, setAbierto] = useState<Panel | null>(null);
  useEffect(() => {
    // También al llegar desde el menú lateral o la barra de arriba (#nueva, #resumen), sin recargar la página.
    const abrir = (h: string) => {
      if (h !== "nueva" && h !== "resumen") return;
      setAbierto(h);
      setTimeout(() => document.getElementById(h)?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    };
    const leer = () => abrir(window.location.hash.slice(1));
    // El menú lateral y la barra de arriba avisan directamente (en la misma página el # no siempre dispara «hashchange»).
    const aviso = (e: Event) => abrir(String((e as CustomEvent).detail));
    leer();
    window.addEventListener("hashchange", leer);
    window.addEventListener("acomdi:panel", aviso);
    return () => {
      window.removeEventListener("hashchange", leer);
      window.removeEventListener("acomdi:panel", aviso);
    };
  }, []);
  const alternar = (p: Panel) =>
    setAbierto((a) => {
      // Al cerrar se quita el #nueva / #resumen de la dirección (para que el menú lateral no lo siga marcando).
      if (a === p && window.location.hash) history.replaceState(null, "", window.location.pathname + window.location.search);
      return a === p ? null : p;
    });

  const btn = "font-sans inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider";
  return (
    <>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          aria-expanded={abierto === "nueva"}
          onClick={() => alternar("nueva")}
          className={`${btn} ${abierto === "nueva" ? "bg-terracota text-paper" : "bg-ink text-paper hover:bg-terracota"}`}
        >
          {abierto === "nueva" ? "✕ Cerrar" : "+ Nueva edición"}
        </button>
        <button
          type="button"
          aria-expanded={abierto === "resumen"}
          onClick={() => alternar("resumen")}
          className={`${btn} border ${abierto === "resumen" ? "border-terracota bg-terracota text-paper" : "border-ink hover:bg-ink hover:text-paper"}`}
        >
          {abierto === "resumen" ? "✕ Cerrar" : "⧉ Edición resumida"}
        </button>
      </div>
      {abierto && (
        <div className="order-last mt-6 w-full basis-full">
          <div id={abierto} className="scroll-mt-20">
            {abierto === "nueva" ? nueva : resumen}
          </div>
        </div>
      )}
    </>
  );
}
