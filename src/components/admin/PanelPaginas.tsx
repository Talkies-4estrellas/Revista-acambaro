"use client";

import { Fragment, memo, useEffect, useMemo, useRef, useState } from "react";
import LienzoVista from "@/components/Lienzo";
import { ETIQUETAS_PLANTILLA, type Pagina } from "@/lib/esquema";
import { mapaAnclas } from "@/lib/referencias";

export type VistaPaginas = "lista" | "miniaturas" | "grandes";

const TITULO = (p: Pagina) =>
  p.titulo || (p.plantilla === "cita" ? (p.texto ?? "").slice(0, 40) : "") || ETIQUETAS_PLANTILLA[p.plantilla];

/** Se recuerda la vista elegida mientras dura la sesión del panel (el editor se vuelve a montar al cambiar de edición). */
let vistaRecordada: VistaPaginas = "miniaturas";

/**
 * Miniatura en vivo de una página. Las de tipo lienzo se dibujan con el mismo código que el sitio (el lienzo escala solo
 * con el ancho de su caja); las demás plantillas, formadas por formularios, muestran una tarjeta con su tipo.
 * Va memorizada: al editar una página solo se vuelve a dibujar su propia miniatura.
 */
export const MiniaturaPagina = memo(
  function Miniatura({ pagina, edicionId, indice, anclas, creditos }: { pagina: Pagina; edicionId: string; indice: number; anclas: string; creditos: string }) {
    // Las referencias ({n}, {p:ancla}, {creditos}) se muestran ya resueltas, como en la hoja.
    const refs = useMemo(() => ({ n: indice + 1, mapa: mapaAnclas(anclas.split("").map((a) => a || undefined)), creditos }), [indice, anclas, creditos]);
    if (pagina.plantilla === "lienzo") {
      return (
        <div className="pointer-events-none overflow-hidden border border-ink/30 bg-white shadow-sm">
          <LienzoVista elementos={pagina.elementos ?? []} fondo={pagina.fondo} alto={pagina.alto} edicionId={edicionId} miniatura refs={refs} />
        </div>
      );
    }
    return (
      <div className="font-sans pointer-events-none flex aspect-[800/1100] flex-col items-center justify-center gap-1 border border-ink/30 bg-paper px-1 text-center shadow-sm">
        <span className="text-[0.6rem] font-bold uppercase tracking-wider text-ink-soft">{ETIQUETAS_PLANTILLA[pagina.plantilla]}</span>
        <span className="line-clamp-3 text-[0.65rem] leading-tight">{TITULO(pagina)}</span>
      </div>
    );
  },
  (a, b) => a.pagina === b.pagina && a.edicionId === b.edicionId && a.indice === b.indice && a.anclas === b.anclas && a.creditos === b.creditos,
);

/**
 * Lista de páginas de la edición con miniaturas. Se arrastran para reordenarlas (una línea marca dónde caerá) y
 * con Alt + ↑/↓ desde el teclado. Tres vistas: lista, miniaturas y miniaturas grandes.
 */
