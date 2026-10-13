"use client";

import { useState } from "react";

/** La baja requiere un clic (no se hace con solo abrir el enlace, para que los antivirus de correo no den de baja a nadie). */
export default function BotonBaja({ token }: { token: string }) {
  const [estado, setEstado] = useState<"idle" | "cargando" | "ok" | "no" | "error">("idle");

  async function baja() {
    setEstado("cargando");
    try {
      const r = await fetch("/api/baja", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token }),
      });
      const d = await r.json();
      setEstado(!r.ok ? "error" : d.ok ? "ok" : "no");
    } catch {
      setEstado("error");
    }
  }

  if (estado === "ok") return <p role="status" className="mt-4 text-lg">Listo, ya no recibirás más correos.</p>;
  if (estado === "no") return <p role="status" className="mt-4 text-ink-soft">Este correo ya no estaba suscrito.</p>;
  return (
    <div className="mt-4">
      <p className="text-ink-soft">¿Quieres dejar de recibir la revista por correo?</p>
      <button
        type="button"
        onClick={baja}
        disabled={estado === "cargando"}
        className="kicker mt-5 bg-ink px-6 py-3 text-paper hover:bg-terracota disabled:opacity-50"
      >
        {estado === "cargando" ? "Procesando…" : "Confirmar baja"}
      </button>
      {estado === "error" && <p role="alert" className="font-sans mt-3 text-sm font-bold text-terracota">No se pudo procesar. Inténtalo más tarde.</p>}
    </div>
  );
}
