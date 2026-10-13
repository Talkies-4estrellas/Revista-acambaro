"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

/** Grosor de las reglas en píxeles. */
export const GROSOR_REGLA = 22;

type Caja = { l: number; t: number; r: number; b: number };

/** Paso entre marcas principales: el menor "redondo" que deje al menos 60 px entre una y otra. */
function pasoPrincipal(s: number) {
  return [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500, 1000, 2000].find((c) => c * s >= 60) ?? 2000;
}
/** Marcas secundarias: cinco por tramo si es divisible, si no mitades. */
function pasoSecundario(m: number) {
  if (m >= 10 && m % 5 === 0) return m / 5;
  if (m >= 2 && m % 2 === 0) return m / 2;
  return m;
}

/**
 * Reglas horizontal y vertical del lienzo, en unidades de la hoja. Siguen el zoom y el desplazamiento, resaltan el
 * ancho de la hoja, la posición del puntero y lo que está seleccionado. Arrastrar desde una regla crea una guía.
 */
export default function Reglas({
  vista,
  alto,
  ancho,
  seleccion,
  contenedor,
  onGuia,
}: {
  vista: { s: number; x: number; y: number };
  alto: number;
  ancho: number;
  seleccion: Caja | null;
  /** Área de trabajo: de ella se miden el tamaño y el puntero. */
  contenedor: RefObject<HTMLDivElement | null>;
  /** Se arrastra desde la regla horizontal (crea una guía vertical, "v") o la vertical (guía horizontal, "h"). */
  onGuia: (eje: "v" | "h", e: React.PointerEvent) => void;
}) {
  const [tam, setTam] = useState({ w: 800, h: 600 });
  const marcaX = useRef<HTMLDivElement>(null);
  const marcaY = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const nodo = contenedor.current;
    if (!nodo) return;
    const medir = () => setTam({ w: nodo.clientWidth, h: nodo.clientHeight });
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(nodo);
    // La marca del puntero se mueve directamente en el DOM para no redibujar nada en cada movimiento.
    const mover = (e: PointerEvent) => {
      const r = nodo.getBoundingClientRect();
      if (marcaX.current) marcaX.current.style.transform = `translateX(${e.clientX - r.left}px)`;
      if (marcaY.current) marcaY.current.style.transform = `translateY(${e.clientY - r.top}px)`;
    };
    nodo.addEventListener("pointermove", mover);
    return () => {
      ro.disconnect();
      nodo.removeEventListener("pointermove", mover);
    };
  }, [contenedor]);

  const { s, x, y } = vista;
  const T = GROSOR_REGLA;
  const m = pasoPrincipal(s);
  const mn = pasoSecundario(m);

  /** Marcas visibles entre las unidades `u0` y `u1`. */
  const marcas = (u0: number, u1: number) => {
    const lista: { u: number; mayor: boolean }[] = [];
    const ini = Math.floor(u0 / mn) * mn;
    for (let u = ini; u <= u1 && lista.length < 400; u += mn) lista.push({ u, mayor: Math.round(u) % m === 0 });
    return lista;
  };
  const horizontales = marcas((T - x) / s, (tam.w - x) / s);
  const verticales = marcas((T - y) / s, (tam.h - y) / s);

  const fondo = "#efe8d8";
  const tinta = "#1c1814";
  const suave = "rgba(28,24,20,.55)";

  return (
    <>
      {/* Regla horizontal */}
      <svg
        aria-hidden
        className="absolute left-0 top-0 z-20 cursor-col-resize select-none"
        width={tam.w}
        height={T}
        style={{ background: fondo, borderBottom: "1px solid rgba(28,24,20,.4)" }}
        onPointerDown={(e) => onGuia("v", e)}
      >
        <rect x={x} y={0} width={ancho * s} height={T} fill="#fbf8f1" />
        {seleccion && <rect x={x + seleccion.l * s} y={0} width={(seleccion.r - seleccion.l) * s} height={T} fill="rgba(181,71,47,.28)" />}
        {horizontales.map(({ u, mayor }) => {
          const px = x + u * s;
          if (px < T) return null;
          return (
            <g key={u}>
              <line x1={px} x2={px} y1={mayor ? 8 : T - 6} y2={T} stroke={mayor ? tinta : suave} strokeWidth={1} />
              {mayor && (
                <text x={px + 3} y={11} fontSize={9} fill={tinta} fontFamily="Inter, system-ui, sans-serif">
                  {Math.round(u)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Regla vertical */}
      <svg
        aria-hidden
        className="absolute left-0 top-0 z-20 cursor-row-resize select-none"
        width={T}
        height={tam.h}
        style={{ background: fondo, borderRight: "1px solid rgba(28,24,20,.4)" }}
        onPointerDown={(e) => onGuia("h", e)}
      >
        <rect x={0} y={y} width={T} height={alto * s} fill="#fbf8f1" />
        {seleccion && <rect x={0} y={y + seleccion.t * s} width={T} height={(seleccion.b - seleccion.t) * s} fill="rgba(181,71,47,.28)" />}
        {verticales.map(({ u, mayor }) => {
          const py = y + u * s;
          if (py < T) return null;
          return (
            <g key={u}>
              <line y1={py} y2={py} x1={mayor ? 8 : T - 6} x2={T} stroke={mayor ? tinta : suave} strokeWidth={1} />
              {mayor && (
                <text
                  x={11}
                  y={py - 3}
                  fontSize={9}
                  fill={tinta}
                  fontFamily="Inter, system-ui, sans-serif"
                  transform={`rotate(-90 11 ${py - 3})`}
                >
                  {Math.round(u)}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Esquina */}
      <div className="absolute left-0 top-0 z-30 border-b border-r border-ink/40" style={{ width: T, height: T, background: fondo }} />

      {/* Posición del puntero */}
      <div ref={marcaX} className="pointer-events-none absolute left-0 top-0 z-30 w-px bg-terracota" style={{ height: T }} />
      <div ref={marcaY} className="pointer-events-none absolute left-0 top-0 z-30 h-px bg-terracota" style={{ width: T }} />
    </>
  );
}
