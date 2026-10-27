"use client";

import { useEffect, useState } from "react";
import { btnCls } from "./campos";

const DISPOSITIVOS = [
  { id: "celular", etiqueta: "📱 Celular", ancho: 390 },
  { id: "tableta", etiqueta: "▭ Tableta", ancho: 768 },
  { id: "compu", etiqueta: "🖥 Computadora", ancho: 0 },
] as const;

/**
 * Vista previa «como lector»: la edición tal como la verá quien la lea (con sus transiciones, animaciones y menú), a pantalla
 * completa y en el tamaño de un celular, una tableta o una computadora. Muestra la última versión guardada.
 */
export default function VistaPreviaLector({
  edicionId,
  pagina,
  sucio,
  onGuardar,
  onCerrar,
}: {
  edicionId: string;
  /** Página con la que se abre (desde 1). */
  pagina: number;
  sucio: boolean;
  onGuardar: () => Promise<void> | void;
  onCerrar: () => void;
}) {
  const [dispositivo, setDispositivo] = useState<(typeof DISPOSITIVOS)[number]["id"]>(() => (typeof window !== "undefined" && window.innerWidth < 640 ? "compu" : "celular"));
  const [version, setVersion] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const ancho = DISPOSITIVOS.find((d) => d.id === dispositivo)!.ancho;
  const src = `/ediciones/${edicionId}/${pagina}`;

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && onCerrar();
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, [onCerrar]);

  async function guardarYRecargar() {
    setGuardando(true);
    try {
      await onGuardar();
    } finally {
      setGuardando(false);
      setVersion((v) => v + 1);
    }
  }

  return (
    <div className="fixed inset-0 z-[80] flex flex-col bg-slate-800" role="dialog" aria-modal="true" aria-label="Vista previa como lector">
      <header className="font-sans flex flex-wrap items-center gap-2 bg-paper px-3 py-2">
        <h2 className="mr-2 text-sm font-black">👁 Así lo verá el lector</h2>
        <div role="group" aria-label="Tamaño de pantalla" className="flex">
          {DISPOSITIVOS.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={dispositivo === d.id}
              className={`${btnCls} ${d.id === "celular" ? "" : "-ml-px"} ${dispositivo === d.id ? "!bg-ink !text-paper" : ""} ${d.id === "tableta" ? "max-sm:hidden" : ""}`}
              onClick={() => setDispositivo(d.id)}
            >
              {d.etiqueta}
            </button>
          ))}
        </div>
        <button type="button" className={btnCls} onClick={() => setVersion((v) => v + 1)} title="Vuelve a cargar la edición desde la primera página que abriste">
          ↻ <span className="max-sm:hidden">Recargar</span>
        </button>
        <a href={`/ediciones/${edicionId}/${pagina}`} target="_blank" rel="noreferrer" className={`${btnCls} max-sm:hidden`}>
          ↗ Abrir en una pestaña
        </a>
        <button type="button" className={`${btnCls} ml-auto !bg-ink !text-paper`} onClick={onCerrar}>
          ✕ Cerrar
        </button>
        {sucio && (
          <p className="basis-full text-xs text-terracota" role="status">
            Hay cambios sin guardar que aquí no se ven.{" "}
            <button type="button" className="font-bold underline disabled:opacity-50" disabled={guardando} onClick={guardarYRecargar}>
              {guardando ? "Guardando…" : "Guardar y recargar"}
            </button>
          </p>
        )}
      </header>
      <div className="flex min-h-0 flex-1 items-stretch justify-center overflow-auto p-3 max-sm:p-0" data-tour="previa-lector">
        <div
          className={ancho ? "overflow-hidden rounded-[1.6rem] border-[10px] border-slate-950 bg-paper shadow-2xl max-sm:rounded-none max-sm:border-0" : "w-full overflow-hidden rounded-md bg-paper shadow-2xl max-sm:rounded-none"}
          style={ancho ? { width: ancho, maxWidth: "100%" } : undefined}
        >
          <iframe key={`${dispositivo}-${version}`} src={src} title="Vista previa de la edición" className="h-full w-full border-0 bg-paper" />
        </div>
      </div>
    </div>
  );
}
