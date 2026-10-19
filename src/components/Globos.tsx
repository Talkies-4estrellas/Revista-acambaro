"use client";

import type { CSSProperties, PointerEvent as ReactPointerEvent } from "react";
import { colorCss, fuenteCss, type Globo } from "@/lib/esquema";

/** Acciones del editor para mover y redimensionar globos con el puntero (solo cuando la imagen está seleccionada sola). */
export type EdicionGlobos = {
  seleccionado: number | null;
  onSeleccionar: (i: number) => void;
  onCambiar: (i: number, patch: Partial<Globo>) => void;
};

const redondear = (n: number) => Math.round(n * 10) / 10;
const CONTORNO = "0.09em solid #14110d";

function formaCss(g: Globo): CSSProperties {
  switch (g.forma ?? "globo") {
    case "pensamiento":
      return { borderRadius: "50%", border: CONTORNO };
    case "recuadro":
      return { borderRadius: 0, border: CONTORNO };
    case "sonido":
      return { borderRadius: "0.3em", border: CONTORNO, fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.04em" };
    case "tapa":
      return { borderRadius: "0.15em", border: "none" };
    default:
      return { borderRadius: "1.3em", border: CONTORNO };
  }
}

/** Cola del globo: un cuadrito girado 45° con el mismo fondo, con borde solo en las dos caras que asoman. */
function Cola({ g, fondo }: { g: Globo; fondo: string }) {
  const cola = g.cola ?? "abajo-izquierda";
  if ((g.forma ?? "globo") !== "globo" || cola === "ninguna") return null;
  const abajo = cola.startsWith("abajo");
  const izquierda = cola.endsWith("izquierda");
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        width: "0.8em",
        height: "0.8em",
        background: fondo,
        transform: "rotate(45deg)",
        [abajo ? "bottom" : "top"]: "-0.42em",
        [izquierda ? "left" : "right"]: "22%",
        borderStyle: "solid",
        borderColor: "#14110d",
        borderWidth: abajo ? "0 0.09em 0.09em 0" : "0.09em 0 0 0.09em",
      }}
    />
  );
}

/**
 * Globos de texto dibujados sobre una imagen. El contenedor debe ser `position: relative` y ocupar toda la imagen; la letra se mide
 * en `cqw` (% del ancho de la imagen), así todo escala con ella.
 */
export default function GlobosVista({ globos, edicion }: { globos: Globo[]; edicion?: EdicionGlobos }) {
  function empezar(e: ReactPointerEvent, i: number, modo: "mover" | "tam") {
    if (!edicion) return;
    e.stopPropagation();
    e.preventDefault();
    edicion.onSeleccionar(i);
    const caja = (e.currentTarget as HTMLElement).closest("[data-globos]")?.getBoundingClientRect();
    if (!caja || caja.width === 0) return;
    const g0 = globos[i];
    const x0 = e.clientX;
    const y0 = e.clientY;
    const mover = (ev: PointerEvent) => {
      const dx = ((ev.clientX - x0) / caja.width) * 100;
      const dy = ((ev.clientY - y0) / caja.height) * 100;
      if (modo === "mover") edicion.onCambiar(i, { x: redondear(g0.x + dx), y: redondear(g0.y + dy) });
      else edicion.onCambiar(i, { w: Math.max(3, redondear(g0.w + dx)), h: Math.max(3, redondear(g0.h + dy)) });
    };
    const fin = () => {
      window.removeEventListener("pointermove", mover);
      window.removeEventListener("pointerup", fin);
    };
    window.addEventListener("pointermove", mover);
    window.addEventListener("pointerup", fin);
  }

  return (
    <div data-globos style={{ position: "absolute", inset: 0, containerType: "inline-size", pointerEvents: edicion ? "auto" : "none" }}>
      {globos.map((g, i) => {
        const fondo = colorCss(g.fondo, "#fffef8");
        const activo = edicion?.seleccionado === i;
        return (
          <div
            key={i}
            onPointerDown={edicion ? (e) => empezar(e, i, "mover") : undefined}
            style={{
              position: "absolute",
              left: `${g.x}%`,
              top: `${g.y}%`,
              width: `${g.w}%`,
              height: `${g.h}%`,
              boxSizing: "border-box",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              textAlign: "center",
              padding: "0.3em 0.45em",
              fontFamily: fuenteCss(g.fuente ?? "comicneue"),
              fontWeight: 700,
              fontSize: `${g.tam ?? 3}cqw`,
              lineHeight: 1.15,
              color: colorCss(g.color, "#14110d"),
              background: fondo,
              textTransform: g.mayusculas ? "uppercase" : undefined,
              overflowWrap: "break-word",
              whiteSpace: "pre-wrap",
              cursor: edicion ? "move" : undefined,
              outline: activo ? "2px dashed #068562" : edicion ? "1px dashed rgba(6,133,98,.45)" : undefined,
              outlineOffset: activo ? "2px" : undefined,
              ...formaCss(g),
            }}
          >
            <Cola g={g} fondo={fondo} />
            <span style={{ position: "relative" }}>{g.texto}</span>
            {activo && edicion && (
              <span
                onPointerDown={(e) => empezar(e, i, "tam")}
                title="Arrastra para cambiar el tamaño"
                className="h-3 w-3 pointer-coarse:h-6 pointer-coarse:w-6"
                style={{ position: "absolute", right: -7, bottom: -7, background: "#fff", border: "1.5px solid #068562", cursor: "nwse-resize" }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
