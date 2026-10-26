"use client";

import { useEffect, useRef, useState } from "react";

/** Menú desplegable de la barra superior del editor (el estilo de «Archivo» de Canva). */
export function MenuSuperior({ etiqueta, titulo, children, alinear = "izquierda", primario = false, ancho = "w-72" }: { etiqueta: React.ReactNode; titulo: string; children: (cerrar: () => void) => React.ReactNode; alinear?: "izquierda" | "derecha"; primario?: boolean; ancho?: string }) {
  const [abierto, setAbierto] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setAbierto(false);
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
    };
  }, [abierto]);
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        title={titulo}
        aria-haspopup="menu"
        aria-expanded={abierto}
        onClick={() => setAbierto((a) => !a)}
        className={primario ? "font-sans inline-flex items-center gap-1.5 rounded-md bg-white px-3.5 py-1.5 text-sm font-bold text-ink shadow-sm hover:bg-white/90" : `font-sans inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-bold text-white hover:bg-white/15 ${abierto ? "bg-white/20" : ""}`}
      >
        {etiqueta}
      </button>
      {abierto && (
        <div role="menu" className={`absolute top-full z-50 mt-1 ${ancho} ${alinear === "derecha" ? "right-0" : "left-0"} overflow-hidden rounded-lg border border-ink/30 bg-paper py-1 text-ink shadow-2xl`}>
          {children(() => setAbierto(false))}
        </div>
      )}
    </div>
  );
}

/** Una fila del menú: icono, texto y, si lo hay, el atajo de teclado. */
export function ItemMenu({ icono, texto, atajo, onClick, deshabilitado, marcado, href, nota }: { icono?: React.ReactNode; texto: string; atajo?: string; onClick?: () => void; deshabilitado?: boolean; marcado?: boolean; href?: string; nota?: string }) {
  const cls = "font-sans flex w-full items-center gap-3 px-3.5 py-2 text-left text-sm hover:bg-ink/10 disabled:opacity-40 disabled:hover:bg-transparent";
  const contenido = (
    <>
      <span className="w-5 shrink-0 text-center text-base" aria-hidden>
        {marcado !== undefined ? (marcado ? "✓" : "") : icono}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-semibold">{texto}</span>
        {nota && <span className="block text-[0.7rem] font-normal text-ink-soft">{nota}</span>}
      </span>
      {atajo && <span className="shrink-0 text-xs text-ink-soft">{atajo}</span>}
    </>
  );
  return href ? (
    <a role="menuitem" href={href} target="_blank" rel="noreferrer" className={cls} onClick={onClick}>
      {contenido}
    </a>
  ) : (
    <button type="button" role="menuitem" className={cls} onClick={onClick} disabled={deshabilitado}>
      {contenido}
    </button>
  );
}

export const SeparadorMenu = () => <div role="separator" className="my-1 h-px bg-ink/15" />;
