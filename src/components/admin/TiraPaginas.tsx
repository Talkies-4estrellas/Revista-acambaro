"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { ETIQUETAS_PLANTILLA, PLANTILLAS, type Pagina, type Plantilla } from "@/lib/esquema";
import { MiniaturaPagina } from "./PanelPaginas";
import { btnCls } from "./campos";

const TITULO = (p: Pagina) => p.titulo || (p.plantilla === "cita" ? (p.texto ?? "").slice(0, 40) : "") || ETIQUETAS_PLANTILLA[p.plantilla];

/**
 * Tira de páginas bajo la hoja (como en Canva): miniaturas en una fila que se desplaza; un clic abre la página, arrastrar la cambia de lugar
 * (una línea marca dónde caerá; también Alt + ←/→) y «+» agrega una nueva después de la actual.
 */
export default function TiraPaginas({
  paginas,
  seleccionada,
  edicionId,
  creditos = "",
  editandoMaestra,
  nRepetidos,
  nuevaPlantilla,
  onSeleccionar,
  onReordenar,
  onMenu,
  onAgregar,
  onNuevaPlantilla,
  onPlantillas,
  onIndice,
  onRepetidos,
  onLateral,
}: {
  paginas: Pagina[];
  seleccionada: number;
  edicionId: string;
  creditos?: string;
  editandoMaestra: boolean;
  nRepetidos: number;
  nuevaPlantilla: Plantilla;
  onSeleccionar: (i: number) => void;
  /** Clic derecho sobre la miniatura de la página `i`. */
  onMenu?: (e: React.MouseEvent, i: number) => void;
  /** Mueve la página `desde` a la posición `hasta` (índices de la lista resultante). */
  onReordenar: (desde: number, hasta: number) => void;
  onAgregar: () => void;
  onNuevaPlantilla: (p: Plantilla) => void;
  onPlantillas: () => void;
  onIndice: () => void;
  onRepetidos: () => void;
  /** Cambiar a la lista de páginas en la columna de la izquierda. */
  onLateral: () => void;
}) {
  const [desde, setDesde] = useState<number | null>(null);
  /** Posición de inserción: 0 = antes de la primera, n = después de la última. */
  const [hueco, setHueco] = useState<number | null>(null);
  const items = useRef<(HTMLLIElement | null)[]>([]);
  const anclas = paginas.map((p) => p.ancla ?? "").join("");

  // La página elegida siempre queda a la vista.
  useEffect(() => {
    items.current[seleccionada]?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [seleccionada]);

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

  const linea = <li aria-hidden className="mx-0.5 w-[3px] shrink-0 self-stretch rounded bg-terracota" />;

  return (
    <footer aria-label="Páginas de la edición" className="flex shrink-0 items-stretch gap-3 border-t-2 border-ink bg-paper-deep/70 px-3 py-2">
      <div className="font-sans flex w-36 shrink-0 flex-col justify-between gap-1.5 text-xs max-sm:hidden">
        <p className="font-bold uppercase tracking-wider text-ink-soft">
          {paginas.length} {paginas.length === 1 ? "página" : "páginas"}
        </p>
        <button
          type="button"
          onClick={onRepetidos}
          aria-pressed={editandoMaestra}
          title="Encabezado, pie, número de página…: se editan una vez y aparecen en todas las páginas de lienzo"
          className={`${btnCls} !justify-start text-left ${editandoMaestra ? "!bg-ink !text-paper" : ""}`}
        >
          ↻ Repetidos ({nRepetidos || "ninguno"})
        </button>
        <button type="button" onClick={onLateral} className={`${btnCls} text-left`} title="Ver las páginas como una lista en la columna de la izquierda">
          ☰ Ver como lista
        </button>
      </div>

      <ol
        className="flex min-w-0 flex-1 items-start gap-2 overflow-x-auto pb-1 pt-1"
        aria-label="Miniaturas de las páginas"
        onDragOver={(e) => {
          if (desde === null) return;
          e.preventDefault();
          if (e.target === e.currentTarget) setHueco(paginas.length);
        }}
        onDrop={(e) => {
          e.preventDefault();
          soltar();
        }}
      >
        {paginas.map((p, i) => {
          const activa = i === seleccionada;
          return (
            <Fragment key={i}>
              {hueco === i && desde !== null && linea}
              <ItemTira
                refLi={(n) => {
                  items.current[i] = n;
                }}
                pagina={p}
                i={i}
                activa={activa}
                arrastrada={desde === i}
                edicionId={edicionId}
                anclas={anclas}
                creditos={creditos}
                onClick={() => onSeleccionar(i)}
                onMenu={(e) => onMenu?.(e, i)}
                onTeclado={(e) => {
                  if (!e.altKey) return;
                  if (e.key === "ArrowLeft" && i > 0) {
                    e.preventDefault();
                    onReordenar(i, i - 1);
                  } else if (e.key === "ArrowRight" && i < paginas.length - 1) {
                    e.preventDefault();
                    onReordenar(i, i + 1);
                  }
                }}
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
                  setHueco(i + (e.clientX > r.left + r.width / 2 ? 1 : 0));
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  soltar();
                }}
              />
            </Fragment>
          );
        })}
        {hueco === paginas.length && desde !== null && linea}
        <li className="shrink-0">
          <button
            type="button"
            onClick={onAgregar}
            title={`Agregar una página (${ETIQUETAS_PLANTILLA[nuevaPlantilla].toLowerCase()}) después de la ${seleccionada + 1}`}
            aria-label={`Agregar una página después de la ${seleccionada + 1}`}
            className="font-sans flex h-[5.9rem] w-[4.3rem] flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-ink/40 text-ink-soft hover:border-terracota hover:text-terracota"
          >
            <span className="text-2xl leading-none">+</span>
            <span className="text-[0.6rem] font-bold uppercase tracking-wide">Página</span>
          </button>
        </li>
      </ol>

      <div className="font-sans flex w-36 shrink-0 flex-col justify-between gap-1.5 text-xs max-sm:hidden">
        <select className="h-7 rounded-md border border-ink/30 bg-paper px-1.5 text-xs" value={nuevaPlantilla} onChange={(e) => onNuevaPlantilla(e.target.value as Plantilla)} aria-label="Tipo de la página nueva" title="Tipo de la página que agrega el «+»">
          {PLANTILLAS.map((t) => (
            <option key={t} value={t}>
              {ETIQUETAS_PLANTILLA[t]}
            </option>
          ))}
        </select>
        <button type="button" className={btnCls} onClick={onPlantillas} title="Usar una plantilla ya diseñada (o guardar esta página como plantilla)">
          ▤ Plantillas
        </button>
        <button type="button" className={btnCls} onClick={onIndice} title="Crea la página «Contenido» con todas las páginas de la edición (y la rehace si ya la generaste)">
          ☰ Índice
        </button>
      </div>
    </footer>
  );
}

