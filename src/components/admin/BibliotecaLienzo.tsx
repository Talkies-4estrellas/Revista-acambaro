"use client";

import { useMemo, useState } from "react";
import { ElementoVista, IconoSvg } from "@/components/Lienzo";
import { CATEGORIAS_ICONO, ICONOS } from "@/lib/iconos-datos";
import { ANCHO_LIENZO, BOTONES, LOGOS, MOLDES, MOLDES_IDS, elementoBoton, estiloMolde, type GrupoBoton, type LogoId, type MoldeId } from "@/lib/esquema";
import { BLOQUES, CATEGORIAS_BLOQUE } from "@/lib/bloques";
import { btnCls, inputCls } from "./campos";

export const TIPO_BIBLIOTECA = "application/x-lienzo";

export type ModoBiblioteca = "iconos" | "moldes" | "logos" | "botones" | "bloques";

const ANCHO_PREVIA_BLOQUE = 250;

/** Vista previa de un bloque listo (la hoja de 800 se reduce con transform). */
function PreviaBloque({ id }: { id: string }) {
  const b = BLOQUES.find((x) => x.id === id)!;
  const k = Math.min(1, ANCHO_PREVIA_BLOQUE / (b.w + 24));
  return (
    <span className="pointer-events-none block overflow-hidden" style={{ width: (b.w + 24) * k, height: (b.h + 24) * k }}>
      <span className="block origin-top-left" style={{ width: ANCHO_LIENZO, height: ANCHO_LIENZO, position: "relative", containerType: "inline-size", transform: `scale(${k})` }}>
        {b.elementos().map((e, i) => (
          <ElementoVista key={i} el={{ ...e, x: e.x + 12, y: e.y + 12, id: `p${i}` }} />
        ))}
      </span>
    </span>
  );
}

const GRUPOS_BOTON: GrupoBoton[] = ["Básicos", "Redes y contacto", "Llamativos"];
const ANCHO_PREVIA = 176; // px de cada vista previa de botón

/** Vista previa viva de un botón (con su efecto al pasar el cursor y su movimiento): la hoja de 800 se reduce con transform. */
function PreviaBoton({ id }: { id: string }) {
  const b = BOTONES.find((x) => x.id === id)!;
  const k = Math.min(1, ANCHO_PREVIA / (b.w + 24));
  const el = { ...elementoBoton(id), x: 12, y: 12 };
  return (
    <span className="pointer-events-none block overflow-hidden" style={{ width: (b.w + 24) * k, height: (b.h + 24) * k }}>
      <span className="block origin-top-left" style={{ width: ANCHO_LIENZO, height: ANCHO_LIENZO, position: "relative", containerType: "inline-size", transform: `scale(${k})` }}>
        <ElementoVista el={el} />
      </span>
    </span>
  );
}

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
  onBoton,
  onBloque,
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
  onBoton: (id: string) => void;
  onBloque: (id: string) => void;
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
    <section aria-label="Biblioteca" className="mb-3 border border-ink/40 bg-white/50 dark:bg-white/5">
      <header className="flex flex-wrap items-center gap-2 border-b border-ink/20 bg-paper-deep px-3 py-2">
        <h3 className="font-sans mr-1 text-xs font-bold uppercase tracking-wider">Biblioteca</h3>
        {pestana("bloques", `Bloques (${BLOQUES.length})`)}
        {pestana("botones", `Botones (${BOTONES.length})`)}
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

      {modo === "bloques" ? (
        <div className="p-3">
          <p className="font-sans mb-2 text-[0.7rem] text-ink-soft">
            Grupos de elementos ya compuestos. Clic para agregarlo al centro de la hoja o arrástralo a donde lo quieras; se mueve junto (doble clic para editar una pieza). Reemplaza
            los textos de guía, y suelta tus fotos sobre los marcadores de color.
          </p>
          <div className="max-h-80 space-y-3 overflow-y-auto">
            {CATEGORIAS_BLOQUE.map((c) => (
              <div key={c}>
                <p className="font-sans mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">{c}</p>
                <div className="flex flex-wrap gap-2">
                  {BLOQUES.filter((b) => b.categoria === c).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(TIPO_BIBLIOTECA, `bloque:${b.id}`);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => onBloque(b.id)}
                      title={b.descripcion}
                      className="flex cursor-grab flex-col items-center gap-1 border border-ink/20 bg-white p-2 hover:border-terracota"
                      style={{ width: ANCHO_PREVIA_BLOQUE + 20 }}
                    >
                      <PreviaBloque id={b.id} />
                      <span className="font-sans w-full truncate text-center text-[0.62rem] font-semibold text-ink-soft">{b.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : modo === "botones" ? (
        <div className="p-3">
          <p className="font-sans mb-2 text-[0.7rem] text-ink-soft">
            Haz clic para agregar el botón o arrástralo a la hoja. Pasa el cursor por encima para ver su efecto. Después escribe su texto (doble clic), pon a dónde lleva en
            «Lleva a» y cambia colores y efectos en el panel de la derecha.
          </p>
          <div className="max-h-72 space-y-3 overflow-y-auto">
            {GRUPOS_BOTON.map((g) => (
              <div key={g}>
                <p className="font-sans mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">{g}</p>
                <div className="flex flex-wrap gap-2">
                  {BOTONES.filter((b) => b.grupo === g).map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData(TIPO_BIBLIOTECA, `boton:${b.id}`);
                        e.dataTransfer.effectAllowed = "copy";
                      }}
                      onClick={() => onBoton(b.id)}
                      title={`Agregar: ${b.nombre}`}
                      className="flex cursor-grab flex-col items-center gap-1 border border-ink/20 bg-white p-2 hover:border-terracota"
                      style={{ width: ANCHO_PREVIA + 20 }}
                    >
                      <PreviaBoton id={b.id} />
                      <span className="font-sans w-full truncate text-center text-[0.62rem] font-semibold text-ink-soft">{b.nombre}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : modo === "iconos" ? (
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
