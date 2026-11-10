"use client";

import { useEffect, useMemo, useState } from "react";
import { ETIQUETA_ESTADO, descuento, diaDeVencimiento, type EstadoCupon } from "@/lib/cupon-estado";
import type { DatosCupon } from "@/lib/esquema";

export type CuponElegible = { id: string; estado: EstadoCupon; usados: number; datos: DatosCupon };

/** Lista de cupones de AcambaGo (los recién leídos de su base) se guarda mientras el editor está abierto. */
let recordados: CuponElegible[] | null = null;

/** Lee los cupones de AcambaGo para el editor (vía el panel local; nunca escribe). */
export async function cargarCupones(forzar = false): Promise<CuponElegible[]> {
  if (recordados && !forzar) return recordados;
  const r = await fetch("/api/admin/cupones", { cache: "no-store" });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error ?? `Error ${r.status}`);
  recordados = j.cupones as CuponElegible[];
  return recordados;
}

/**
 * Cajón «Cupones» del editor: elige un cupón real de AcambaGo para ponerlo en la hoja.
 * Los vigentes van primero; los demás se pueden poner (para preparar una edición), pero avisan.
 */
export default function SelectorCupones({ onElegir, reemplazando = false }: { onElegir: (c: CuponElegible) => void; reemplazando?: boolean }) {
  const [lista, setLista] = useState<CuponElegible[] | null>(recordados);
  const [error, setError] = useState<string | null>(null);
  const [busqueda, setBusqueda] = useState("");

  const leer = (forzar: boolean) => {
    setError(null);
    cargarCupones(forzar)
      .then(setLista)
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(() => {
    if (!recordados) leer(false);
  }, []);

  const visibles = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return (lista ?? [])
      .filter((c) => !q || [c.datos.titulo, c.datos.negocio, c.datos.codigo].some((t) => t.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.estado === "vigente") - Number(a.estado === "vigente"));
  }, [lista, busqueda]);

  return (
    <div className="font-sans p-3">
      <p className="mb-2 text-[0.7rem] text-ink-soft">
        {reemplazando ? "Elige el cupón que sustituirá al seleccionado." : "Cupones reales de AcambaGo. Clic para ponerlo en la hoja."} Sus textos salen del cupón (no se escriben a mano); en el sitio el
        lector lo toca y ve el QR para canjearlo en el negocio.
      </p>
      <div className="mb-2 flex gap-2">
        <input type="search" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="Negocio, título o código" aria-label="Buscar cupones" className="min-w-0 flex-1 border border-ink/30 bg-white/70 px-2 py-1 text-xs dark:bg-white/5" />
        <button type="button" onClick={() => leer(true)} className="border border-ink/30 px-2 py-1 text-xs font-bold hover:bg-paper-deep" title="Volver a leer los cupones de AcambaGo">
          ↻
        </button>
      </div>
      {error && <p className="mb-2 border border-ink/30 bg-paper-deep p-2 text-xs">{error}</p>}
      {!lista && !error && <p className="text-xs text-ink-soft">Leyendo cupones de AcambaGo…</p>}
      {lista && visibles.length === 0 && <p className="text-xs text-ink-soft">{lista.length ? "Ningún cupón coincide." : "AcambaGo todavía no tiene cupones."}</p>}
      <div className="flex flex-col gap-2">
        {visibles.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => onElegir(c)}
            className={`flex w-full items-center gap-2 border bg-white p-2 text-left hover:border-terracota dark:bg-white/5 ${c.estado === "vigente" ? "border-ink/20" : "border-dashed border-ink/30 opacity-75"}`}
          >
            <span className="font-display w-14 shrink-0 text-center text-lg font-black leading-none">{descuento(c.datos.tipo, c.datos.valor)}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-bold">{c.datos.titulo}</span>
              <span className="block truncate text-[0.65rem] text-ink-soft">
                {c.datos.negocio} · {c.datos.codigo}
              </span>
              <span className="block text-[0.62rem] text-ink-soft">
                {c.estado === "vigente" ? (c.datos.vence ? `Vence ${diaDeVencimiento(c.datos.vence)}` : "Sin vencimiento") : `⚠ ${ETIQUETA_ESTADO[c.estado]}`}
              </span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
