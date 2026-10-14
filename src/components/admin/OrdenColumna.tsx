"use client";

import { Fragment, useState } from "react";
import { bloquesMovil, type BloqueMovil } from "@/components/Lienzo";
import { ICONOS } from "@/lib/iconos-datos";
import type { Elemento, Pagina } from "@/lib/esquema";
import { btnCls } from "./campos";

const GLIFO: Record<Elemento["tipo"], string> = { texto: "T", imagen: "▣", video: "▶", icono: "✦", forma: "■" };

function etiqueta(e: Elemento): string {
  switch (e.tipo) {
    case "texto":
      return e.texto.replace(/\s+/g, " ").trim().slice(0, 34) || "(texto vacío)";
    case "imagen":
      return e.alt || "Imagen";
    case "video":
      return "Video";
    case "icono":
      return ICONOS[e.icono]?.nombre ?? e.icono;
    case "forma":
      return e.h <= 14 ? "Línea" : "Forma";
  }
}

/** Ids en el orden en que quedan los bloques: cada bloque (o la forma de una sección) seguido de sus elementos. */
function aplanar(bloques: BloqueMovil[]): string[] {
  return bloques.flatMap((b) =>
    b.tipo === "el" ? [b.el.id!] : [b.forma.id!, ...b.hijos.map((h) => h.id!)],
  );
}

/**
 * Orden manual de la columna del celular. Lista los bloques tal como salen (elementos sueltos y secciones con sus
 * elementos dentro); se reordenan arrastrando o con ↑ ↓, y cada elemento se puede ocultar. El orden se guarda en la
 * página (`ordenMovil`); "Restablecer" vuelve al orden por posición en la hoja.
 */
