"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { colorEnPunto } from "@/lib/color-en-punto";

/**
 * Cuentagotas del lienzo: una capa transparente sobre toda la pantalla que muestra el color que hay bajo el puntero y deja
 * elegirlo con un clic, de cualquier elemento del área de trabajo (también de los que sobresalen de la hoja), pero no de los
 * paneles ni de los botones del editor ni del fondo gris. Esc o clic derecho cancelan.
 */
export default function CuentagotasHoja({ area, hoja, alTerminar }: { area: HTMLElement; hoja: HTMLElement | null; alTerminar: (color: string | null) => void }) {
  const [punto, setPunto] = useState<{ x: number; y: number; color: string | null } | null>(null);

  useEffect(() => {
    document.body.classList.add("cuentagotas-activo"); // oculta las ventanas de color mientras se escoge
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        alTerminar(null);
      }
    };
    window.addEventListener("keydown", tecla, true);
    return () => {
      document.body.classList.remove("cuentagotas-activo");
      window.removeEventListener("keydown", tecla, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const leer = (e: React.PointerEvent | React.MouseEvent) => {
    // La capa no debe interponerse en la lectura: se mira lo que hay debajo (colorEnPunto ignora lo que no es de la hoja).
    return colorEnPunto(area, hoja, e.clientX, e.clientY);
  };

  return createPortal(
    <div
      data-no-cerrar
      className="fixed inset-0 z-[90]"
      style={{ cursor: punto?.color ? "crosshair" : "not-allowed" }}
      onMouseDown={(e) => e.preventDefault()} // no robar el foco (si se está editando un texto, no pierde su selección)
      onPointerMove={(e) => setPunto({ x: e.clientX, y: e.clientY, color: leer(e) })}
      onClick={(e) => {
        const c = leer(e);
        if (c) alTerminar(c);
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        alTerminar(null);
      }}
    >
      <p className="font-sans pointer-events-none fixed left-1/2 top-3 -translate-x-1/2 rounded-full bg-ink px-4 py-1.5 text-xs font-bold text-paper shadow-lg">
        💧 Haz clic en un color del lienzo · Esc para cancelar
      </p>
      {punto?.color && (
        <span className="font-sans pointer-events-none fixed flex items-center gap-1.5 rounded-full border border-ink/40 bg-paper px-2 py-1 text-[0.7rem] font-bold shadow-lg" style={{ left: punto.x + 18, top: punto.y + 18 }}>
          <span aria-hidden className="h-5 w-5 rounded-full border border-ink/40" style={{ background: punto.color }} />
          {punto.color}
        </span>
      )}
    </div>,
    document.body,
  );
}
