"use client";

import { useEffect, useState } from "react";
import type { EdicionDatos } from "@/lib/esquema";
import { btnCls } from "./campos";

type Respaldo = { nombre: string; fecha: number; paginas: number; tema: string };

const formato = new Intl.DateTimeFormat("es-MX", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/**
 * Versiones anteriores de la edición (el servidor guarda una copia antes de sobrescribir el archivo, como mucho una cada pocos minutos).
 * Restaurar solo carga las páginas en el editor: no se escribe nada hasta que se guarde.
 */
export default function Versiones({
  edicionId,
  sucio,
  onRestaurar,
  onCerrar,
}: {
  edicionId: string;
  sucio: boolean;
  onRestaurar: (datos: EdicionDatos) => void;
  onCerrar: () => void;
}) {
  const [lista, setLista] = useState<Respaldo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    fetch(`/api/admin/ediciones/${edicionId}/respaldos`)
      .then((r) => r.json().then((j) => ({ ok: r.ok, j })))
      .then(({ ok, j }) => {
        if (!vivo) return;
        if (!ok) setError(j.error ?? "No se pudo leer el historial.");
        else setLista(j.respaldos as Respaldo[]);
      })
      .catch(() => vivo && setError("No se pudo leer el historial."));
    return () => {
      vivo = false;
    };
  }, [edicionId]);

  async function restaurar(nombre: string) {
    if (sucio && !window.confirm("Tienes cambios sin guardar. Si restauras esta versión se reemplazan las páginas que ves ahora. ¿Continuar?")) return;
    setCargando(nombre);
    try {
      const r = await fetch(`/api/admin/ediciones/${edicionId}/respaldos?nombre=${encodeURIComponent(nombre)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "No se pudo cargar la versión.");
      onRestaurar(j.datos as EdicionDatos);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar la versión.");
    } finally {
      setCargando(null);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div role="dialog" aria-modal="true" aria-label="Versiones anteriores" className="w-full max-w-xl border-2 border-ink bg-paper shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-ink/30 bg-paper-deep px-5 py-3">
          <h2 className="font-display text-2xl font-black">Versiones anteriores</h2>
          <button type="button" className={btnCls} onClick={onCerrar}>✕ Cerrar</button>
        </header>
        <section className="px-5 py-4">
          <p className="font-sans text-xs leading-relaxed text-ink-soft">
            Cada vez que se guarda, el servidor conserva la versión anterior (una copia cada pocos minutos como máximo, las últimas 40). <strong>Restaurar</strong> carga
            las páginas, el tema y la fecha de esa versión en el editor; no cambia si la edición está publicada ni se escribe nada hasta que se guarde (con Guardar, o solo si el autoguardado está activo).
          </p>
          {error && <p role="alert" className="font-sans mt-3 border-l-4 border-terracota bg-terracota/10 px-3 py-1.5 text-xs font-bold">{error}</p>}
          {lista === null && !error && <p className="font-sans mt-3 text-xs italic text-ink-soft">Cargando…</p>}
          {lista && lista.length === 0 && (
            <p className="font-sans mt-3 text-xs italic text-ink-soft">Todavía no hay versiones anteriores: aparecen después de guardar cambios.</p>
          )}
          {lista && lista.length > 0 && (
            <ul className="mt-3 space-y-2">
              {lista.map((r) => (
                <li key={r.nombre} className="flex items-center gap-3 border border-ink/20 bg-white/50 px-3 py-2 dark:bg-white/5">
                  <div className="min-w-0 flex-1">
                    <p className="font-sans text-xs font-bold">{formato.format(new Date(r.fecha))}</p>
                    <p className="font-sans truncate text-xs text-ink-soft">
                      {r.paginas} {r.paginas === 1 ? "página" : "páginas"}
                      {r.tema ? ` · ${r.tema}` : ""}
                    </p>
                  </div>
                  <button type="button" className={`${btnCls} shrink-0`} disabled={cargando !== null} onClick={() => restaurar(r.nombre)}>
                    {cargando === r.nombre ? "Cargando…" : "Restaurar"}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
