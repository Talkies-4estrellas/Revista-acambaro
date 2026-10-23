"use client";

import Link from "next/link";
import type { CSSProperties, ReactNode } from "react";

/**
 * Enlace de la revista que avisa al servidor cuando alguien lo toca (para el conteo de clics de los anunciantes).
 * Cubre direcciones https, correo, teléfono y rutas del sitio; el aviso va con sendBeacon: no retrasa la apertura del
 * enlace ni falla si el servidor no responde. Solo las direcciones https se abren en otra pestaña.
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
  if (href.startsWith("/")) {
    return (
      <Link href={href} style={style} onClick={avisar} onAuxClick={avisar}>
        {children}
      </Link>
    );
  }
  const web = /^https?:\/\//i.test(href);
  return (
    <a href={href} {...(web ? { target: "_blank", rel: "noopener noreferrer" } : {})} style={style} onClick={avisar} onAuxClick={avisar}>
      {children}
    </a>
  );
}