export default function OrdenColumna({
  pagina,
  onChange,
  seleccionados,
  onSeleccionar,
}: {
  pagina: Pagina;
  onChange: (p: Pagina) => void;
  seleccionados: string[];
  onSeleccionar: (ids: string[]) => void;
}) {
  const elementos = pagina.elementos ?? [];
  const bloques = bloquesMovil(elementos, pagina.ordenMovil);
  const [desde, setDesde] = useState<number | null>(null);
  const [hueco, setHueco] = useState<number | null>(null);

  const enColumna = new Set(aplanar(bloques));
  // Fuera de la columna: ocultos a mano y formas gruesas sin nada encima (omitidas automáticamente).
  const fuera = elementos.filter((e) => e.id && !enColumna.has(e.id));

  const guardarOrden = (nuevos: BloqueMovil[]) => onChange({ ...pagina, ordenMovil: aplanar(nuevos) });
  const cambiarElemento = (id: string, parche: Partial<Elemento>) =>
    onChange({ ...pagina, elementos: elementos.map((e) => (e.id === id ? ({ ...e, ...parche } as Elemento) : e)) });

  const moverBloque = (de: number, a: number) => {
    if (de === a || a < 0 || a >= bloques.length) return;
    const copia = [...bloques];
    const [m] = copia.splice(de, 1);
    copia.splice(a, 0, m);
    guardarOrden(copia);
  };
  const moverHijo = (iBloque: number, de: number, a: number) => {
    const b = bloques[iBloque];
    if (b.tipo !== "sec" || a < 0 || a >= b.hijos.length) return;
    const hijos = [...b.hijos];
    const [m] = hijos.splice(de, 1);
    hijos.splice(a, 0, m);
    guardarOrden(bloques.map((x, i) => (i === iBloque ? { ...b, hijos } : x)));
  };

  const soltar = () => {
    if (desde !== null && hueco !== null) moverBloque(desde, hueco > desde ? hueco - 1 : hueco);
    setDesde(null);
    setHueco(null);
  };

  const fila = (e: Elemento, opciones: { sangria?: boolean; subir?: () => void; bajar?: () => void; ocultar?: () => void; etiquetaExtra?: string }) => {
    const activa = !!e.id && seleccionados.includes(e.id);
    return (
      <div className={`flex items-center gap-1 ${opciones.sangria ? "pl-5" : ""}`}>
        <button
          type="button"
          onClick={() => e.id && onSeleccionar([e.id])}
          title="Seleccionar en la hoja"
          className={`font-sans flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs hover:bg-paper ${activa ? "bg-paper font-bold shadow-[inset_3px_0_0_#068562]" : ""}`}
        >
          <span aria-hidden className="w-4 shrink-0 text-center text-ink-soft">{GLIFO[e.tipo]}</span>
          <span className="min-w-0 flex-1 truncate">{etiqueta(e)}</span>
          {opciones.etiquetaExtra && <span className="shrink-0 text-[0.6rem] uppercase tracking-wide text-ink-soft">{opciones.etiquetaExtra}</span>}
        </button>
        {opciones.subir && <button type="button" className={`${btnCls} !border-0 !px-1.5`} onClick={opciones.subir} aria-label="Subir en la columna" title="Subir">↑</button>}
        {opciones.bajar && <button type="button" className={`${btnCls} !border-0 !px-1.5`} onClick={opciones.bajar} aria-label="Bajar en la columna" title="Bajar">↓</button>}
        {opciones.ocultar && <button type="button" className={`${btnCls} !border-0 !px-1.5`} onClick={opciones.ocultar} aria-label="Ocultar en el celular" title="Ocultar en el celular">🚫</button>}
      </div>
    );
  };

  const linea = <li aria-hidden className="mx-1 my-0.5 h-[3px] bg-terracota" />;

  return (
    <section className="space-y-2 border border-ink/30 bg-white/40 p-3" aria-label="Orden en la columna">
      <div className="flex items-center justify-between gap-2">
        <h3 className="font-sans text-xs font-bold uppercase tracking-wider">Orden en la columna</h3>
        <button
          type="button"
          className={btnCls}
          disabled={!pagina.ordenMovil?.length}
          onClick={() => onChange({ ...pagina, ordenMovil: undefined })}
          title="Volver al orden por posición en la hoja (de arriba abajo)"
        >
          Restablecer
        </button>
      </div>
      <p className="font-sans text-[0.7rem] leading-relaxed text-ink-soft">
        Arrastra los bloques (o usa ↑ ↓) para cambiar el orden en el celular. Una sección (fondo de color con elementos encima) se
        mueve entera; sus elementos se ordenan dentro de ella. {pagina.ordenMovil?.length ? "Lo que añadas después irá al final." : "Ahora sigue la posición en la hoja."}
      </p>

      {bloques.length === 0 ? (
        <p className="font-sans text-xs italic text-ink-soft">No hay nada que mostrar en la columna.</p>
      ) : (
        <ol
          className="max-h-72 overflow-y-auto border border-ink/15 bg-paper/60"
          onDragOver={(e) => {
            if (desde === null) return;
            e.preventDefault();
            if (e.target === e.currentTarget) setHueco(bloques.length);
          }}
          onDrop={(e) => {
            e.preventDefault();
            soltar();
          }}
        >
          {bloques.map((b, i) => {
            const cabeza = b.tipo === "el" ? b.el : b.forma;
            return (
              <Fragment key={cabeza.id ?? i}>
                {hueco === i && desde !== null && linea}
                <li
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData("application/x-bloque-movil", String(i));
                    e.dataTransfer.effectAllowed = "move";
                    setDesde(i);
                  }}
                  onDragEnd={() => {
                    setDesde(null);
                    setHueco(null);
                  }}
                  onDragOver={(e) => {
                    if (desde === null) return;
                    e.preventDefault();
                    e.stopPropagation();
                    const r = e.currentTarget.getBoundingClientRect();
                    setHueco(i + (e.clientY > r.top + r.height / 2 ? 1 : 0));
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    soltar();
                  }}
                  className={`cursor-grab border-b border-ink/10 ${desde === i ? "opacity-40" : ""}`}
                >
                  {b.tipo === "el" ? (
                    fila(b.el, {
                      subir: i > 0 ? () => moverBloque(i, i - 1) : undefined,
                      bajar: i < bloques.length - 1 ? () => moverBloque(i, i + 1) : undefined,
                      ocultar: () => cambiarElemento(b.el.id!, { movil: "ocultar" }),
                    })
                  ) : (
                    <>
                      {fila(b.forma, {
                        etiquetaExtra: "sección",
                        subir: i > 0 ? () => moverBloque(i, i - 1) : undefined,
                        bajar: i < bloques.length - 1 ? () => moverBloque(i, i + 1) : undefined,
                      })}
                      {b.hijos.map((h, k) => (
                        <Fragment key={h.id ?? k}>
                          {fila(h, {
                            sangria: true,
                            subir: k > 0 ? () => moverHijo(i, k, k - 1) : undefined,
                            bajar: k < b.hijos.length - 1 ? () => moverHijo(i, k, k + 1) : undefined,
                            ocultar: () => cambiarElemento(h.id!, { movil: "ocultar" }),
                          })}
                        </Fragment>
                      ))}
                    </>
                  )}
                </li>
              </Fragment>
            );
          })}
          {hueco === bloques.length && desde !== null && linea}
        </ol>
      )}

      {fuera.length > 0 && (
        <details className="font-sans text-xs">
          <summary className="cursor-pointer font-bold text-ink-soft">Fuera de la columna ({fuera.length})</summary>
          <ul className="mt-1 border border-ink/15 bg-paper/60">
            {fuera.map((e) => (
              <li key={e.id} className="flex items-center gap-1 border-b border-ink/10 px-2 py-1">
                <span aria-hidden className="w-4 shrink-0 text-center text-ink-soft">{GLIFO[e.tipo]}</span>
                <span className="min-w-0 flex-1 truncate">{etiqueta(e)}</span>
                <span className="shrink-0 text-[0.6rem] uppercase tracking-wide text-ink-soft">{e.movil === "ocultar" ? "oculto" : "fondo"}</span>
                <button type="button" className={btnCls} onClick={() => cambiarElemento(e.id!, { movil: "mostrar" })}>
                  Mostrar
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
