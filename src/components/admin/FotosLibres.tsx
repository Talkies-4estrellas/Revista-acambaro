"use client";

import { useState } from "react";
import { recordarCredito } from "@/lib/creditos-pendientes";
import { mensajeSimple } from "@/lib/errores-simples";

type Foto = { titulo: string; miniatura: string; ancho: number; alto: number; autor: string; licencia: string; pagina: string };

/**
 * Buscador de fotos libres (Wikimedia Commons) dentro del panel «Subidos». Solo se descarga una foto cuando se pulsa «Usar»; se guarda en la
 * carpeta de medios de la edición, con su autor y licencia como crédito, y se coloca en la hoja (o reemplaza la elegida).
 */
export default function FotosLibres({ edicionId, onUsar, onVolver }: { edicionId: string; onUsar: (src: string) => void; onVolver: () => void }) {
  const [q, setQ] = useState("");
  const [fotos, setFotos] = useState<Foto[] | null>(null);
  const [cargando, setCargando] = useState(false);
  const [bajando, setBajando] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function buscar(e?: React.FormEvent) {
    e?.preventDefault();
    if (q.trim().length < 2) return;
    setCargando(true);
    setError("");
    try {
      const r = await fetch(`/api/admin/fotos-libres?q=${encodeURIComponent(q.trim())}`, { cache: "no-store" });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `Error ${r.status}`);
      setFotos(j.fotos as Foto[]);
    } catch (err) {
      setError(mensajeSimple(err, "buscar las fotos"));
    } finally {
      setCargando(false);
    }
  }

  async function usar(f: Foto) {
    setBajando(f.titulo);
    setError("");
    try {
      const r = await fetch("/api/admin/fotos-libres", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ titulo: f.titulo, edicion: edicionId }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? `Error ${r.status}`);
      recordarCredito(j.src, j.credito);
      onUsar(j.src);
    } catch (err) {
      setError(mensajeSimple(err, "descargar la foto"));
    } finally {
      setBajando(null);
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 space-y-2 border-b border-ink/15 px-3 pb-2 pt-3">
        <button type="button" className="font-sans text-xs font-bold text-ink-soft underline hover:text-ink" onClick={onVolver}>
          ← Mis archivos subidos
        </button>
        <form onSubmit={buscar} className="flex gap-1.5">
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ej.: locomotora de vapor México" aria-label="Buscar fotos libres" className="min-w-0 flex-1 rounded-full border border-ink/30 bg-white/80 px-4 py-2 font-sans text-sm outline-none focus:border-terracota dark:bg-white/5" />
          <button type="submit" disabled={cargando || q.trim().length < 2} className="font-sans rounded-md bg-ink px-3 text-sm font-bold text-paper disabled:opacity-40">
            {cargando ? "…" : "Buscar"}
          </button>
        </form>
        <p className="font-sans text-[0.68rem] leading-snug text-ink-soft">Fotos de Wikimedia Commons con licencia que permite reutilizarlas (CC0, dominio público, CC BY, CC BY-SA). Al usar una, se descarga a esta edición con su crédito.</p>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-3">
        {error && <p role="alert" className="font-sans mb-2 text-xs font-bold text-terracota">{error}</p>}
        {fotos === null ? (
          <p className="font-sans text-xs italic text-ink-soft">Escribe qué buscas y pulsa Buscar. Prueba en español o en inglés.</p>
        ) : fotos.length === 0 ? (
          <p className="font-sans text-xs italic text-ink-soft">No encontré fotos con licencia libre para «{q}». Prueba otra palabra.</p>
        ) : (
          <ul className="columns-2 gap-2">
            {fotos.map((f) => (
              <li key={f.titulo} className="mb-2 break-inside-avoid border border-ink/20 bg-white/60 dark:bg-white/5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={f.miniatura} alt={f.titulo.replace(/^File:/, "").replace(/\.[^.]+$/, "")} loading="lazy" className="block w-full" />
                <div className="font-sans space-y-1 p-1.5 text-[0.65rem] leading-snug">
                  <p className="truncate font-semibold" title={f.autor}>{f.autor}</p>
                  <p className="text-ink-soft">{f.licencia}</p>
                  <div className="flex items-center gap-1.5">
                    <button type="button" disabled={bajando !== null} onClick={() => usar(f)} className="rounded bg-ink px-2 py-1 font-bold text-paper disabled:opacity-40">
                      {bajando === f.titulo ? "Descargando…" : "Usar"}
                    </button>
                    {f.pagina && (
                      <a href={f.pagina} target="_blank" rel="noreferrer" className="underline hover:text-terracota" title="Ver la ficha en Wikimedia Commons">
                        ficha ↗
                      </a>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
