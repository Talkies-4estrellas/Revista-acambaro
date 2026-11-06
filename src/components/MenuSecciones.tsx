"use client";

import { useEffect, useRef, useState } from "react";
import { IconoSvg } from "@/components/Lienzo";

const SECCIONES = [
  { icono: "landmark", titulo: "Historia", texto: "El ferrocarril, los barrios y los edificios", href: "/temas/historia" },
  { icono: "utensils", titulo: "Sabor", texto: "El pan, los guisos y los mercados", href: "/temas/sabor" },
  { icono: "users", titulo: "Gente", texto: "Oficios, familias y personajes", href: "/temas/gente" },
  { icono: "mountain", titulo: "Paisajes", texto: "Lugares, caminos y rincones", href: "/temas/paisajes" },
  { icono: "ticket", titulo: "Cupones", texto: "Promociones de negocios locales", href: "#cupones" },
  { icono: "search", titulo: "Buscador", texto: "Encuentra cualquier página", href: "/buscar" },
];

/** Menú desplegable de la presentación: una cuadrícula con los temas de la revista, cada uno con su icono. */
export default function MenuSecciones() {
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("pointerdown", fuera);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", fuera);
      window.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  return (
    <div ref={caja} className="md:relative">
      <button
        type="button"
        aria-expanded={abierto}
        aria-controls="menu-secciones"
        aria-label="Secciones"
        onClick={() => setAbierto((v) => !v)}
        className="font-sans flex h-10 items-center gap-1.5 text-sm font-semibold hover:text-terracota max-sm:w-10 max-sm:justify-center max-sm:border max-sm:border-ink/50"
      >
        <span aria-hidden className="sm:hidden">☰</span>
        <span className="hidden sm:inline">Secciones</span>
        {/* La clase «hidden» va en un envoltorio: IconoSvg lleva display: block en su estilo. */}
        <span className="hidden sm:block">
          <IconoSvg icono="chevron-down" color="tinta" trazo={2} className={`h-4 w-4 transition-transform ${abierto ? "rotate-180" : ""}`} />
        </span>
      </button>
      {abierto && (
        <ul
          id="menu-secciones"
          className="absolute inset-x-3 top-full z-40 mt-2 grid gap-1 rounded-2xl border border-ink/15 bg-paper p-3 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.5)] sm:grid-cols-2 md:inset-x-auto md:left-0 md:w-[34rem]"
        >
          {SECCIONES.map((s) => (
            <li key={s.titulo}>
              <a href={s.href} onClick={() => setAbierto(false)} className="font-sans flex items-center gap-3 rounded-xl p-2.5 hover:bg-ink/[0.06]">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-[#067556]/10">
                  <IconoSvg icono={s.icono} color="#067556" trazo={1.7} className="h-5 w-5" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-bold">{s.titulo}</span>
                  <span className="block text-xs text-ink-soft">{s.texto}</span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
