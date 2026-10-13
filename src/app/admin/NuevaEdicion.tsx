"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Campo, Texto, btnCls, inputCls } from "@/components/admin/campos";

export default function NuevaEdicion({
  sugerido,
  existentes,
}: {
  sugerido: { id: string; fecha: string };
  existentes: { id: string; tema?: string }[];
}) {
  const router = useRouter();
  const [id, setId] = useState(sugerido.id);
  const [fecha, setFecha] = useState(sugerido.fecha);
  const [tema, setTema] = useState("");
  const [base, setBase] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/admin/ediciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, fecha, tema, duplicarDe: base || undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      router.push(`/admin/${json.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo crear");
      setCargando(false);
    }
  }

  return (
    <form onSubmit={crear} className="space-y-4 border border-ink/30 bg-white/40 p-5">
      <h2 className="font-display text-2xl font-black">Nueva edición</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <Texto label="Identificador (nombre del archivo)" value={id} onChange={setId} hint="Letras, números, - y _. Será la URL: /ediciones/…" />
        <Campo label="Fecha de la edición">
          <input type="date" required className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Texto label="Tema del número" value={tema} onChange={setTema} />
        <Campo label="Empezar a partir de" className="sm:col-span-2" hint="Copia las páginas de otra edición como punto de partida.">
          <select className={inputCls} value={base} onChange={(e) => setBase(e.target.value)}>
            <option value="">Edición en blanco (una página vacía)</option>
            {existentes.map((x) => (
              <option key={x.id} value={x.id}>
                Copia de {x.id}
                {x.tema ? ` — ${x.tema}` : ""}
              </option>
            ))}
          </select>
        </Campo>
      </div>
      {error && <p role="alert" className="font-sans text-sm font-bold text-terracota">{error}</p>}
      <button
        type="submit"
        disabled={cargando || !id || !tema}
        className={`${btnCls} !bg-ink !px-4 !py-2 !text-paper hover:!bg-terracota disabled:!opacity-40`}
      >
        {cargando ? "Creando…" : "Crear edición (como borrador)"}
      </button>
      <p className="font-sans text-xs text-ink-soft">El número de edición es automático: se asigna al publicar, a continuación de la última publicada.</p>
    </form>
  );
}
