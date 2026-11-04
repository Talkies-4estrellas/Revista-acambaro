"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/** Mañana a las 9:00 (hora del centro de México), como sugiere el editor. */
function sugerirPublicacion() {
  const manana = new Date(Date.now() - 6 * 3600_000 + 24 * 3600_000);
  return `${manana.toISOString().slice(0, 10)}T09:00`;
}

/**
 * Publicar ya, programar o desactivar una edición desde la lista, sin abrir el editor. Al publicar avisa si el revisor
 * encontró cosas por revisar.
 */
export default function MenuPublicacion({
  id,
  tema,
  estado,
  publicarEn,
  porRevisar,
  numero,
}: {
  id: string;
  tema?: string;
  estado: "publicada" | "programada" | "borrador" | "desactivada";
  publicarEn?: string;
  porRevisar: number;
  /** Número que tendrá (o conserva) la edición. */
  numero?: string;
}) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [programando, setProgramando] = useState(false);
  const [cuando, setCuando] = useState(publicarEn ?? sugerirPublicacion());
  const [cargando, setCargando] = useState(false);
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: PointerEvent) => {
      if (!caja.current?.contains(e.target as Node)) {
        setAbierto(false);
        setProgramando(false);
      }
    };
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setAbierto(false);
    window.addEventListener("pointerdown", fuera);
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("pointerdown", fuera);
      window.removeEventListener("keydown", esc);
    };
  }, [abierto]);

  const nombre = `«${tema ?? id}»`;
  async function aplicar(modo: "publicar" | "programar" | "desactivar") {
    const aviso = porRevisar > 0 && modo !== "desactivar" ? `\n\nOjo: el revisor encontró ${porRevisar} ${porRevisar === 1 ? "cosa" : "cosas"} por revisar (textos o enlaces de ejemplo, fotos sin descripción…).` : "";
    const pregunta =
      modo === "publicar"
        ? `¿Publicar ${nombre} ahora?${numero ? ` Será la N.º ${numero}.` : ""} Se verá en el sitio cuando subas los cambios.${aviso}`
        : modo === "programar"
          ? `¿Programar ${nombre} para el ${cuando.replace("T", " a las ")} (hora del centro de México)?${aviso}`
          : `¿Desactivar ${nombre}? Deja de verse en el sitio${numero ? ` pero conserva la N.º ${numero}` : ""}.`;
    if (!window.confirm(pregunta)) return;
    setCargando(true);
    try {
      const res = await fetch(`/api/admin/ediciones/${encodeURIComponent(id)}/publicacion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modo, publicarEn: modo === "programar" ? cuando : undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setAbierto(false);
      setProgramando(false);
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e));
    } finally {
      setCargando(false);
    }
  }

  const item = "block w-full px-3 py-2 text-left normal-case tracking-normal hover:bg-ink/[0.07] disabled:opacity-40";
  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        disabled={cargando}
        onClick={() => setAbierto((v) => !v)}
        className="border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper disabled:opacity-50"
      >
        {cargando ? "Guardando…" : "Publicación ▾"}
      </button>
      {abierto && (
        <div role="menu" className="font-sans absolute right-0 z-30 mt-1 w-64 overflow-hidden max-sm:fixed max-sm:inset-x-4 max-sm:bottom-4 max-sm:z-50 max-sm:w-auto rounded-lg border border-ink/20 bg-paper text-sm font-normal shadow-[0_18px_40px_-12px_rgba(0,0,0,0.45)]">
          <button type="button" role="menuitem" className={item} disabled={estado === "publicada"} onClick={() => aplicar("publicar")}>
            <b>Publicar ahora</b>
            <span className="block text-xs text-ink-soft">{estado === "publicada" ? "Ya está publicada" : "Visible en cuanto subas los cambios"}</span>
          </button>
          <button type="button" role="menuitem" className={item} onClick={() => setProgramando((v) => !v)}>
            <b>{estado === "programada" ? "Cambiar la fecha…" : "Programar…"}</b>
            <span className="block text-xs text-ink-soft">{estado === "programada" && publicarEn ? `Ahora: ${publicarEn.replace("T", " ")}` : "Se publica sola el día y hora que elijas"}</span>
          </button>
          {programando && (
            <div className="space-y-2 border-y border-ink/10 bg-paper-deep/60 px-3 py-3">
              <label className="block text-xs font-bold">
                Día y hora (centro de México)
                <input type="datetime-local" value={cuando} onChange={(e) => setCuando(e.target.value)} className="mt-1 block w-full rounded border border-ink/30 bg-paper px-2 py-1.5 text-sm font-normal" />
              </label>
              <button type="button" onClick={() => aplicar("programar")} className="w-full bg-ink px-3 py-2 text-xs font-bold uppercase tracking-wider text-paper hover:bg-terracota">
                Programar
              </button>
            </div>
          )}
          <button type="button" role="menuitem" className={item} disabled={estado === "borrador" || estado === "desactivada"} onClick={() => aplicar("desactivar")}>
            <b>Desactivar</b>
            <span className="block text-xs text-ink-soft">{estado === "borrador" || estado === "desactivada" ? "No está publicada" : "Deja de verse; conserva su número"}</span>
          </button>
        </div>
      )}
    </div>
  );
}
