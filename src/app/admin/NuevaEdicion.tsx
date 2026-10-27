"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Campo, Texto, btnCls, inputCls } from "@/components/admin/campos";
import { SECCIONES_ASISTENTE } from "@/lib/asistente-edicion";
import { mensajeSimple } from "@/lib/errores-simples";

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
  /** Asistente opcional: arma la edición con las secciones elegidas (cada una, una página de plantilla). */
  const [asistente, setAsistente] = useState(false);
  const [secciones, setSecciones] = useState<string[]>(SECCIONES_ASISTENTE.filter((x) => x.porDefecto).map((x) => x.id));
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
        body: JSON.stringify({ id, fecha, tema, duplicarDe: asistente ? undefined : base || undefined, secciones: asistente ? secciones : undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      router.push(`/admin/${json.id}`);
    } catch (err) {
      setError(mensajeSimple(err, "No se pudo crear"));
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
        {!asistente && (
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
        )}
      </div>
      <div className="border border-ink/20 bg-paper-deep/50 p-3">
        <label className="font-sans flex cursor-pointer items-start gap-2 text-sm font-bold">
          <input type="checkbox" className="mt-1" checked={asistente} onChange={(e) => setAsistente(e.target.checked)} />
          <span>
            ✨ Usar el asistente (opcional)
            <span className="block text-xs font-normal text-ink-soft">Elige qué páginas lleva la edición y se arman solas con plantillas; después solo cambias los textos y las fotos.</span>
          </span>
        </label>
        {asistente && (
          <fieldset className="mt-3">
            <legend className="font-sans text-xs font-bold uppercase tracking-wider text-ink-soft">¿Qué páginas lleva? (van en este orden)</legend>
            <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {SECCIONES_ASISTENTE.map((x) => (
                <li key={x.id}>
                  <label className="font-sans flex cursor-pointer items-start gap-2 rounded border border-ink/20 bg-white/60 p-2 text-sm hover:bg-white">
                    <input type="checkbox" className="mt-0.5" checked={secciones.includes(x.id)} onChange={(e) => setSecciones((s) => (e.target.checked ? [...s, x.id] : s.filter((y) => y !== x.id)))} />
                    <span>
                      <strong>{x.titulo}</strong>
                      <span className="block text-xs text-ink-soft">{x.descripcion}</span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
            <p className="font-sans mt-2 text-xs text-ink-soft">Luego puedes agregar, quitar o cambiar de lugar cualquier página en el editor. La página «Contenido» se genera desde Archivo → Generar el índice.</p>
          </fieldset>
        )}
      </div>
      {error && <p role="alert" className="font-sans text-sm font-bold text-terracota">{error}</p>}
      <button
        type="submit"
        disabled={cargando || !id || !tema || (asistente && secciones.length === 0)}
        className={`${btnCls} !bg-ink !px-4 !py-2 !text-paper hover:!bg-terracota disabled:!opacity-40`}
      >
        {cargando ? "Creando…" : "Crear edición (como borrador)"}
      </button>
      <p className="font-sans text-xs text-ink-soft">El número de edición es automático: se asigna al publicar, a continuación de la última publicada.</p>
    </form>
  );
}
