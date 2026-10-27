"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Campo, Texto, btnCls, inputCls } from "@/components/admin/campos";
import { anunciosSeguidos } from "@/lib/esquema";
import { mensajeSimple } from "@/lib/errores-simples";

type Origen = { id: string; tema?: string; paginas: { titulo?: string; seccion?: string }[] };

/** Arma una edición resumida eligiendo (y ordenando) páginas de otra. El índice, la portada y los enlaces se ajustan solos. */
export default function ResumenEdicion({ origenes, sugerido }: { origenes: Origen[]; sugerido: { id: string; fecha: string } }) {
  const [origenId, setOrigenId] = useState(origenes[0]?.id ?? "");
  const origen = origenes.find((o) => o.id === origenId);
  const [sel, setSel] = useState<number[]>([]);
  const [id, setId] = useState(sugerido.id);
  const [fecha, setFecha] = useState(sugerido.fecha);
  const [tema, setTema] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [listo, setListo] = useState<{ id: string; avisos: string[] } | null>(null);

  const paginas = origen?.paginas ?? [];
  const secciones = useMemo(() => {
    const m = new Map<string, number[]>();
    paginas.forEach((p, i) => {
      const s = p.seccion ?? "(sin sección)";
      m.set(s, [...(m.get(s) ?? []), i]);
    });
    return [...m.entries()];
  }, [paginas]);
  const seleccionadas = new Set(sel);
  const seguidos = useMemo(() => anunciosSeguidos(sel.map((i) => ({ seccion: paginas[i]?.seccion }))), [sel, paginas]);

  const cambiarOrigen = (v: string) => {
    setOrigenId(v);
    setSel([]);
  };
  const alternar = (i: number) => setSel((s) => (s.includes(i) ? s.filter((x) => x !== i) : [...s, i].sort((a, b) => a - b)));
  const alternarSeccion = (indices: number[]) =>
    setSel((s) => (indices.every((i) => s.includes(i)) ? s.filter((x) => !indices.includes(x)) : [...new Set([...s, ...indices])].sort((a, b) => a - b)));
  const mover = (k: number, d: -1 | 1) =>
    setSel((s) => {
      const j = k + d;
      if (j < 0 || j >= s.length) return s;
      const c = [...s];
      [c[k], c[j]] = [c[j], c[k]];
      return c;
    });

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCargando(true);
    try {
      const res = await fetch("/api/admin/ediciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, fecha, tema, resumen: { origen: origenId, paginas: sel } }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setListo({ id: json.id, avisos: json.avisos ?? [] });
    } catch (err) {
      setError(mensajeSimple(err, "No se pudo crear"));
    } finally {
      setCargando(false);
    }
  }

  if (origenes.length === 0) return null;

  if (listo) {
    return (
      <section className="space-y-3 border border-ink/30 bg-white/40 p-5 dark:bg-white/5">
        <h2 className="font-display text-2xl font-black">Edición resumida creada</h2>
        <p className="font-sans text-sm">
          Se creó <strong>{listo.id}</strong> como borrador con {sel.length} página(s).
        </p>
        {listo.avisos.length > 0 && (
          <ul className="font-sans list-disc space-y-1 pl-5 text-xs text-ink-soft">
            {listo.avisos.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        )}
        <Link href={`/admin/${listo.id}`} className={`${btnCls} inline-block !bg-ink !px-4 !py-2 !text-paper`}>
          Abrir en el editor →
        </Link>
      </section>
    );
  }

  return (
    <form onSubmit={crear} className="space-y-4 border border-ink/30 bg-white/40 p-5 dark:bg-white/5">
      <div>
        <h2 className="font-display text-2xl font-black">Armar edición resumida</h2>
        <p className="font-sans mt-1 text-xs text-ink-soft">
          Elige páginas de una edición y su orden. El índice, la portada y los enlaces se ajustan solos: se quitan las entradas de páginas que no incluyas y los números se
          corrigen. Se crea como borrador.
        </p>
      </div>

      <Campo label="Tomar páginas de">
        <select className={inputCls} value={origenId} onChange={(e) => cambiarOrigen(e.target.value)}>
          {origenes.map((o) => (
            <option key={o.id} value={o.id}>
              {o.id}
              {o.tema ? ` — ${o.tema}` : ""} ({o.paginas.length} páginas)
            </option>
          ))}
        </select>
      </Campo>

      <div>
        <p className="font-sans mb-1 text-xs font-bold uppercase tracking-wider text-ink-soft">Atajos por sección (marcan o quitan todas sus páginas)</p>
        <div className="flex flex-wrap gap-2">
          {secciones.map(([nombre, indices]) => {
            const todas = indices.every((i) => seleccionadas.has(i));
            return (
              <button key={nombre} type="button" aria-pressed={todas} onClick={() => alternarSeccion(indices)} className={`${btnCls} ${todas ? "!bg-ink !text-paper" : ""}`}>
                {nombre} ({indices.length})
              </button>
            );
          })}
          <button type="button" className={btnCls} onClick={() => setSel(paginas.map((_, i) => i))}>Todas</button>
          <button type="button" className={btnCls} onClick={() => setSel([])}>Ninguna</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="min-w-0">
          <p className="font-sans mb-1 text-xs font-bold uppercase tracking-wider text-ink-soft">Páginas de la edición</p>
          <ul className="max-h-96 space-y-px overflow-y-auto border border-ink/20 bg-paper">
            {paginas.map((p, i) => (
              <li key={i}>
                <label className="font-sans flex cursor-pointer items-center gap-2 px-2 py-1 text-xs hover:bg-paper-deep">
                  <input type="checkbox" checked={seleccionadas.has(i)} onChange={() => alternar(i)} />
                  <span className="w-6 shrink-0 text-right font-bold text-ink-soft">{i + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{p.titulo ?? "(sin título)"}</span>
                  {p.seccion && <span className="shrink-0 text-[0.65rem] text-ink-soft">{p.seccion}</span>}
                </label>
              </li>
            ))}
          </ul>
        </div>
        <div className="min-w-0">
          <p className="font-sans mb-1 text-xs font-bold uppercase tracking-wider text-ink-soft">
            En el resumen · {sel.length} página(s)
            {seguidos.length > 0 && <span className="ml-2 normal-case text-terracota"> · hay anuncios seguidos (págs. {seguidos.join(", ")})</span>}
          </p>
          <ol className="max-h-96 space-y-px overflow-y-auto border border-ink/20 bg-paper">
            {sel.length === 0 && <li className="font-sans px-2 py-2 text-xs italic text-ink-soft">Marca páginas a la izquierda o usa un atajo.</li>}
            {sel.map((i, k) => (
              <li key={i} className="font-sans flex items-center gap-2 px-2 py-1 text-xs">
                <span className="w-6 shrink-0 text-right font-bold text-terracota">{k + 1}</span>
                <span className="min-w-0 flex-1 truncate">
                  {paginas[i]?.titulo ?? "(sin título)"} <span className="text-ink-soft">· era la {i + 1}</span>
                </span>
                <button type="button" className={`${btnCls} !px-1.5 !py-0`} onClick={() => mover(k, -1)} disabled={k === 0} aria-label="Subir">↑</button>
                <button type="button" className={`${btnCls} !px-1.5 !py-0`} onClick={() => mover(k, 1)} disabled={k === sel.length - 1} aria-label="Bajar">↓</button>
                <button type="button" className={`${btnCls} !px-1.5 !py-0`} onClick={() => alternar(i)} aria-label="Quitar">✕</button>
              </li>
            ))}
          </ol>
          {sel.length > 0 && (
            <button type="button" className={`${btnCls} mt-2`} onClick={() => setSel([...sel].sort((a, b) => a - b))}>
              Volver al orden original
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Texto label="Identificador (nombre del archivo)" value={id} onChange={setId} hint="Letras, números, - y _." />
        <Campo label="Fecha de la edición">
          <input type="date" required className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Texto label="Tema del número" value={tema} onChange={setTema} />
      </div>
      {error && <p role="alert" className="font-sans text-sm font-bold text-terracota">{error}</p>}
      <button
        type="submit"
        disabled={cargando || !id || !tema || sel.length === 0}
        className={`${btnCls} !bg-ink !px-4 !py-2 !text-paper hover:!bg-terracota disabled:!opacity-40`}
      >
        {cargando ? "Creando…" : `Crear edición resumida (${sel.length} páginas, como borrador)`}
      </button>
    </form>
  );
}
