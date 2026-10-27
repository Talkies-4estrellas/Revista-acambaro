"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  COLORES,
  COLORES_SOLIDOS,
  DEGRADADOS,
  DEGRADADOS_IDS,
  ETIQUETAS_COLOR,
  NOMBRES_COLOR,
  colorCss,
  degradadoCss,
  type DegradadoId,
} from "@/lib/esquema";
import { coloresDeFoto } from "@/lib/colores-foto";
import { MAX_PALETA } from "@/lib/esquema";
import { PaletaEdicionContext } from "./ContextosEdicion";

/**
 * Selector de color (al estilo del de Canva): búsqueda por nombre o hexadecimal, cuentagotas, colores de la página,
 * colores de la revista, sólidos predeterminados y, donde el elemento lo permite, degradados.
 */

/** Colores que ya usa la página abierta (los calcula EditorLienzo): se ofrecen primero, para repetirlos. */
export const ColoresPaginaContext = createContext<string[]>([]);

/** Fotos (rutas) que hay en la página abierta (las calcula EditorLienzo): de ellas salen los «Colores de las fotos». */
/** Cuentagotas de la hoja: lo provee EditorLienzo; devuelve el color elegido dentro de la hoja o null si se cancela. */
export const CuentagotasContext = createContext<null | (() => Promise<string | null>)>(null);

export const FotosPaginaContext = createContext<string[]>([]);

/* ---- Colores tomados con el cuentagotas: los últimos 5, para volver a usarlos ---- */

const CLAVE_CUENTAGOTAS = "revista:cuentagotas";
const EVENTO_CUENTAGOTAS = "cuentagotas-colores";
const MAX_CUENTAGOTAS = 5;