export default function PanelPaginas({
  paginas,
  seleccionada,
  edicionId,
  creditos = "",
  onSeleccionar,
  onReordenar,
}: {
  paginas: Pagina[];
  seleccionada: number;
  edicionId: string;
  /** Texto de {creditos} de la edición. */
  creditos?: string;
  onSeleccionar: (i: number) => void;
  /** Mueve la página `desde` a la posición `hasta` (índices de 0 a n-1 en la lista resultante). */
  onReordenar: (desde: number, hasta: number) => void;
}) {
  const [vista, setVistaEstado] = useState<VistaPaginas>(vistaRecordada);
  const setVista = (v: VistaPaginas) => {
    vistaRecordada = v;
    setVistaEstado(v);
  };
  const [desde, setDesde] = useState<number | null>(null);
  /** Posición de inserción: 0 = antes de la primera, n = después de la última. */
  const [hueco, setHueco] = useState<number | null>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  // Una sola cadena (no un arreglo nuevo en cada cambio) para que las miniaturas memorizadas no se redibujen al teclear.
  const anclas = paginas.map((p) => p.ancla ?? "").join("");

  // La página elegida siempre queda a la vista.
  useEffect(() => {
    items.current[seleccionada]?.scrollIntoView({ block: "nearest" });
  }, [seleccionada, vista]);

  const terminar = () => {
    setDesde(null);
    setHueco(null);
  };

  const soltar = () => {
    if (desde !== null && hueco !== null) {
      const destino = hueco > desde ? hueco - 1 : hueco;
      if (destino !== desde) onReordenar(desde, destino);
    }
    terminar();
  };

  const linea = <li aria-hidden className="mx-2 my-0.5 h-[3px] bg-terracota" />;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="font-sans flex items-center justify-between gap-1 border-b border-ink/20 px-2 py-1.5">
        <span className="text-[0.62rem] font-bold uppercase tracking-wider text-ink-soft">{paginas.length} {paginas.length === 1 ? "página" : "páginas"}</span>
        <span role="group" aria-label="Vista de las páginas" className="flex gap-0.5">
          {(
            [
              ["lista", "☰", "Lista"],
              ["miniaturas", "▤", "Miniaturas"],
              ["grandes", "▦", "Miniaturas grandes"],
            ] as const
          ).map(([v, icono, titulo]) => (
            <button
              key={v}
              type="button"
              title={titulo}
              aria-label={titulo}
              aria-pressed={vista === v}
              onClick={() => setVista(v)}
              className={`h-6 w-6 border text-xs leading-none ${vista === v ? "border-ink bg-ink text-paper" : "border-ink/30 hover:bg-paper"}`}
            >
              {icono}
            </button>
          ))}
        </span>
      </div>

      <ol
        className="min-h-0 flex-1 overflow-y-auto"
        onDragOver={(e) => {
          if (desde === null) return;
          e.preventDefault();
          // Por debajo de la última tarjeta: soltar al final.
          if (e.target === e.currentTarget) setHueco(paginas.length);
        }}
        onDrop={(e) => {
          e.preventDefault();
          soltar();
        }}
      >
        {paginas.map((p, i) => {
          const activa = i === seleccionada;
          const arrastrada = desde === i;
          return (
            <Fragment key={i}>
              {hueco === i && desde !== null && linea}
              <li
                ref={(n) => {
                  items.current[i] = n;
                }}
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData("application/x-pagina", String(i));
                  e.dataTransfer.effectAllowed = "move";
                  setDesde(i);
                }}
                onDragEnd={terminar}
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
                className={arrastrada ? "opacity-40" : ""}
              >
                <button
                  type="button"
                  onClick={() => onSeleccionar(i)}
                  onKeyDown={(e) => {
                    if (!e.altKey) return;
                    if (e.key === "ArrowUp" && i > 0) {
                      e.preventDefault();
                      onReordenar(i, i - 1);
                    } else if (e.key === "ArrowDown" && i < paginas.length - 1) {
                      e.preventDefault();
                      onReordenar(i, i + 1);
                    }
                  }}
                  aria-current={activa ? "page" : undefined}
                  title="Arrastra para reordenar (o Alt + ↑/↓)"
                  className={`font-sans w-full cursor-grab border-b border-ink/10 text-left hover:bg-paper ${
                    activa ? "bg-paper shadow-[inset_3px_0_0_#068562]" : ""
                  } ${vista === "lista" ? "flex items-baseline gap-2 px-3 py-2 text-sm" : vista === "miniaturas" ? "grid grid-cols-[4.5rem_1fr] gap-2.5 px-2.5 py-2" : "block px-3 py-2.5"}`}
                >
                  {vista === "lista" ? (
                    <>
                      <span className="w-5 shrink-0 text-xs text-ink-soft">{i + 1}</span>
                      <span className="min-w-0">
                        <span className={`block truncate ${activa ? "font-bold" : ""}`}>{TITULO(p)}</span>
                        <span className="block text-[0.65rem] font-normal uppercase tracking-wide text-ink-soft">
                          {ETIQUETAS_PLANTILLA[p.plantilla]} · {p.transicion}
                        </span>
                      </span>
                    </>
                  ) : vista === "miniaturas" ? (
                    <>
                      <MiniaturaPagina pagina={p} edicionId={edicionId} indice={i} anclas={anclas} creditos={creditos} />
                      <span className="min-w-0 pt-0.5 text-sm">
                        <span className="block text-xs text-ink-soft">{i + 1}</span>
                        <span className={`line-clamp-2 leading-tight ${activa ? "font-bold" : ""}`}>{TITULO(p)}</span>
                        <span className="mt-1 block text-[0.62rem] font-normal uppercase tracking-wide text-ink-soft">
                          {ETIQUETAS_PLANTILLA[p.plantilla]} · {p.transicion}
                        </span>
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="mb-1.5 flex items-baseline gap-2 text-sm">
                        <span className="text-xs text-ink-soft">{i + 1}</span>
                        <span className={`min-w-0 flex-1 truncate ${activa ? "font-bold" : ""}`}>{TITULO(p)}</span>
                        <span className="shrink-0 text-[0.6rem] uppercase tracking-wide text-ink-soft">{p.transicion}</span>
                      </span>
                      <MiniaturaPagina pagina={p} edicionId={edicionId} indice={i} anclas={anclas} creditos={creditos} />
                    </>
                  )}
                </button>
              </li>
            </Fragment>
          );
        })}
        {hueco === paginas.length && desde !== null && linea}
      </ol>
    </div>
  );
}
