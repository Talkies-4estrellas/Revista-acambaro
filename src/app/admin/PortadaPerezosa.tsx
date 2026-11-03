"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { portadaAdmin } from "./portada-actions";

/** Portadas ya pedidas (al cambiar de vista o de página de resultados no se vuelven a pedir). */
const cache = new Map<string, ReactNode>();

/** La portada de una edición, pedida al servidor cuando se acerca a la pantalla. Mientras tanto, un hueco de la misma proporción. */
export default function PortadaPerezosa({ id, className = "" }: { id: string; className?: string }) {
  const caja = useRef<HTMLDivElement>(null);
  const [nodo, setNodo] = useState<ReactNode | undefined>(() => cache.get(id));

  useEffect(() => {
    if (nodo !== undefined || !caja.current) return;
    let vivo = true;
    const obs = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        portadaAdmin(id)
          .then((n) => {
            cache.set(id, n);
            if (vivo) setNodo(n);
          })
          .catch(() => vivo && setNodo(null));
      },
      { rootMargin: "400px 0px" },
    );
    obs.observe(caja.current);
    return () => {
      vivo = false;
      obs.disconnect();
    };
  }, [id, nodo]);

  return (
    <div ref={caja} className={`aspect-[800/1100] overflow-hidden bg-ink/[0.07] ${className}`}>
      {nodo}
    </div>
  );
}
