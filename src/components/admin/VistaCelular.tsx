"use client";

import { useEffect, useRef, useState } from "react";
import { LienzoResponsivo } from "@/components/Lienzo";
import type { Pagina } from "@/lib/esquema";
import { btnCls } from "./campos";
import OrdenColumna from "./OrdenColumna";

const DISPOSITIVOS = [
  { id: "galaxy", nombre: "Galaxy S · 360", ancho: 360, alto: 740 },
  { id: "se", nombre: "iPhone SE · 375", ancho: 375, alto: 667 },
  { id: "iphone", nombre: "iPhone 14 · 390", ancho: 390, alto: 760 },
  { id: "pixel", nombre: "Pixel · 412", ancho: 412, alto: 780 },
  { id: "tableta", nombre: "Tableta · 768", ancho: 768, alto: 1000 },
] as const;

/** Tamaño mínimo cómodo para leer en un teléfono (px). */
const MIN_LEGIBLE = 11;

/**
 * Vista previa de la página como se vería en un celular, en vivo (sin guardar). Usa exactamente el mismo dibujo que el
 * sitio publicado: la hoja decide entre "reducir" o "apilar" según el ancho del dispositivo simulado.
 */
export default function VistaCelular({
  pagina,
  onChange,
  edicionId,
  seleccionados,
  onSeleccionar,
}: {
  pagina: Pagina;
  onChange: (p: Pagina) => void;
  edicionId: string;
  /** Elementos seleccionados en la hoja (se resaltan en el orden de la columna). */
  seleccionados: string[];
  onSeleccionar: (ids: string[]) => void;
}) {
  const [id, setId] = useState<(typeof DISPOSITIVOS)[number]["id"]>("iphone");
  const dispositivo = DISPOSITIVOS.find((d) => d.id === id)!;
  const caja = useRef<HTMLDivElement>(null);
  const [disponible, setDisponible] = useState(320);

  useEffect(() => {
    const nodo = caja.current;
    if (!nodo) return;
    const medir = () => setDisponible(Math.max(200, nodo.clientWidth));
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(nodo);
    return () => ro.disconnect();
  }, []);

  // El dispositivo se dibuja a su ancho real y se reduce visualmente para que quepa en el panel.
  const marco = 10;
  const escala = Math.min(1, (disponible - 2 * marco) / dispositivo.ancho);
  const modo = pagina.movil ?? "escala";

  const textos = (pagina.elementos ?? []).filter((e) => e.tipo === "texto");
  // En modo "escala" el texto se reduce con la hoja (800 → ancho del dispositivo).
  const pequenos =
    modo === "escala" && dispositivo.ancho < 640
      ? textos.filter((e) => e.tipo === "texto" && (e.tam ?? 24) * (dispositivo.ancho / 800) < MIN_LEGIBLE)
      : [];

  return (
    <div className="space-y-3">
      <div className="space-y-2 border border-ink/30 bg-white/40 dark:bg-white/5 p-3">
        <h3 className="font-sans text-xs font-bold uppercase tracking-wider">Vista del celular</h3>
        <select
          aria-label="Dispositivo"
          className="font-sans h-8 w-full border border-ink/40 bg-paper px-2 text-sm"
          value={id}
          onChange={(e) => setId(e.target.value as typeof id)}
        >
          {DISPOSITIVOS.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre} px
            </option>
          ))}
        </select>
        <div className="flex gap-1" role="group" aria-label="Diseño en el celular">
          {(
            [
              ["escala", "Reducir la hoja"],
              ["apilar", "Apilar en columna"],
            ] as const
          ).map(([v, t]) => (
            <button
              key={v}
              type="button"
              aria-pressed={modo === v}
              onClick={() => onChange({ ...pagina, movil: v === "escala" ? undefined : v })}
              className={`${btnCls} flex-1 ${modo === v ? "!bg-ink !text-paper" : ""}`}
            >
              {t}
            </button>
          ))}
        </div>
        <p className="font-sans text-[0.7rem] leading-relaxed text-ink-soft">
          {modo === "apilar"
            ? "Con pantallas de 640 px o menos, los elementos se colocan en una columna, de arriba abajo, con texto legible. En pantallas grandes la hoja no cambia. Cada elemento puede mostrarse u ocultarse en el celular desde sus propiedades."
            : "Con pantallas estrechas se reduce la hoja entera, tal cual está diseñada."}
        </p>
        {pequenos.length > 0 && (
          <p role="status" className="font-sans border-l-4 border-terracota bg-terracota/10 px-2 py-1.5 text-[0.72rem] leading-snug text-ink">
            <strong>{pequenos.length === 1 ? "1 texto se vería demasiado pequeño" : `${pequenos.length} textos se verían demasiado pequeños`}</strong> (menos de {MIN_LEGIBLE} px) en
            este dispositivo. Prueba “Apilar en columna” o aumenta su tamaño.
          </p>
        )}
      </div>

      {modo === "apilar" && (
        <OrdenColumna pagina={pagina} onChange={onChange} seleccionados={seleccionados} onSeleccionar={onSeleccionar} />
      )}

      <div ref={caja} className="w-full">
        <div
          className="mx-auto overflow-hidden border-[6px] border-ink bg-ink shadow-lg"
          style={{ width: dispositivo.ancho * escala + 12, height: dispositivo.alto * escala + 12, borderRadius: 26 * escala + 6 }}
        >
          <div
            style={{
              width: dispositivo.ancho,
              height: dispositivo.alto,
              transform: `scale(${escala})`,
              transformOrigin: "top left",
              overflowY: "auto",
              overflowX: "hidden",
              background: "var(--paper-deep)",
            }}
          >
            <div style={{ padding: dispositivo.ancho >= 640 ? "12px 0" : 0 }}>
              <LienzoResponsivo
                elementos={pagina.elementos ?? []}
                fondo={pagina.fondo}
                alto={pagina.alto}
                movil={pagina.movil}
                ordenMovil={pagina.ordenMovil}
                edicionId={edicionId}
              />
            </div>
          </div>
        </div>
      </div>
      <p className="font-sans text-center text-[0.68rem] text-ink-soft">Se actualiza al editar; no hace falta guardar.</p>
    </div>
  );
}
