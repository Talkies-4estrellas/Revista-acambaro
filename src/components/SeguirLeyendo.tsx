"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { leerLectura, type Lectura } from "@/lib/lectura";

/** Aviso en la portada del sitio: vuelve a la página en la que ibas. Solo si esa edición sigue publicada. */
export default function SeguirLeyendo({ publicadas }: { publicadas: string[] }) {
  const [lectura, setLectura] = useState<Lectura | null>(null);
  useEffect(() => {
    const l = leerLectura();
    if (l && publicadas.includes(l.id)) setLectura(l);
  }, [publicadas]);
  if (!lectura) return null;

  return (
    <div className="border-b border-ink/15 bg-paper">
      <Link href={lectura.href} className="group mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-3">
        <span className="font-sans min-w-0 text-sm">
          <span className="font-bold text-terracota">Seguir leyendo</span> · N.º {lectura.numero}, {lectura.tema}
        </span>
        <span className="font-sans whitespace-nowrap text-xs font-bold uppercase tracking-wider group-hover:text-terracota">
          Página {lectura.n} de {lectura.total} →
        </span>
      </Link>
    </div>
  );
}
