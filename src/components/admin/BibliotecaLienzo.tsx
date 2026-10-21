"use client";

import { useMemo, useState } from "react";
import { ElementoVista, IconoSvg } from "@/components/Lienzo";
import { CATEGORIAS_ICONO, ICONOS } from "@/lib/iconos-datos";
import { ANCHO_LIENZO, BOTONES, type ElementoGuardado, LOGOS, MOLDES, MOLDES_IDS, elementoBoton, estiloMolde, type GrupoBoton, type LogoId, type MoldeId, type PresetElemento } from "@/lib/esquema";
import { BLOQUES, CATEGORIAS_BLOQUE } from "@/lib/bloques";
import { btnCls, inputCls } from "./campos";

export const TIPO_BIBLIOTECA = "application/x-lienzo";

export type ModoBiblioteca = "texto" | "formas" | "iconos" | "moldes" | "logos" | "botones" | "bloques" | "mios";

const TITULOS: Record<ModoBiblioteca, string> = {
  texto: "Texto",
  formas: "Formas",
  bloques: "Bloques listos",
  botones: "Botones",
  iconos: "Iconos",
  moldes: "Moldes",
  logos: "Logos",
  mios: "Mis elementos",
};

const ANCHO_PREVIA_BLOQUE = 262;

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

/** Vista previa de un grupo guardado: se reduce para que quepa en la ficha. */
function PreviaMio({ item }: { item: ElementoGuardado }) {
  const k = Math.min(1, ANCHO_PREVIA_BLOQUE / (item.w + 24), 190 / (item.h + 24));
  return (
    <span className="pointer-events-none block overflow-hidden" style={{ width: (item.w + 24) * k, height: (item.h + 24) * k }}>
      <span className="block origin-top-left" style={{ width: ANCHO_LIENZO, height: ANCHO_LIENZO, position: "relative", containerType: "inline-size", transform: `scale(${k})` }}>
        {item.elementos.map((e, i) => (
          <ElementoVista key={i} el={{ ...e, x: e.x + 12, y: e.y + 12, id: `m${i}` }} miniatura />
        ))}
      </span>
    </span>
  );
}

