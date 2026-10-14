"use client";

import type { CSSProperties, ReactNode } from "react";

/**
 * Enlace externo de la revista que avisa al servidor cuando alguien lo toca (para el conteo de clics de los
 * anunciantes). El aviso va con sendBeacon: no retrasa la apertura del enlace ni falla si el servidor no responde.
 */
export default function EnlaceMedido({ href, edicion, elemento, style, children }: { href: string; edicion: string; elemento?: string; style?: CSSProperties; children: ReactNode }) {
  const avisar = () => {
    if (!elemento) return;
    try {
      const datos = new Blob([JSON.stringify({ e: edicion, i: elemento, u: href })], { type: "text/plain" });
      navigator.sendBeacon?.("/api/clic", datos);
    } catch {
      // Sin conteo; el enlace funciona igual.
    }
  };
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={style} onClick={avisar} onAuxClick={avisar}>
      {children}
    </a>
  );
}