function ItemTira({
  refLi,
  pagina,
  i,
  activa,
  arrastrada,
  edicionId,
  anclas,
  creditos,
  onClick,
  onMenu,
  onTeclado,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDrop,
}: {
  refLi: (n: HTMLLIElement | null) => void;
  pagina: Pagina;
  i: number;
  activa: boolean;
  arrastrada: boolean;
  edicionId: string;
  anclas: string;
  creditos: string;
  onClick: () => void;
  onMenu: (e: React.MouseEvent) => void;
  onTeclado: (e: React.KeyboardEvent) => void;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
}) {
  return (
    <li ref={refLi} draggable onContextMenu={onMenu} onDragStart={onDragStart} onDragEnd={onDragEnd} onDragOver={onDragOver} onDrop={onDrop} className={`w-[4.3rem] shrink-0 ${arrastrada ? "opacity-40" : ""}`}>
      <button
        type="button"
        onClick={onClick}
        onKeyDown={onTeclado}
        aria-current={activa ? "page" : undefined}
        title={`${i + 1}. ${TITULO(pagina)}\n(arrastra para reordenar, o Alt + ←/→)`}
        className={`relative block w-full cursor-grab rounded-md p-0.5 ${activa ? "bg-terracota shadow-md" : "hover:bg-ink/10"}`}
      >
        {/* Alto fijo: una página más alta que las demás (un cómic) se recorta por abajo en la miniatura, para que la tira no crezca. */}
        <span className="block h-[5.4rem] overflow-hidden">
          <MiniaturaPagina pagina={pagina} edicionId={edicionId} indice={i} anclas={anclas} creditos={creditos} />
        </span>
        <span className={`font-sans absolute bottom-1 left-1 rounded bg-ink/80 px-1 text-[0.58rem] font-bold leading-4 text-paper`}>{i + 1}</span>
      </button>
      <p className={`font-sans mt-0.5 truncate text-center text-[0.6rem] leading-tight ${activa ? "font-bold" : "text-ink-soft"}`}>{TITULO(pagina)}</p>
    </li>
  );
}