const GRUPOS_BOTON: GrupoBoton[] = ["Básicos", "Redes y contacto", "Llamativos"];
const ANCHO_PREVIA = 240; // px de cada vista previa de botón

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
  reemplazando,
  hayMoldeable,
  onIcono,
  onMolde,
  onLogo,
  onBoton,
  onBloque,
  onPreset,
  mios,
  seleccionados,
  onGuardarSeleccion,
  onMio,
  onRenombrarMio,
  onBorrarMio,
  onCerrar,
}: {
  modo: ModoBiblioteca;
  /** Se está eligiendo el icono que sustituirá al seleccionado. */
  reemplazando: boolean;
  /** Hay una foto, video o forma seleccionada a la que aplicar el molde. */
  hayMoldeable: boolean;
  onIcono: (id: string) => void;
  onMolde: (id: MoldeId, comoForma: boolean) => void;
  onLogo: (id: LogoId) => void;
  onBoton: (id: string) => void;
  onBloque: (id: string) => void;
  /** Elementos básicos (titular, párrafo, formas…). */
  onPreset: (id: PresetElemento) => void;
  /** «Mis elementos» guardados (null mientras se cargan). */
  mios: ElementoGuardado[] | null;
  /** Cuántos elementos hay seleccionados en la hoja. */
  seleccionados: number;
  onGuardarSeleccion: () => void;
  onMio: (id: string) => void;
  onRenombrarMio: (id: string) => void;
  onBorrarMio: (id: string) => void;
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

  return (
    <section aria-label={TITULOS[modo]} className="flex h-full min-h-0 flex-col border border-ink/40 bg-white/50 dark:bg-white/5">
      <header className="flex shrink-0 flex-wrap items-center gap-2 border-b border-ink/20 bg-paper-deep px-3 py-2">
        <h3 className="font-sans mr-auto text-xs font-bold uppercase tracking-wider">{TITULOS[modo]}</h3>
        {modo === "iconos" && (
          <input
            type="search"
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            placeholder="Buscar: café, mapa…"
            aria-label="Buscar iconos"
            className={`${inputCls} !w-40`}
          />
        )}
        <button type="button" className={btnCls} onClick={onCerrar} aria-label="Cerrar el panel">
          ✕
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto">

      {modo === "mios" ? (
        <div className="p-3">
          <p className="font-sans mb-2 text-[0.7rem] text-ink-soft">
            Guarda aquí lo que armes (el anuncio de un cliente, una firma, un sello…) para usarlo en cualquier edición. Selecciona uno o varios elementos en la hoja y pulsa el botón.
          </p>
          <button type="button" className={`${btnCls} mb-3 w-full !bg-ink !text-paper`} disabled={seleccionados === 0} onClick={onGuardarSeleccion}>
            ☆ Guardar la selección{seleccionados > 0 ? ` (${seleccionados})` : ""}
          </button>
          {mios === null && <p className="font-sans text-xs italic text-ink-soft">Cargando…</p>}
          {mios && mios.length === 0 && <p className="font-sans text-xs italic text-ink-soft">Todavía no has guardado nada.</p>}
          <div className="flex flex-col gap-2">
            {(mios ?? []).map((m) => (
              <div key={m.id} className="border border-ink/20 bg-white p-2">
                <button
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(TIPO_BIBLIOTECA, `mio:${m.id}`);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => onMio(m.id)}
                  title={`Agregar: ${m.nombre}`}
                  className="flex w-full cursor-grab flex-col items-center gap-1 hover:opacity-80"
                >
                  <PreviaMio item={m} />
                </button>
                <div className="mt-1 flex items-center gap-1">
                  <span className="font-sans min-w-0 flex-1 truncate text-[0.7rem] font-semibold">{m.nombre}</span>
                  <button type="button" className={btnCls} onClick={() => onRenombrarMio(m.id)} title="Cambiar el nombre" aria-label={`Renombrar ${m.nombre}`}>✎</button>
                  <button type="button" className={btnCls} onClick={() => onBorrarMio(m.id)} title="Borrar" aria-label={`Borrar ${m.nombre}`}>✕</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : modo === "texto" || modo === "formas" ? (
        <div className="p-3">
          <p className="font-sans mb-2 text-[0.7rem] text-ink-soft">Haz clic para agregarlo o arrástralo a la hoja. Después puedes cambiarle el tamaño, el color y todo lo demás.</p>
          <div className="flex flex-col gap-2">
            {(modo === "texto"
              ? ([
                  ["titular", "Titular", "Un título grande", "font-display text-2xl font-black leading-tight"],
                  ["parrafo", "Párrafo", "Texto de lectura, en varias líneas, para el cuerpo de una nota.", "font-serif text-[0.8rem] leading-snug"],
                  ["etiqueta", "Etiqueta", "SECCIÓN", "font-sans text-[0.7rem] font-extrabold uppercase tracking-[0.2em] text-terracota"],
                ] as const)
              : ([
                  ["rectangulo", "Rectángulo", "", "h-10 w-full bg-ink"],
                  ["circulo", "Círculo", "", "h-10 w-10 rounded-full bg-ink"],
                  ["linea", "Línea", "", "h-[3px] w-full bg-ink"],
                ] as const)
            ).map(([id, nombre, muestra, clase]) => (
              <button
                key={id}
                type="button"
                draggable
                onDragStart={(e) => {
                  e.dataTransfer.setData(TIPO_BIBLIOTECA, `preset:${id}`);
                  e.dataTransfer.effectAllowed = "copy";
                }}
                onClick={() => onPreset(id)}
                title={`Agregar: ${nombre}`}
                className="flex w-full cursor-grab flex-col gap-2 border border-ink/20 bg-white p-3 text-left hover:border-terracota"
              >
                <span className="pointer-events-none flex min-h-10 items-center text-ink">
                  {modo === "texto" ? <span className={clase}>{muestra}</span> : <span className={`block ${clase}`} />}
                </span>
                <span className="font-sans text-[0.62rem] font-semibold text-ink-soft">{nombre}</span>
              </button>
            ))}
          </div>
        </div>
      ) : modo === "bloques" ? (
        <div className="p-3">
          <p className="font-sans mb-2 text-[0.7rem] text-ink-soft">
            Grupos de elementos ya compuestos. Clic para agregarlo al centro de la hoja o arrástralo a donde lo quieras; se mueve junto (doble clic para editar una pieza). Reemplaza
            los textos de guía, y suelta tus fotos sobre los marcadores de color.
          </p>
          <div className="space-y-3">
            {CATEGORIAS_BLOQUE.map((c) => (
              <div key={c}>
                <p className="font-sans mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">{c}</p>
                <div className="flex flex-col gap-2">
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
                      className="flex w-full cursor-grab flex-col items-center gap-1 border border-ink/20 bg-white p-2 hover:border-terracota"
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
          <div className="space-y-3">
            {GRUPOS_BOTON.map((g) => (
              <div key={g}>
                <p className="font-sans mb-1.5 text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">{g}</p>
                <div className="flex flex-col gap-2">
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
                      className="flex w-full cursor-grab flex-col items-center gap-1 border border-ink/20 bg-white p-2 hover:border-terracota"
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(3.4rem,1fr))] gap-1.5">
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
          <div className="grid grid-cols-2 gap-2">
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(4.6rem,1fr))] gap-2">
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
      </div>
    </section>
  );
}
