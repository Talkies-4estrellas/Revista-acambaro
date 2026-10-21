"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  ANCHOS,
  PROPORCIONES,
  TONOS,
  type Medio,
  type VideoData,
} from "@/lib/esquema";

/* ---------------------------- Estilos base --------------------------- */

export const inputCls =
  "w-full border border-ink/30 bg-white/70 dark:bg-white/5 px-3 py-2 font-sans text-sm text-ink outline-none focus:border-terracota focus:ring-1 focus:ring-terracota";
export const btnCls =
  "font-sans border border-ink/40 bg-paper px-2.5 py-1 text-xs font-semibold text-ink hover:bg-ink hover:text-paper disabled:opacity-30 disabled:hover:bg-paper disabled:hover:text-ink";

/* ------------------------------ Medios ------------------------------- */

type MediosCtx = {
  medios: string[];
  subir: (file: File) => Promise<string>;
};
export const MediosContext = createContext<MediosCtx>({
  medios: [],
  subir: async () => {
    throw new Error("Sin contexto de medios");
  },
});

const esVideo = (src: string) => /\.(mp4|webm)$/i.test(src);

/* ------------------------------ Campos ------------------------------- */

export function Campo({
  label,
  hint,
  children,
  className = "",
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block ${className}`}>
      <span className="font-sans mb-1 block text-[0.72rem] font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      {children}
      {hint && <span className="font-sans mt-1 block text-[0.7rem] text-ink-soft">{hint}</span>}
    </label>
  );
}

export function Texto({
  label,
  value,
  onChange,
  hint,
  placeholder,
  className,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  hint?: string;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Campo label={label} hint={hint} className={className}>
      <input
        className={inputCls}
        value={value ?? ""}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </Campo>
  );
}

export function Area({
  label,
  value,
  onChange,
  rows = 3,
  hint,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string) => void;
  rows?: number;
  hint?: string;
}) {
  return (
    <Campo label={label} hint={hint}>
      <textarea
        className={`${inputCls} resize-y leading-relaxed`}
        rows={rows}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      />
    </Campo>
  );
}

export function Numero({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: number | undefined;
  onChange: (v: number | undefined) => void;
  min?: number;
  max?: number;
}) {
  return (
    <Campo label={label}>
      <input
        type="number"
        className={inputCls}
        min={min}
        max={max}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
      />
    </Campo>
  );
}

export function Selector<T extends string>({
  label,
  value,
  onChange,
  opciones,
  vacio,
  hint,
}: {
  label: string;
  value: T | undefined;
  onChange: (v: T | undefined) => void;
  opciones: readonly (T | { valor: T; etiqueta: string })[];
  /** Texto de la opción "sin valor". Si no se da, no se ofrece. */
  vacio?: string;
  hint?: string;
}) {
  return (
    <Campo label={label} hint={hint}>
      <select
        className={inputCls}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value === "" ? undefined : (e.target.value as T))}
      >
        {vacio !== undefined && <option value="">{vacio}</option>}
        {opciones.map((o) => {
          const valor = typeof o === "string" ? o : o.valor;
          const etiqueta = typeof o === "string" ? o : o.etiqueta;
          return (
            <option key={valor} value={valor}>
              {etiqueta}
            </option>
          );
        })}
      </select>
    </Campo>
  );
}

export function Interruptor({
  label,
  value,
  onChange,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="font-sans flex cursor-pointer items-center gap-2 text-sm">
      <input type="checkbox" className="h-4 w-4 accent-[#068562]" checked={value} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

/* --------------------------- Archivos / medios ----------------------- */

export function CampoArchivo({
  label,
  value,
  onChange,
  tipo = "imagen",
  hint,
}: {
  label: string;
  value: string | undefined;
  onChange: (v: string | undefined) => void;
  tipo?: "imagen" | "video";
  hint?: string;
}) {
  const { medios, subir } = useContext(MediosContext);
  const input = useRef<HTMLInputElement>(null);
  const [estado, setEstado] = useState<{ cargando: boolean; error?: string }>({ cargando: false });
  const lista = medios.filter((m) => (tipo === "video" ? esVideo(m) : !esVideo(m)));
  const id = `medios-${tipo}`;

  async function alElegir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setEstado({ cargando: true });
    try {
      onChange(await subir(file));
      setEstado({ cargando: false });
    } catch (err) {
      setEstado({ cargando: false, error: err instanceof Error ? err.message : "No se pudo subir" });
    }
  }

  return (
    <div>
      <span className="font-sans mb-1 block text-[0.72rem] font-bold uppercase tracking-wide text-ink-soft">
        {label}
      </span>
      <div className="flex gap-2">
        <input
          className={inputCls}
          list={id}
          value={value ?? ""}
          placeholder="/media/… o https://…  (vacío = ilustración provisional)"
          onChange={(e) => onChange(e.target.value === "" ? undefined : e.target.value)}
        />
        <datalist id={id}>
          {lista.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
        <button type="button" className={`${btnCls} shrink-0`} disabled={estado.cargando} onClick={() => input.current?.click()}>
          {estado.cargando ? "Subiendo…" : "Subir"}
        </button>
        <input
          ref={input}
          type="file"
          hidden
          accept={tipo === "video" ? "video/mp4,video/webm" : "image/jpeg,image/png,image/webp,image/gif,image/avif"}
          onChange={alElegir}
        />
      </div>
      {estado.error && <p className="font-sans mt-1 text-xs text-terracota">{estado.error}</p>}
      {hint && <p className="font-sans mt-1 text-[0.7rem] text-ink-soft">{hint}</p>}
      {value && tipo === "imagen" && !esVideo(value) && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={value} alt="" className="mt-2 h-20 w-auto border border-ink/20 object-cover" />
      )}
    </div>
  );
}

/* ------------------------- Medio / Video / listas -------------------- */

export function MedioEditor({
  value,
  onChange,
  conAncho = false,
  etiquetaArchivo = "Archivo de imagen",
}: {
  value: Medio;
  onChange: (m: Medio) => void;
  conAncho?: boolean;
  etiquetaArchivo?: string;
}) {
  const set = <K extends keyof Medio>(k: K, v: Medio[K] | undefined) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      <CampoArchivo label={etiquetaArchivo} value={value.src} onChange={(v) => set("src", v)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Texto label="Texto alternativo" value={value.alt} onChange={(v) => set("alt", v)} hint="Describe la imagen (accesibilidad)" />
        <Texto label="Pie de foto" value={value.pie} onChange={(v) => set("pie", v)} />
        <Selector label="Proporción" value={value.proporcion} onChange={(v) => set("proporcion", v)} opciones={PROPORCIONES} vacio="Natural" />
        <Selector label="Color provisional" value={value.tono} onChange={(v) => set("tono", v)} opciones={TONOS} vacio="—" hint="Se usa mientras no haya archivo" />
        {conAncho && (
          <Selector label="Ancho" value={value.ancho} onChange={(v) => set("ancho", v)} opciones={ANCHOS} vacio="Columna (por defecto)" />
        )}
      </div>
    </div>
  );
}

export function VideoEditor({
  value,
  onChange,
  conAncho = false,
}: {
  value: VideoData;
  onChange: (v: VideoData) => void;
  conAncho?: boolean;
}) {
  const set = <K extends keyof VideoData>(k: K, v: VideoData[K] | undefined) => onChange({ ...value, [k]: v });
  return (
    <div className="space-y-3">
      <CampoArchivo label="Archivo de video (mp4 / webm)" tipo="video" value={value.src} onChange={(v) => set("src", v)} />
      <div className="grid gap-3 sm:grid-cols-2">
        <Texto label="ID de YouTube" value={value.youtube} onChange={(v) => set("youtube", v)} hint="Solo el ID, ej. dQw4w9WgXcQ" />
        <Texto label="ID de Vimeo" value={value.vimeo} onChange={(v) => set("vimeo", v)} />
        <Texto label="Pie del video" value={value.pie} onChange={(v) => set("pie", v)} />
        {conAncho && (
          <Selector label="Ancho" value={value.ancho} onChange={(v) => set("ancho", v)} opciones={ANCHOS} vacio="Columna (por defecto)" />
        )}
      </div>
      <CampoArchivo label="Imagen de portada del video (poster)" value={value.poster} onChange={(v) => set("poster", v)} />
      <Interruptor
        label="Animado: se reproduce solo, mudo y en bucle (tipo gif)"
        value={value.animado ?? false}
        onChange={(v) => set("animado", v || undefined)}
      />
      <p className="font-sans text-[0.7rem] text-ink-soft">
        Prioridad: YouTube → Vimeo → archivo. Sin ninguno se muestra un marcador “Video pendiente”.
      </p>
    </div>
  );
}

/** Lista editable con mover, duplicar y quitar. */
export function Lista<T>({
  items,
  onChange,
  render,
  nuevo,
  agregar,
  titulo,
  vacio = "Sin elementos.",
  pie,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  render: (item: T, set: (v: T) => void, i: number) => React.ReactNode;
  nuevo: () => T;
  agregar: string;
  titulo: (item: T, i: number) => string;
  vacio?: string;
  /** Reemplaza el botón "+ agregar" por defecto (p. ej. un selector de tipo). */
  pie?: React.ReactNode;
}) {
  const mover = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const copia = [...items];
    [copia[i], copia[j]] = [copia[j], copia[i]];
    onChange(copia);
  };
  return (
    <div className="space-y-3">
      {items.length === 0 && <p className="font-sans text-xs italic text-ink-soft">{vacio}</p>}
      {items.map((item, i) => (
        <div key={i} className="border border-ink/25 bg-paper-deep/60">
          <div className="flex items-center justify-between gap-2 border-b border-ink/15 px-3 py-1.5">
            <span className="font-sans truncate text-xs font-bold text-ink-soft">{titulo(item, i)}</span>
            <span className="flex shrink-0 gap-1">
              <button type="button" className={btnCls} disabled={i === 0} onClick={() => mover(i, -1)} aria-label="Subir">↑</button>
              <button type="button" className={btnCls} disabled={i === items.length - 1} onClick={() => mover(i, 1)} aria-label="Bajar">↓</button>
              <button
                type="button"
                className={btnCls}
                onClick={() => onChange([...items.slice(0, i + 1), structuredClone(item), ...items.slice(i + 1)])}
                aria-label="Duplicar"
              >
                ⧉
              </button>
              <button type="button" className={btnCls} onClick={() => onChange(items.filter((_, k) => k !== i))} aria-label="Quitar">✕</button>
            </span>
          </div>
          <div className="p-3">{render(item, (v) => onChange(items.map((x, k) => (k === i ? v : x))), i)}</div>
        </div>
      ))}
      {pie ?? (
        <button type="button" className={btnCls} onClick={() => onChange([...items, nuevo()])}>
          + {agregar}
        </button>
      )}
    </div>
  );
}

/** Lista de textos (párrafos, elementos de lista…). */
export function ListaTextos({
  items,
  onChange,
  agregar,
  etiqueta,
  filas = 3,
}: {
  items: string[];
  onChange: (items: string[]) => void;
  agregar: string;
  etiqueta: string;
  filas?: number;
}) {
  return (
    <Lista<string>
      items={items}
      onChange={onChange}
      nuevo={() => ""}
      agregar={agregar}
      titulo={(t, i) => `${etiqueta} ${i + 1}${t ? ` — ${t.slice(0, 40)}` : ""}`}
      render={(t, set) => (
        <textarea className={`${inputCls} resize-y leading-relaxed`} rows={filas} value={t} onChange={(e) => set(e.target.value)} />
      )}
    />
  );
}

const EVENTO_PANELES = "revista:paneles";

/**
 * Cuadro con título. Con `plegable`, el título es un botón que lo abre y lo cierra; se recuerda qué paneles dejó abiertos el usuario (por título, en este
 * navegador) y `abierto` solo es el estado inicial. `resumen` se muestra junto al título cuando está cerrado (por ejemplo, el efecto elegido).
 */
export function Panel({
  titulo,
  children,
  ayuda,
  plegable = false,
  abierto = true,
  resumen,
}: {
  titulo: string;
  children: React.ReactNode;
  ayuda?: string;
  plegable?: boolean;
  abierto?: boolean;
  resumen?: string;
}) {
  const clave = `revista:panel:${titulo}`;
  const [visible, setVisible] = useState(abierto);

  const fijar = (v: boolean) => {
    setVisible(v);
    try {
      localStorage.setItem(clave, v ? "1" : "0");
    } catch {}
  };

  useEffect(() => {
    if (!plegable) return;
    try {
      const v = localStorage.getItem(clave);
      if (v === "1" || v === "0") setVisible(v === "1");
    } catch {}
  }, [plegable, clave]);

  // «Plegar todo» / «Abrir todo» (ver ControlPaneles).
  useEffect(() => {
    if (!plegable) return;
    const alt = (e: Event) => fijar((e as CustomEvent<boolean>).detail);
    window.addEventListener(EVENTO_PANELES, alt);
    return () => window.removeEventListener(EVENTO_PANELES, alt);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plegable, clave]);

  if (!plegable) {
    return (
      <section className="border border-ink/30 bg-white/40 dark:bg-white/5">
        <header className="border-b border-ink/20 bg-paper-deep px-4 py-2">
          <h3 className="font-sans text-xs font-bold uppercase tracking-wider">{titulo}</h3>
          {ayuda && <p className="font-sans mt-0.5 text-[0.7rem] text-ink-soft">{ayuda}</p>}
        </header>
        <div className="space-y-4 p-4">{children}</div>
      </section>
    );
  }

  return (
    <section className="border border-ink/30 bg-white/40 dark:bg-white/5">
      <h3 className={visible ? "border-b border-ink/20 bg-paper-deep" : "bg-paper-deep"}>
        <button
          type="button"
          onClick={() => fijar(!visible)}
          aria-expanded={visible}
          className="font-sans flex w-full items-center gap-2 px-4 py-2 text-left text-xs font-bold uppercase tracking-wider hover:text-terracota"
        >
          <span aria-hidden className="inline-block w-3 text-[0.65rem]">{visible ? "▾" : "▸"}</span>
          <span>{titulo}</span>
          {!visible && resumen && <span className="ml-auto min-w-0 truncate text-[0.68rem] font-normal normal-case tracking-normal text-ink-soft">{resumen}</span>}
        </button>
      </h3>
      {visible && (
        <>
          {ayuda && <p className="font-sans border-b border-ink/10 bg-paper-deep/50 px-4 pb-2 pt-1 text-[0.7rem] text-ink-soft">{ayuda}</p>}
          <div className="space-y-4 p-4">{children}</div>
        </>
      )}
    </section>
  );
}

/** Dos botoncitos para abrir o plegar de una vez todos los paneles plegables del inspector. */
export function ControlPaneles() {
  const enviar = (v: boolean) => window.dispatchEvent(new CustomEvent<boolean>(EVENTO_PANELES, { detail: v }));
  return (
    <span className="font-sans inline-flex gap-1 text-[0.68rem]">
      <button type="button" className="border border-ink/30 px-1.5 py-0.5 font-semibold text-ink-soft hover:border-terracota hover:text-terracota" onClick={() => enviar(true)} title="Abrir todos los paneles">
        Abrir todo
      </button>
      <button type="button" className="border border-ink/30 px-1.5 py-0.5 font-semibold text-ink-soft hover:border-terracota hover:text-terracota" onClick={() => enviar(false)} title="Plegar todos los paneles">
        Plegar todo
      </button>
    </span>
  );
}
