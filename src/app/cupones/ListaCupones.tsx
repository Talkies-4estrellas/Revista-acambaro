"use client";

import { useMemo, useState } from "react";
import CuponAcambaGo from "@/components/CuponAcambaGo";
import { TAMANO_CUPON, type ElementoCupon } from "@/lib/esquema";
import type { CuponPublico } from "@/lib/cupones-publicos";

/** Cuadrícula de cupones con buscador y filtro por negocio. Cada tarjeta es la misma de las ediciones (abre su ventana con el QR). */
export default function ListaCupones({ cupones }: { cupones: CuponPublico[] }) {
  const [busqueda, setBusqueda] = useState("");
  const [negocio, setNegocio] = useState("");
  const negocios = useMemo(() => [...new Set(cupones.map((c) => c.datos.negocio).filter(Boolean))].sort((a, b) => a.localeCompare(b, "es")), [cupones]);

  const q = busqueda.trim().toLowerCase();
  const visibles = cupones.filter(
    (c) => (!negocio || c.datos.negocio === negocio) && (!q || [c.datos.titulo, c.datos.negocio, c.datos.descripcion ?? "", c.datos.codigo].some((t) => t.toLowerCase().includes(q))),
  );

  return (
    <section className="font-sans mt-8">
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          placeholder="Buscar negocio o promoción"
          aria-label="Buscar cupones"
          className="w-full rounded-full border border-ink/25 bg-transparent px-4 py-2 text-sm sm:w-72"
        />
        {negocios.length > 1 && (
          <select value={negocio} onChange={(e) => setNegocio(e.target.value)} aria-label="Filtrar por negocio" className="rounded-full border border-ink/25 bg-transparent px-4 py-2 text-sm">
            <option value="">Todos los negocios</option>
            {negocios.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        )}
        <span className="text-sm text-ink-soft" aria-live="polite">
          {visibles.length} {visibles.length === 1 ? "cupón" : "cupones"}
        </span>
      </div>

      {visibles.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-ink/25 p-6 text-center text-ink-soft">Ningún cupón coincide con la búsqueda.</p>
      ) : (
        <ul className="mt-6 grid gap-5 md:grid-cols-2">
          {visibles.map((c) => {
            const el: ElementoCupon = { tipo: "cupon", id: `cupones-${c.id}`, cupon: c.id, datos: c.datos, x: 0, y: 0, ...TAMANO_CUPON };
            return (
              <li key={c.id} className="paleta-clara" style={{ aspectRatio: `${TAMANO_CUPON.w} / ${TAMANO_CUPON.h}` }}>
                <CuponAcambaGo el={el} estadoInicial={c.estado} />
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
