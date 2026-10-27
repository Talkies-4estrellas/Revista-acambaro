"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Menú del clic derecho para el editor: una lista de acciones que se abre junto al puntero, se mantiene dentro de la
 * pantalla y se cierra al elegir, con Esc, al hacer clic fuera, al desplazarse o al cambiar el tamaño de la ventana.
 * Se maneja también con el teclado (↑ ↓ Inicio Fin, Enter).
 */

export type AccionMenu = {
  texto: string;
  onClick: () => void;
  /** Atajo de teclado que ya existe para esta acción (solo informativo). */
  atajo?: string;
  icono?: string;
  deshabilitado?: boolean;
  /** Acción que borra: se pinta en rojo. */
  peligro?: boolean;
  /** Marca ✓ (acciones de encendido/apagado). */
  marcado?: boolean;
};
export type ItemMenu = AccionMenu | { separador: true } | { titulo: string };

const esAccion = (i: ItemMenu): i is AccionMenu => "texto" in i;

function Menu({ x, y, items, cerrar }: { x: number; y: number; items: ItemMenu[]; cerrar: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const [sitio, setSitio] = useState({ left: x, top: y, visible: false });

  // Se coloca dentro de la pantalla: si no cabe a la derecha o abajo del puntero, se abre hacia la izquierda o hacia arriba.
  useLayoutEffect(() => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    const margen = 8;
    const left = x + r.width + margen > window.innerWidth ? Math.max(margen, x - r.width) : x;
    const top = y + r.height + margen > window.innerHeight ? Math.max(margen, window.innerHeight - r.height - margen) : y;
    setSitio({ left, top, visible: true });
  }, [x, y, items]);

  useEffect(() => {
    const fuera = (e: Event) => {
      if (!ref.current?.contains(e.target as Node)) cerrar();
    };
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrar();
        return;
      }
      const botones = [...(ref.current?.querySelectorAll<HTMLButtonElement>("button:not([disabled])") ?? [])];
      if (botones.length === 0) return;
      const i = botones.indexOf(document.activeElement as HTMLButtonElement);
      if (e.key === "ArrowDown") {
        e.preventDefault();
        botones[(i + 1) % botones.length].focus();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        botones[(i - 1 + botones.length) % botones.length].focus();
      } else if (e.key === "Home") {
        e.preventDefault();
        botones[0].focus();
      } else if (e.key === "End") {
        e.preventDefault();
        botones[botones.length - 1].focus();
      }
    };
    document.addEventListener("pointerdown", fuera, true);
    document.addEventListener("contextmenu", fuera, true);
    document.addEventListener("keydown", tecla, true);
    window.addEventListener("resize", cerrar);
    window.addEventListener("blur", cerrar);
    document.addEventListener("scroll", cerrar, true);
    document.addEventListener("wheel", cerrar, { capture: true, passive: true });
    return () => {
      document.removeEventListener("pointerdown", fuera, true);
      document.removeEventListener("contextmenu", fuera, true);
      document.removeEventListener("keydown", tecla, true);
      window.removeEventListener("resize", cerrar);
      window.removeEventListener("blur", cerrar);
      document.removeEventListener("scroll", cerrar, true);
      document.removeEventListener("wheel", cerrar, true);
    };
  }, [cerrar]);

  // El primer botón recibe el foco para poder usar el teclado de inmediato.
  useEffect(() => {
    if (sitio.visible) ref.current?.querySelector<HTMLButtonElement>("button:not([disabled])")?.focus({ preventScroll: true });
  }, [sitio.visible]);

  return (
    <div
      ref={ref}
      role="menu"
      onContextMenu={(e) => e.preventDefault()}
      className="font-sans fixed z-[95] max-h-[calc(100vh-16px)] min-w-[13rem] max-w-[18rem] overflow-y-auto rounded-lg border border-ink/30 bg-paper py-1 text-sm shadow-2xl"
      style={{ left: sitio.left, top: sitio.top, visibility: sitio.visible ? "visible" : "hidden" }}
    >
      {items.map((it, k) =>
        esAccion(it) ? (
          <button
            key={k}
            type="button"
            role="menuitem"
            disabled={it.deshabilitado}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              cerrar();
              it.onClick();
            }}
            className={`flex w-full items-center gap-2 px-3 py-1.5 text-left outline-none focus:bg-ink/10 enabled:hover:bg-ink/10 disabled:opacity-40 ${it.peligro ? "text-red-700" : "text-ink"}`}
          >
            <span aria-hidden className="w-4 shrink-0 text-center text-xs">
              {it.marcado ? "✓" : it.icono ?? ""}
            </span>
            <span className="min-w-0 flex-1 truncate">{it.texto}</span>
            {it.atajo && <span className="ml-3 shrink-0 text-[0.68rem] text-ink-soft">{it.atajo}</span>}
          </button>
        ) : "separador" in it ? (
          <div key={k} role="separator" className="my-1 border-t border-ink/15" />
        ) : (
          <p key={k} className="px-3 pb-0.5 pt-1.5 text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft">
            {it.titulo}
          </p>
        ),
      )}
    </div>
  );
}

/**
 * Para usar el menú: `const { abrir, menu } = useMenuContextual();` → en el elemento, `onContextMenu={(e) => abrir(e, items)}` y
 * se pinta `{menu}` una vez en el componente. `abrir` cancela el menú del navegador.
 */
export function useMenuContextual() {
  const [abierto, setAbierto] = useState<null | { x: number; y: number; items: ItemMenu[] }>(null);
  const cerrar = useCallback(() => setAbierto(null), []);
  const abrir = useCallback((e: { clientX: number; clientY: number; preventDefault: () => void }, items: ItemMenu[]) => {
    e.preventDefault();
    const utiles = items.filter((i, k, l) => !("separador" in i) || (k > 0 && k < l.length - 1 && !("separador" in l[k - 1])));
    if (utiles.length === 0) return;
    setAbierto({ x: e.clientX, y: e.clientY, items: utiles });
  }, []);
  const menu = abierto && typeof document !== "undefined" ? createPortal(<Menu x={abierto.x} y={abierto.y} items={abierto.items} cerrar={cerrar} />, document.body) : null;
  return { abrir, cerrar, menu };
}
