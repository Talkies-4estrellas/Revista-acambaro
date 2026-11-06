"use client";

import { useEffect, useRef, useState } from "react";
import { IconoSvg } from "@/components/Lienzo";

/**
 * Compartir la página que se está leyendo. En el celular abre el menú de compartir del teléfono; en computadora, un menú con WhatsApp,
 * Facebook y copiar el enlace. La dirección se lee al pulsar: en el celular cambia mientras se baja por la edición.
 * No aparece dentro del marco de la muestra de la bienvenida. Desde aquí no se envía nada: solo se abre la app de quien pulsa.
 */
export default function CompartirPagina() {
  const [enMarco, setEnMarco] = useState(true);
  const [abierto, setAbierto] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => setEnMarco(window.self !== window.top), []);
  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) setAbierto(false);
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("pointerdown", fuera);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", fuera);
      window.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  if (enMarco) return null;

  const direccion = () => window.location.origin + window.location.pathname;

  async function pulsar() {
    // El menú nativo solo en pantallas táctiles; en computadora Windows abriría un diálogo menos útil que estos botones.
    if (typeof navigator.share === "function" && window.matchMedia("(pointer: coarse)").matches) {
      try {
        await navigator.share({ title: document.title, url: direccion() });
      } catch {
        /* quien comparte canceló */
      }
      return;
    }
    setAbierto((v) => !v);
  }

  function abrir(red: "whatsapp" | "facebook") {
    const url = encodeURIComponent(direccion());
    const texto = encodeURIComponent(`${document.title} ${direccion()}`);
    window.open(red === "whatsapp" ? `https://wa.me/?text=${texto}` : `https://www.facebook.com/sharer/sharer.php?u=${url}`, "_blank", "noopener,noreferrer");
    setAbierto(false);
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(direccion());
      setCopiado(true);
      setTimeout(() => {
        setCopiado(false);
        setAbierto(false);
      }, 1500);
    } catch {
      window.prompt("Copia el enlace:", direccion());
    }
  }

  const item = "flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm normal-case tracking-normal hover:bg-ink/[0.07]";
  return (
    <div ref={caja} className="relative">
      <button type="button" onClick={pulsar} aria-label="Compartir esta página" aria-expanded={abierto} title="Compartir esta página" className="grid h-9 w-9 place-items-center hover:text-terracota">
        <IconoSvg icono="share-2" color="tinta" trazo={2} className="h-[1.05rem] w-[1.05rem]" />
      </button>
      {abierto && (
        <div className="font-sans absolute right-0 top-full z-40 mt-1 w-52 overflow-hidden rounded-lg border border-ink/20 bg-paper font-semibold shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]">
          <button type="button" onClick={() => abrir("whatsapp")} className={item}>
            <IconoSvg icono="whatsapp" color="#067556" trazo={1.8} className="h-5 w-5 shrink-0" /> WhatsApp
          </button>
          <button type="button" onClick={() => abrir("facebook")} className={item}>
            <IconoSvg icono="facebook" color="#067556" trazo={1.8} className="h-5 w-5 shrink-0" /> Facebook
          </button>
          <button type="button" onClick={copiar} className={item}>
            <IconoSvg icono={copiado ? "check" : "link"} color="#067556" trazo={1.8} className="h-5 w-5 shrink-0" />
            <span aria-live="polite">{copiado ? "¡Copiado!" : "Copiar enlace"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