function leerCuentagotas(): string[] {
  try {
    const a = JSON.parse(localStorage.getItem(CLAVE_CUENTAGOTAS) ?? "[]");
    return Array.isArray(a) ? a.filter((c): c is string => typeof c === "string" && /^#[0-9a-f]{6}$/i.test(c)).slice(0, MAX_CUENTAGOTAS) : [];
  } catch {
    return [];
  }
}

/** Guarda un color al principio de la fila (el último sale si ya son 5); si ya estaba, no cambia nada: solo se marcará donde está. */
function guardarCuentagotas(color: string) {
  const c = color.toLowerCase();
  const lista = leerCuentagotas();
  if (lista.includes(c)) return;
  try {
    localStorage.setItem(CLAVE_CUENTAGOTAS, JSON.stringify([c, ...lista].slice(0, MAX_CUENTAGOTAS)));
  } catch {}
  window.dispatchEvent(new Event(EVENTO_CUENTAGOTAS));
}

function useCuentagotas(): string[] {
  const [lista, setLista] = useState<string[]>([]);
  useEffect(() => {
    const leer = () => setLista(leerCuentagotas());
    leer();
    window.addEventListener(EVENTO_CUENTAGOTAS, leer);
    window.addEventListener("storage", leer);
    return () => {
      window.removeEventListener(EVENTO_CUENTAGOTAS, leer);
      window.removeEventListener("storage", leer);
    };
  }, []);
  return lista;
}

const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
const igual = (a: string | undefined, b: string) => !!a && a.toLowerCase() === b.toLowerCase();

type PropsPaleta = {
  valor: string | undefined;
  onChange: (v: string | undefined) => void;
  /** Si se da, se ofrece «sin color» con este texto. */
  vacio?: string;
  /** Si se da, se ofrece la sección de degradados. */
  degradado?: DegradadoId;
  onDegradado?: (id: DegradadoId | undefined) => void;
  /** Evita que el clic robe el foco o la selección (menús dentro del editor de texto). */
  sinFoco?: boolean;
};

function Muestra({ fondo, titulo, activo, onClick, sinFoco, grande }: { fondo: string; titulo: string; activo: boolean; onClick: () => void; sinFoco?: boolean; grande?: boolean }) {
  return (
    <button
      type="button"
      title={titulo}
      aria-label={titulo}
      aria-pressed={activo}
      onMouseDown={sinFoco ? (e) => e.preventDefault() : undefined}
      onClick={onClick}
      style={{ background: fondo }}
      className={`${grande ? "h-9 w-9" : "h-8 w-8"} shrink-0 rounded-full border ${activo ? "border-terracota ring-2 ring-terracota ring-offset-1" : "border-ink/25"}`}
    />
  );
}

/** Colores principales de cada foto de la página: miniatura y sus muestras. Se calculan al abrir el selector. */
function ColoresDeFotos({ valor, elegir, sinFoco, sinDegradado }: { valor: string | undefined; elegir: (c: string) => void; sinFoco?: boolean; sinDegradado: boolean }) {
  const fotos = useContext(FotosPaginaContext);
  const [todas, setTodas] = useState(false);
  const [colores, setColores] = useState<Record<string, string[] | undefined>>({});
  const visibles = todas ? fotos : fotos.slice(0, 3);
  const claveFotos = visibles.join("|");
  useEffect(() => {
    let vivo = true;
    for (const src of visibles) {
      coloresDeFoto(src).then((c) => vivo && setColores((m) => (m[src] ? m : { ...m, [src]: c })));
    }
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveFotos]);
  if (fotos.length === 0) return null;
  return (
    <section>
      <div className="mb-1.5 flex items-center">
        <h4 className="font-sans text-[0.68rem] font-bold uppercase tracking-wider text-ink-soft">Colores de las fotos</h4>
        {fotos.length > 3 && (
          <button type="button" className="font-sans ml-auto text-[0.68rem] font-bold text-ink-soft underline hover:text-ink" onClick={() => setTodas((t) => !t)}>
            {todas ? "Ver menos" : `Ver todo (${fotos.length})`}
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        {visibles.map((src) => {
          const lista = colores[src];
          return (
            <div key={src} className="flex items-center gap-1.5">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="h-8 w-8 shrink-0 rounded border border-ink/25 object-cover" />
              {lista === undefined ? (
                <span className="text-[0.7rem] italic text-ink-soft">Leyendo colores…</span>
              ) : lista.length === 0 ? (
                <span className="text-[0.7rem] italic text-ink-soft">No se pudieron leer los colores de esta foto.</span>
              ) : (
                lista.map((c) => <Muestra key={c} fondo={c} titulo={c} activo={igual(valor, c) && sinDegradado} onClick={() => elegir(c)} sinFoco={sinFoco} />)
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

const Titulo = ({ children }: { children: React.ReactNode }) => <h4 className="font-sans mb-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-ink-soft">{children}</h4>;

/** Alto máximo del selector cuando lo muestra un menú (el que lo contiene debe desplazarse con esta altura). */
export const ALTO_MENU = "max-h-[min(60vh,30rem)] overflow-y-auto overscroll-contain";

export default function PaletaColores({ valor, onChange, vacio, degradado, onDegradado, sinFoco }: PropsPaleta) {
  const delDiseno = useContext(ColoresPaginaContext);
  const [consulta, setConsulta] = useState("");
  const paletaEd = useContext(PaletaEdicionContext);
  const [quitando, setQuitando] = useState(false);
  const pedirColor = useContext(CuentagotasContext);
  const delCuentagotas = useCuentagotas();
  const elegir = (c: string) => {
    onDegradado?.(undefined);
    onChange(c);
  };

  async function cuentagotas() {
    const c = await pedirColor?.();
    if (c) {
      guardarCuentagotas(c);
      elegir(c.toLowerCase());
    }
  }

  // Búsqueda: un hexadecimal (#00c4cc o 00c4cc) o un nombre en español.
  const q = normalizar(consulta);
  const hex = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i.exec(q);
  const resultados = useMemo(() => {
    if (!q || hex) return [];
    return NOMBRES_COLOR.filter((n) => normalizar(n.nombre).includes(q));
  }, [q, hex]);
  const hexBuscado = hex ? `#${hex[1].toLowerCase()}` : null;

  const sinDegradado = !degradado;
  return (
    <div className="font-sans space-y-4 pr-1">
      <input
        type="search"
        value={consulta}
        onChange={(e) => setConsulta(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && hexBuscado) elegir(hexBuscado);
          else if (e.key === "Enter" && resultados[0]) elegir(resultados[0].hex);
        }}
        placeholder="Prueba con “azul” o “#00c4cc”"
        aria-label="Buscar un color"
        className="w-full rounded-full border border-ink/30 bg-white/80 px-3 py-1.5 text-xs outline-none focus:border-terracota dark:bg-white/5"
      />

      {(q || hexBuscado) && (
        <section>
          <Titulo>Resultados</Titulo>
          {hexBuscado ? (
            <div className="flex items-center gap-2">
              <Muestra fondo={hexBuscado} titulo={hexBuscado} activo={igual(valor, hexBuscado) && sinDegradado} onClick={() => elegir(hexBuscado)} sinFoco={sinFoco} grande />
              <span className="text-xs text-ink-soft">{hexBuscado} · Enter para usarlo</span>
            </div>
          ) : resultados.length ? (
            <div className="flex flex-wrap gap-1.5">
              {resultados.map((r) => (
                <Muestra key={r.nombre} fondo={r.hex} titulo={r.nombre} activo={igual(valor, r.hex) && sinDegradado} onClick={() => elegir(r.hex)} sinFoco={sinFoco} />
              ))}
            </div>
          ) : (
            <p className="text-xs italic text-ink-soft">Ningún color se llama así. Prueba con otro nombre o con un código como #00c4cc.</p>
          )}
        </section>
      )}

      {paletaEd && (
        <section>
          <div className="mb-1.5 flex items-center">
            <h4 className="font-sans text-[0.68rem] font-bold uppercase tracking-wider text-ink-soft">Colores de la edición</h4>
            {paletaEd.colores.length > 0 && (
              <button type="button" className="font-sans ml-auto text-[0.68rem] font-bold text-ink-soft underline hover:text-ink" onClick={() => setQuitando((q) => !q)}>
                {quitando ? "Listo" : "Quitar…"}
              </button>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {paletaEd.colores.map((c) =>
              quitando ? (
                <button key={c} type="button" title={`Quitar ${c} de la paleta`} aria-label={`Quitar ${c} de la paleta`} onClick={() => paletaEd.cambiar(paletaEd.colores.filter((x) => x !== c))} style={{ background: c }} className="relative h-8 w-8 shrink-0 rounded-full border border-ink/25">
                  <span aria-hidden className="absolute inset-0 flex items-center justify-center rounded-full bg-black/45 text-sm font-black text-white">×</span>
                </button>
              ) : (
                <Muestra key={c} fondo={c} titulo={c} activo={igual(valor, c) && sinDegradado} onClick={() => elegir(c)} sinFoco={sinFoco} />
              ),
            )}
            {valor && /^#[0-9a-fA-F]{6}$/.test(valor) && !paletaEd.colores.some((c) => igual(valor, c)) && paletaEd.colores.length < MAX_PALETA && (
              <button type="button" title="Guardar el color actual en la paleta de la edición" onMouseDown={sinFoco ? (e) => e.preventDefault() : undefined} onClick={() => paletaEd.cambiar([...paletaEd.colores, valor.toLowerCase()])} className="font-sans inline-flex h-8 shrink-0 items-center gap-1 rounded-full border border-dashed border-ink/40 px-2.5 text-[0.7rem] font-bold hover:bg-ink/10">
                <span aria-hidden className="h-4 w-4 rounded-full border border-ink/30" style={{ background: valor }} />
                ＋ Guardar
              </button>
            )}
            {paletaEd.colores.length === 0 && !(valor && /^#[0-9a-fA-F]{6}$/.test(valor)) && <span className="text-[0.7rem] italic text-ink-soft">Elige un color y pulsa «＋ Guardar» para tenerlo en todas las páginas.</span>}
          </div>
        </section>
      )}

      <section>
        <Titulo>Colores de la página</Titulo>
        <div className="flex flex-wrap items-center gap-1.5">
          <label title="Elegir cualquier color" className="relative inline-flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-full border border-ink/25" style={{ background: "conic-gradient(red, yellow, lime, aqua, blue, magenta, red)" }}>
            <span aria-hidden className="flex h-4 w-4 items-center justify-center rounded-full bg-white text-sm font-black leading-none text-ink">+</span>
            <input
              type="color"
              aria-label="Color libre"
              value={valor && /^#[0-9a-fA-F]{6}$/.test(valor) ? valor : "#068562"}
              onChange={(e) => elegir(e.target.value)}
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
            />
          </label>
          {pedirColor && (
            <button type="button" title="Cuentagotas: toma un color del lienzo" aria-label="Cuentagotas" onMouseDown={sinFoco ? (e) => e.preventDefault() : undefined} onClick={cuentagotas} className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-ink/25 text-sm">
              💧
            </button>
          )}
          {vacio !== undefined && (
            <button
              type="button"
              title={vacio}
              aria-label={vacio}
              onMouseDown={sinFoco ? (e) => e.preventDefault() : undefined}
              onClick={() => {
                onDegradado?.(undefined);
                onChange(undefined);
              }}
              className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs ${valor === undefined && sinDegradado ? "border-terracota ring-2 ring-terracota ring-offset-1" : "border-ink/25"}`}
              style={{ background: "repeating-conic-gradient(#d9d9d9 0% 25%, #fff 0% 50%) 50% / 8px 8px" }}
            >
              <span aria-hidden className="block h-px w-6 -rotate-45 bg-red-600" />
            </button>
          )}
          {delDiseno.map((c) => (
            <Muestra key={c} fondo={colorCss(c, "#000")} titulo={c.startsWith("#") ? c : ETIQUETAS_COLOR[c as keyof typeof ETIQUETAS_COLOR] ?? c} activo={igual(valor, c) && sinDegradado} onClick={() => elegir(c)} sinFoco={sinFoco} />
          ))}
        </div>
      </section>

      {pedirColor && (
        <section>
          <Titulo>Del cuentagotas</Titulo>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: MAX_CUENTAGOTAS }, (_, i) => {
              const c = delCuentagotas[i];
              return c ? (
                <Muestra key={c} fondo={c} titulo={c} activo={igual(valor, c) && sinDegradado} onClick={() => elegir(c)} sinFoco={sinFoco} />
              ) : (
                <span key={`vacio${i}`} aria-hidden title="Aquí se guardan los colores que tomes con el cuentagotas" className="h-8 w-8 shrink-0 rounded-full border border-dashed border-ink/30" />
              );
            })}
          </div>
        </section>
      )}

      <ColoresDeFotos valor={valor} elegir={elegir} sinFoco={sinFoco} sinDegradado={sinDegradado} />

      <section>
        <Titulo>Colores de la revista</Titulo>
        <div className="flex flex-wrap gap-1.5">
          {COLORES.map((c) => (
            <Muestra key={c} fondo={colorCss(c, "#000")} titulo={ETIQUETAS_COLOR[c]} activo={valor === c && sinDegradado} onClick={() => elegir(c)} sinFoco={sinFoco} />
          ))}
        </div>
      </section>

      <section>
        <Titulo>Colores sólidos</Titulo>
        <div className="grid grid-cols-7 gap-1.5">
          {COLORES_SOLIDOS.map((c) => (
            <Muestra key={c} fondo={c} titulo={c} activo={igual(valor, c) && sinDegradado} onClick={() => elegir(c)} sinFoco={sinFoco} />
          ))}
        </div>
      </section>

      {onDegradado && (
        <section>
          <Titulo>Degradados</Titulo>
          <div className="grid grid-cols-7 gap-1.5">
            {DEGRADADOS_IDS.map((id) => (
              <Muestra key={id} fondo={degradadoCss(id, 135)} titulo={DEGRADADOS[id].nombre} activo={degradado === id} onClick={() => onDegradado(id)} sinFoco={sinFoco} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

/** Botón con la muestra del color actual que abre el selector debajo (para los campos del panel de la derecha). */
export function BotonColor({ valor, onChange, vacio, etiqueta, degradado, onDegradado }: PropsPaleta & { etiqueta?: string }) {
  const [abierto, setAbierto] = useState(false);
  const [sitio, setSitio] = useState<{ left: number; top?: number; bottom?: number; alto: number } | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const boton = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // La ventana va «fija» sobre la pantalla (no dentro de la columna, que se desplaza y la recortaría): debajo del botón si
  // cabe, y si no encima, siempre con su propio desplazamiento.
  const colocar = () => {
    const r = boton.current?.getBoundingClientRect();
    if (!r) return;
    const ancho = Math.min(288, window.innerWidth - 16);
    const left = Math.max(8, Math.min(r.left, window.innerWidth - ancho - 8));
    const abajo = window.innerHeight - r.bottom - 12;
    const arriba = r.top - 12;
    if (abajo >= 300 || abajo >= arriba) setSitio({ left, top: r.bottom + 4, alto: Math.max(160, abajo) });
    else setSitio({ left, bottom: window.innerHeight - r.top + 4, alto: Math.max(160, arriba) });
  };

  useEffect(() => {
    if (!abierto) return;
    colocar();
    const fuera = (e: PointerEvent) => {
      const t = e.target as Element;
      if (t.closest?.("[data-no-cerrar]")) return;
      if (!ref.current?.contains(t) && !panel.current?.contains(t)) setAbierto(false);
    };
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    // Si la columna se desplaza o cambia el tamaño de la pantalla, se vuelve a colocar junto al botón.
    const mover = (e: Event) => {
      if (panel.current?.contains(e.target as Node)) return; // desplazar la propia ventana no la mueve
      colocar();
    };
    document.addEventListener("pointerdown", fuera);
    document.addEventListener("keydown", tecla);
    window.addEventListener("resize", mover);
    document.addEventListener("scroll", mover, true);
    return () => {
      document.removeEventListener("pointerdown", fuera);
      document.removeEventListener("keydown", tecla);
      window.removeEventListener("resize", mover);
      document.removeEventListener("scroll", mover, true);
    };
  }, [abierto]);

  const nombre = valor === undefined ? vacio ?? "Sin color" : valor.startsWith("#") ? valor : ETIQUETAS_COLOR[valor as keyof typeof ETIQUETAS_COLOR] ?? valor;
  return (
    <div ref={ref} className="relative">
      <button ref={boton} type="button" aria-expanded={abierto} onClick={() => setAbierto((a) => !a)} className="font-sans flex w-full items-center gap-2 rounded border border-ink/30 bg-white/70 px-2 py-1.5 text-left text-xs hover:border-ink dark:bg-white/5">
        <span
          aria-hidden
          className="h-6 w-6 shrink-0 rounded-full border border-ink/30"
          style={{ background: degradado ? degradadoCss(degradado, 135) : valor ? colorCss(valor, "transparent") : "repeating-conic-gradient(#d9d9d9 0% 25%, #fff 0% 50%) 50% / 8px 8px" }}
        />
        <span className="min-w-0 flex-1 truncate">{degradado ? DEGRADADOS[degradado].nombre : etiqueta ?? nombre}</span>
        <span aria-hidden className="text-[0.6rem]">{abierto ? "▴" : "▾"}</span>
      </button>
      {abierto && sitio && (
        <div
          ref={panel}
          data-paleta-flotante
          className="fixed z-[60] w-72 max-w-[calc(100vw-1rem)] overflow-y-auto overscroll-contain rounded-md border border-ink/40 bg-paper p-3 shadow-xl"
          style={{ left: sitio.left, top: sitio.top, bottom: sitio.bottom, maxHeight: sitio.alto }}
        >
          <PaletaColores valor={valor} onChange={onChange} vacio={vacio} degradado={degradado} onDegradado={onDegradado} />
        </div>
      )}
    </div>
  );
}
