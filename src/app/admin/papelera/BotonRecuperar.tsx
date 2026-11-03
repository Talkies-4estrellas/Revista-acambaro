"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

/** Saca una edición o un archivo de medios de la papelera. */
export default function BotonRecuperar({ tipo, archivo, nombre }: { tipo: "edicion" | "medio"; archivo: string; nombre: string }) {
  const router = useRouter();
  const [cargando, setCargando] = useState(false);
  const [hecho, setHecho] = useState<string | null>(null);

  async function recuperar() {
    setCargando(true);
    try {
      const res = await fetch("/api/admin/papelera", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ tipo, archivo }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setHecho(tipo === "edicion" ? `Recuperada como ${json.id}.json` : `Recuperada en ${json.src}`);
      router.refresh();
    } catch (e) {
      window.alert(`No se pudo recuperar «${nombre}»: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setCargando(false);
    }
  }

  if (hecho) return <span className="font-sans text-xs font-bold text-terracota">✓ {hecho}</span>;
  return (
    <button
      type="button"
      onClick={recuperar}
      disabled={cargando}
      className="font-sans border border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-paper disabled:opacity-50"
    >
      {cargando ? "Recuperando…" : "↺ Recuperar"}
    </button>
  );
}
