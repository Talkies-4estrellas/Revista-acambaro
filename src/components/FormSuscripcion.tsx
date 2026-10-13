"use client";

import { useId, useState } from "react";

/** Formulario de alta al newsletter (lo usan el bloque "suscripción" y la página /suscribirse). */
export default function FormSuscripcion({ className = "" }: { className?: string }) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [web, setWeb] = useState("");
  const [estado, setEstado] = useState<{ tipo: "idle" | "cargando" | "ok" | "error"; msg?: string }>({ tipo: "idle" });

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setEstado({ tipo: "cargando" });
    try {
      const r = await fetch("/api/suscribir", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, web }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "No se pudo suscribir.");
      setEstado({ tipo: "ok" });
      setEmail("");
    } catch (err) {
      setEstado({ tipo: "error", msg: err instanceof Error ? err.message : "No se pudo suscribir." });
    }
  }

  if (estado.tipo === "ok")
    return (
      <p role="status" className={`font-display text-xl font-bold ${className}`}>
        ¡Listo! Recibirás la próxima edición en tu correo.
      </p>
    );

  return (
    <form onSubmit={enviar} className={`flex flex-col gap-2 sm:flex-row ${className}`} noValidate>
      <label htmlFor={id} className="sr-only">
        Correo electrónico
      </label>
      <input
        id={id}
        type="email"
        required
        autoComplete="email"
        placeholder="tu@correo.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="font-sans min-w-0 flex-1 border border-ink bg-paper px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-terracota"
      />
      {/* Campo trampa contra bots: oculto para personas. */}
      <input
        type="text"
        name="web"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        value={web}
        onChange={(e) => setWeb(e.target.value)}
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />
      <button
        type="submit"
        disabled={estado.tipo === "cargando"}
        className="kicker bg-ink px-6 py-3 text-paper hover:bg-terracota disabled:opacity-50"
      >
        {estado.tipo === "cargando" ? "Enviando…" : "Suscribirme"}
      </button>
      {estado.tipo === "error" && (
        <p role="alert" className="font-sans basis-full text-sm font-bold text-terracota">
          {estado.msg}
        </p>
      )}
    </form>
  );
}
