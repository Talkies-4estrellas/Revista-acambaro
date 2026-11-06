"use client";

import { useEffect, useState } from "react";
import { IconoSvg } from "@/components/Lienzo";

const MENSAJE = "ACOM-Di, la revista digital de Acámbaro: historia, sabor, gente y paisajes.";

/** Botones para compartir la presentación. Solo abren WhatsApp, Facebook o el correo de quien pulsa: desde aquí no se envía nada. */
export default function CompartirRevista() {
  // La dirección pública si está definida; si no, la de la página abierta.
  const [url, setUrl] = useState("");
  const [copiado, setCopiado] = useState(false);
  useEffect(() => setUrl(`${(process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(/\/+$/, "")}/bienvenida`), []);

  const texto = encodeURIComponent(`${MENSAJE} ${url}`);
  const opciones = [
    { icono: "whatsapp", nombre: "WhatsApp", href: `https://wa.me/?text=${texto}` },
    { icono: "facebook", nombre: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { icono: "mail", nombre: "Correo", href: `mailto:?subject=${encodeURIComponent("ACOM-Di, la revista de Acámbaro")}&body=${texto}` },
  ];

  async function copiar() {
    try {
      await navigator.clipboard.writeText(url);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2500);
    } catch {
      window.prompt("Copia el enlace:", url);
    }
  }

  const tarjeta = "font-sans flex flex-col items-center justify-center gap-2 rounded-2xl border border-ink/15 bg-paper p-5 text-sm font-bold transition-colors hover:border-terracota";
  return (
    <ul className="grid grid-cols-2 gap-3">
      {opciones.map((o) => (
        <li key={o.nombre}>
          <a href={o.href} target="_blank" rel="noopener noreferrer" className={tarjeta} aria-label={`Compartir por ${o.nombre}`}>
            <IconoSvg icono={o.icono} color="#067556" trazo={1.7} className="h-8 w-8" />
            {o.nombre}
          </a>
        </li>
      ))}
      <li>
        <button type="button" onClick={copiar} className={`${tarjeta} w-full`}>
          <IconoSvg icono={copiado ? "check" : "link"} color="#067556" trazo={1.7} className="h-8 w-8" />
          <span aria-live="polite">{copiado ? "¡Copiado!" : "Copiar enlace"}</span>
        </button>
      </li>
    </ul>
  );
}
