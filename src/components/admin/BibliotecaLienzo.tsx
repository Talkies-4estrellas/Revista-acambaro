"use client";

import { useMemo, useState } from "react";
import { IconoSvg } from "@/components/Lienzo";
import { CATEGORIAS_ICONO, ICONOS } from "@/lib/iconos-datos";
import { LOGOS, MOLDES, MOLDES_IDS, estiloMolde, type LogoId, type MoldeId } from "@/lib/esquema";
import { btnCls, inputCls } from "./campos";

export const TIPO_BIBLIOTECA = "application/x-lienzo";

export type ModoBiblioteca = "iconos" | "moldes" | "logos";

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Cajón con los iconos vectoriales y los moldes (marcos) para fotos. Cada pieza se agrega con un clic
 * o se arrastra a la hoja; soltar un molde sobre una foto, video o forma se lo aplica.
 */
export default function BibliotecaLienzo({
  modo,
  onModo,
  reemplazando,
  hayMoldeable,
  onIcono,
  onMolde,
  onLogo,
  onCerrar,
}: {
  modo: ModoBiblioteca;
  onModo: (m: ModoBiblioteca) => void;
  /** Se está eligiendo el icono que sustituirá al seleccionado. */
  reemplazando: boolean;
  /** Hay una foto, video o forma seleccionada a la que aplicar el molde. */
  hayMoldeable: boolean;
  onIcono: (id: string) => void;
  onMolde: (id: MoldeId, comoForma: boolean) => void;
  onLogo: (id: LogoId) => void;
  onCerrar: () => void;
}) {
  const [busqueda, setBusqueda] = useState("");
  const [categoria, setCategoria] = useState<string>("Todas");
  const [comoForma, setComoForma] = useState(false);

  const iconos = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return Object.entries(ICONOS).filter(([id, d]) => {
      if (categoria !== "Todas" && d.categoria !== categoria) return false;
      if (!q) return true;
      return normalizar(`${d.nombre} ${d.etiquetas} ${id}`).includes(q);
    });
  }, [busqueda, categoria]);

  const pestana = (m: ModoBiblioteca, texto: string) => (
    <button
      type="button"
      onClick={() => onModo(m)}
      aria-pressed={modo === m}
      className={`${btnCls} ${modo === m ? "!bg-ink !text-paper" : ""}`}
    >
      {texto}
    </button>
  );

  return (
    <section aria-label="Biblioteca" className="mb-3 border border-ink/40 bg-white/50">
      <header className="flex flex-wrap items-center gap-2 border-b border-ink/20 bg-paper-deep px-3 py-2">
        <h3 className="font-sans mr-1 text-xs font-bold uppercase tracking-wider">Biblioteca</h3>
        {pestana("iconos", `Iconos (${Object.keys(ICONOS).length})`)}
        {pestana("moldes", `Moldes (${MOLDES_IDS.length})`)}
        {pestana("logos", `Logos (${LOGOS.length})`)}
        {modo === "iconos" && (
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar: café, mapa, corazón…"
            aria-label="Buscar iconos"
            className={`${inputCls} !w-56`}
          />
        )}
        <button type="button" className={`${btnCls} ml-auto`} onClick={onCerrar} aria-label="Cerrar la biblioteca">
          ✕ Cerrar
        </button>
      </header>

      {modo === "iconos" ? (
        <div className="p-3">
          <div className="mb-2 flex flex-wrap gap-1">
            {["Todas", ...CATEGORIAS_ICONO].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategoria(c)}
                aria-pressed={categoria === c}
                className={`font-sans border px-2 py-0.5 text-[0.68rem] font-semibold ${categoria === c ? "border-terracota bg-ink text-paper" : "border-ink/30 bg-paper hover:bg-paper-deep"}`}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="font-sans mb-2 text-[0.7rem] text-ink-soft">
            {reemplazando
              ? "Elige el icono que sustituirá al seleccionado."
              : "Haz clic para agregarlo o arrástralo a la hoja. Después puedes cambiarle el color, el tamaño y el grosor del trazo."}
          </p>
          <div className="grid max-h-60 grid-cols-[repeat(auto-fill,minmax(3.4rem,1fr))] gap-1.5 overflow-y-auto">
            {iconos.map(([id, d]) => (
              <button
                key={id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(TIPO_BIBLIOTECA, `icono:${id}`);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onIcono(id)}
                title={d.nombre}
                aria-label={d.nombre}
                className="flex aspect-square cursor-grab items-center justify-center border border-ink/20 bg-paper p-2.5 text-ink hover:border-terracota hover:text-terracota"
              >
                <span className="block h-full w-full pointer-events-none">
                  <IconoSvg icono={id} color="currentColor" />
                </span>
              </button>
            ))}
            {iconos.length === 0 && <p className="font-sans col-span-full text-xs italic text-ink-soft">No hay iconos con esa búsqueda.</p>}
          </div>
          <p className="font-sans mt-2 text-[0.65rem] text-ink-soft">
            Iconos de línea: Lucide (licencia ISC). Marcas: Simple Icons (CC0); pertenecen a sus titulares, úsalas solo para enlazar a sus perfiles.
          </p>
        </div>
      ) : modo === "logos" ? (
        <div className="p-3">
          <p className="font-sans mb-2 text-[0.7rem] text-ink-soft">
            Haz clic para agregar el logotipo a la hoja, o arrástralo hasta donde lo quieras. Usa la versión clara sobre fondos oscuros.
          </p>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-2">
            {LOGOS.map((l) => (
              <button
                key={l.id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(TIPO_BIBLIOTECA, `logo:${l.id}`);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onLogo(l.id)}
                title={`Agregar: ${l.nombre}`}
                className="flex cursor-grab flex-col items-center gap-1.5 border border-ink/20 bg-paper p-2 hover:border-terracota"
              >
                <span className={`flex h-20 w-full items-center justify-center p-2 ${l.claro ? "bg-[#013f4a]" : "bg-white"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={l.src} alt="" draggable={false} className="pointer-events-none max-h-full max-w-full object-contain" />
                </span>
                <span className="font-sans w-full truncate text-center text-[0.65rem] font-semibold text-ink-soft">{l.nombre}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-3">
          <p className="font-sans mb-2 text-[0.7rem] text-ink-soft">
            {hayMoldeable
              ? "Clic en un molde para aplicarlo al elemento seleccionado."
              : "Clic o arrastre a la hoja para crear un marco; luego suelta una foto de tu equipo encima para rellenarlo."}{" "}
            También puedes arrastrar un molde sobre una foto, video o forma ya colocados.
          </p>
          <div className="mb-2 flex flex-wrap items-center gap-3 font-sans text-[0.72rem]">
            <span className="font-bold uppercase tracking-wide text-ink-soft">Si no hay nada seleccionado, crear:</span>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input type="radio" name="crear-molde" checked={!comoForma} onChange={() => setComoForma(false)} className="accent-[#068562]" />
              Marco para foto
            </label>
            <label className="flex cursor-pointer items-center gap-1.5">
              <input type="radio" name="crear-molde" checked={comoForma} onChange={() => setComoForma(true)} className="accent-[#068562]" />
              Forma de color
            </label>
          </div>
          <div className="grid max-h-60 grid-cols-[repeat(auto-fill,minmax(4.6rem,1fr))] gap-2 overflow-y-auto">
            {MOLDES_IDS.map((id) => (
              <button
                key={id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(TIPO_BIBLIOTECA, `molde:${id}${comoForma ? ":forma" : ""}`);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onMolde(id, comoForma)}
                title={MOLDES[id].nombre}
                className="flex cursor-grab flex-col items-center gap-1 border border-ink/20 bg-paper p-2 hover:border-terracota"
              >
                <span className="block aspect-square w-full bg-ink" style={estiloMolde(id)} />
                <span className="font-sans w-full truncate text-center text-[0.6rem] text-ink-soft">{MOLDES[id].nombre}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
