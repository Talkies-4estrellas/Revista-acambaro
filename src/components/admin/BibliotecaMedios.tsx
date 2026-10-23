"use client";

import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { btnCls, MediosContext } from "./campos";

type Medio = {
  src: string;
  carpeta: string;
  nombre: string;
  bytes: number;
  tipo: "imagen" | "video";
  uso: { edicion: string; paginas: number[] }[];
};

const peso = (b: number) => (b >= 1048576 ? `${(b / 1048576).toFixed(1).replace(".", ",")} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const normalizar = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Galería de los archivos subidos, al estilo de un panel de «Subidos»: búsqueda, botón para subir, pestañas Imágenes / Videos y
 * miniaturas en columnas (mampostería) sin recortar. Con `onUsar`, un clic (o arrastrar a la hoja si `arrastrable`) usa el archivo;
 * Sin `onUsar`, un clic copia la ruta del archivo.
 */
export function GaleriaMedios({
  edicionId,
  tipoFijo,
  onUsar,
  arrastrable,
  columnas = 2,
}: {
  edicionId: string;
  /** Solo muestra este tipo y quita las pestañas (al elegir para un campo de imagen o de video). */
  tipoFijo?: "imagen" | "video";
  onUsar?: (src: string) => void;
  /** Las miniaturas se pueden arrastrar a la hoja del editor (`subido:<ruta>`). */
  arrastrable?: boolean;
  columnas?: 2 | 3 | 4;
}) {
  const { subir } = useContext(MediosContext);
  const [medios, setMedios] = useState<Medio[] | null>(null);
  const [error, setError] = useState("");
  const [pestana, setPestana] = useState<"imagen" | "video">(tipoFijo ?? "imagen");
  const [ambito, setAmbito] = useState<"todas" | "esta">("todas");
  const [busqueda, setBusqueda] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const tipo = tipoFijo ?? pestana;

  const cargar = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/medios?todos=1", { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `Error ${r.status}`);
      setMedios(j.medios as Medio[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la galería");
    }
  }, []);
  useEffect(() => {
    cargar();
  }, [cargar]);

  const delTipo = useMemo(() => (medios ?? []).filter((m) => m.tipo === tipo), [medios, tipo]);
  const visibles = useMemo(() => {
    const q = normalizar(busqueda.trim());
    return delTipo
      .filter((m) => (ambito === "todas" || m.carpeta === edicionId) && (!q || normalizar(`${m.nombre} ${m.carpeta}`).includes(q)))
      .sort((a, b) => Number(b.carpeta === edicionId) - Number(a.carpeta === edicionId) || a.carpeta.localeCompare(b.carpeta) || a.nombre.localeCompare(b.nombre));
  }, [delTipo, ambito, busqueda, edicionId]);
  const cuentaPestana = (t: "imagen" | "video") => (medios ?? []).filter((m) => m.tipo === t).length;

  async function alSubir(e: React.ChangeEvent<HTMLInputElement>) {
    const archivos = Array.from(e.target.files ?? []);
    e.target.value = "";
    if (!archivos.length) return;
    setOcupado(true);
    setError("");
    try {
      for (const f of archivos) {
        const src = await subir(f);
        if (/\.(mp4|webm)$/i.test(src)) setPestana("video");
        else setPestana("imagen");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo subir");
    }
    await cargar();
    setOcupado(false);
  }

  async function copiar(src: string) {
    try {
      await navigator.clipboard.writeText(src);
      setCopiado(src);
      setTimeout(() => setCopiado(""), 1500);
    } catch {
      // sin permiso del portapapeles
    }
  }

  const pestanaCls = (activa: boolean) => `font-sans border-b-2 px-1 pb-1.5 text-sm font-bold ${activa ? "border-ink text-ink" : "border-transparent text-ink-soft hover:text-ink"}`;
  const chipCls = (activo: boolean) => `font-sans rounded-full border px-2.5 py-0.5 text-[0.68rem] font-semibold ${activo ? "border-ink bg-ink text-paper" : "border-ink/30 text-ink-soft hover:border-ink"}`;
  const colsCls = columnas === 4 ? "columns-2 sm:columns-3 lg:columns-4" : columnas === 3 ? "columns-2 sm:columns-3" : "columns-2";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-2 border-b border-ink/15 px-3 pb-2 pt-3">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre o edición…"
          aria-label="Buscar en los archivos subidos"
          className="w-full rounded-full border border-ink/30 bg-white/80 px-4 py-2 font-sans text-sm outline-none focus:border-terracota dark:bg-white/5"
        />
        <button type="button" className="font-sans w-full rounded-md bg-ink px-3 py-2 text-sm font-bold text-paper hover:opacity-90 disabled:opacity-50" disabled={ocupado} onClick={() => input.current?.click()}>
          {ocupado ? "Trabajando…" : "⬆ Subir archivos"}
        </button>
        <input ref={input} type="file" hidden multiple accept="image/jpeg,image/png,image/webp,image/gif,image/avif,video/mp4,video/webm" onChange={alSubir} />
        {!tipoFijo && (
          <div className="flex gap-4 pt-1" role="tablist" aria-label="Tipo de archivo">
            <button type="button" role="tab" aria-selected={pestana === "imagen"} className={pestanaCls(pestana === "imagen")} onClick={() => setPestana("imagen")}>
              Imágenes{medios ? ` (${cuentaPestana("imagen")})` : ""}
            </button>
            <button type="button" role="tab" aria-selected={pestana === "video"} className={pestanaCls(pestana === "video")} onClick={() => setPestana("video")}>
              Videos{medios ? ` (${cuentaPestana("video")})` : ""}
            </button>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-1.5">
          <button type="button" className={chipCls(ambito === "todas")} onClick={() => setAmbito("todas")}>
            Todas las ediciones
          </button>
          <button type="button" className={chipCls(ambito === "esta")} onClick={() => setAmbito("esta")}>
            Esta edición
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
        {error && (
          <p role="alert" className="font-sans mb-2 border-l-4 border-terracota bg-terracota/10 px-2 py-1 text-xs text-terracota">
            {error}
          </p>
        )}
        {medios === null && !error && <p className="font-sans text-sm text-ink-soft">Cargando…</p>}
        {medios !== null && (
          <p className="font-sans mb-2 text-[0.7rem] text-ink-soft">
            {visibles.length} {tipo === "video" ? "video(s)" : "imagen(es)"} · {peso(visibles.reduce((s, m) => s + m.bytes, 0))}
          </p>
        )}
        {medios !== null && visibles.length === 0 && <p className="font-sans border-t border-ink/20 py-4 text-sm italic text-ink-soft">No hay archivos con este filtro.</p>}
        <ul className={`${colsCls} gap-2`}>
          {visibles.map((m) => {
            const titulo = `${m.nombre} · ${peso(m.bytes)}`;
            return (
              <li key={m.src} className="group relative mb-2 break-inside-avoid overflow-hidden rounded-md bg-ink/5">
                <button
                  type="button"
                  className="block w-full text-left"
                  draggable={!!arrastrable}
                  onDragStart={(e) => {
                    if (!arrastrable) return;
                    e.dataTransfer.setData("application/x-lienzo", `subido:${m.src}`);
                    e.dataTransfer.effectAllowed = "copy";
                  }}
                  onClick={() => (onUsar ? onUsar(m.src) : copiar(m.src))}
                  title={titulo}
                  aria-label={`${onUsar ? "Usar" : "Copiar la ruta de"} ${m.nombre}`}
                >
                  {m.tipo === "imagen" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.src} alt="" loading="lazy" draggable={false} className="block h-auto w-full" />
                  ) : (
                    <video src={m.src} preload="metadata" muted draggable={false} className="block h-auto w-full" />
                  )}
                </button>
                {m.tipo === "video" && <span className="font-sans pointer-events-none absolute left-1 top-1 rounded bg-ink/80 px-1.5 py-0.5 text-[0.6rem] font-bold uppercase text-paper">Video</span>}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 hidden bg-gradient-to-t from-black/75 to-transparent px-2 pb-1.5 pt-6 font-sans text-[0.65rem] leading-tight text-white group-hover:block">
                  <p className="truncate font-bold">{m.nombre}</p>
                  <p className="truncate opacity-80">{peso(m.bytes)}</p>
                </div>
                {copiado === m.src && <span className="font-sans pointer-events-none absolute right-1 top-1 rounded bg-paper/95 px-1.5 py-0.5 text-[0.65rem] font-bold text-ink shadow">✓ Ruta copiada</span>}
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Ventana con la galería: para ordenar todo lo subido (barra del editor) o para elegir un archivo de un campo (`onElegir`). */
export default function BibliotecaMedios({
  edicionId,
  tipo,
  onElegir,
  onCerrar,
}: {
  edicionId: string;
  tipo?: "imagen" | "video";
  onElegir?: (src: string) => void;
  onCerrar: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/60 p-3 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div role="dialog" aria-modal="true" aria-label="Biblioteca de medios" className="flex max-h-[92vh] w-full max-w-4xl flex-col border-2 border-ink bg-paper shadow-2xl">
        <header className="flex shrink-0 items-center justify-between gap-3 border-b border-ink/30 bg-paper-deep px-5 py-3">
          <h2 className="font-display text-2xl font-black">{onElegir ? `Elegir ${tipo === "video" ? "un video" : "una imagen"}` : "Archivos subidos"}</h2>
          <button type="button" className={btnCls} onClick={onCerrar}>
            ✕ Cerrar
          </button>
        </header>
        <GaleriaMedios
          edicionId={edicionId}
          tipoFijo={tipo}
          columnas={4}
          onUsar={onElegir ? (src) => { onElegir(src); onCerrar(); } : undefined}
        />
      </div>
    </div>
  );
}
