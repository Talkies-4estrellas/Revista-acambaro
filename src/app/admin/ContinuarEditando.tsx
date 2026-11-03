"use client";

import Link from "next/link";
import { useEffect, useState, type ReactNode } from "react";

/** «Continuar donde lo dejaste»: la última edición que se tocó, abierta en la página en la que se estaba trabajando (la recuerda el editor). */
export default function ContinuarEditando({ id, tema, cuando, paginas, portada }: { id: string; tema: string; cuando: string; paginas: number; portada: ReactNode }) {
  const [pagina, setPagina] = useState<number | null>(null);
  useEffect(() => {
    try {
      const n = Number(localStorage.getItem(`revista:ultima-pagina:${id}`));
      if (n >= 1 && n <= paginas) setPagina(n);
    } catch {}
  }, [id, paginas]);
  const href = `/admin/${id}${pagina ? `#p=${pagina}` : ""}`;

  return (
    <Link href={href} className="group flex h-full min-w-0 items-center gap-3 rounded-xl sm:gap-4 border border-ink/15 bg-paper-deep/40 p-4 transition-colors hover:border-terracota">
      <span className="block aspect-[800/1100] w-14 shrink-0 overflow-hidden rounded-sm shadow-[0_6px_16px_-8px_rgba(0,0,0,0.6)]">{portada}</span>
      <span className="min-w-0 flex-1">
        <span className="font-sans block text-xs font-bold uppercase tracking-wider text-terracota">Continuar donde lo dejaste</span>
        <span className="font-display mt-0.5 block truncate text-xl font-bold">{tema}</span>
        <span className="font-sans block text-xs text-ink-soft">
          Editada {cuando}
          {pagina ? ` · ibas en la página ${pagina}` : ""}
        </span>
      </span>
      <span className="font-sans shrink-0 bg-ink px-3 py-2 text-xs font-bold uppercase tracking-wider text-paper group-hover:bg-terracota">
        <span className="hidden sm:inline">Continuar </span>→
      </span>
    </Link>
  );
}
