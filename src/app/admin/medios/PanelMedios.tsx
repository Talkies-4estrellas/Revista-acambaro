"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export type MedioFila = {
  src: string;
  carpeta: string;
  nombre: string;
  bytes: number;
  tipo: "imagen" | "video";
  /** Dónde se usa: ediciones (con enlace al editor) y fuera de ellas (sitio, plantillas, «Mis elementos»). */
  usos: { texto: string; href?: string }[];
};

/** A partir de este peso una foto se marca como pesada (la hoja mide 800 de ancho: casi nunca hace falta más). */
const PESADA = 1024 * 1024;
const peso = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

type Filtro = "todos" | "sinUso" | "pesados";
const FILTROS: { id: Filtro; texto: string; cumple: (m: MedioFila) => boolean }[] = [
  { id: "todos", texto: "Todos", cumple: () => true },
  { id: "sinUso", texto: "Sin uso", cumple: (m) => m.usos.length === 0 },
  { id: "pesados", texto: `Pesados (más de ${peso(PESADA)})`, cumple: (m) => m.bytes > PESADA },
];

export default function PanelMedios({ medios }: { medios: MedioFila[] }) {
  const router = useRouter();
  const params = useSearchParams();
  const f = params.get("f");
  const filtro: Filtro = f === "sinUso" || f === "pesados" ? f : "todos";
  const [consulta, setConsulta] = useState("");
  const [orden, setOrden] = useState<"peso" | "carpeta" | "nombre">("peso");
  const [quitando, setQuitando] = useState<string | null>(null);

  const total = medios.reduce((n, m) => n + m.bytes, 0);
  const sinUso = medios.filter((m) => m.usos.length === 0);
  const pesoSinUso = sinUso.reduce((n, m) => n + m.bytes, 0);
  const pesados = medios.filter((m) => m.bytes > PESADA);

  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  const cumple = FILTROS.find((x) => x.id === filtro)!.cumple;
  const visibles = medios
    .filter((m) => cumple(m) && palabras.every((p) => normalizar(`${m.carpeta} ${m.nombre} ${m.usos.map((u) => u.texto).join(" ")}`).includes(p)))
    .sort((a, b) => (orden === "peso" ? b.bytes - a.bytes : orden === "carpeta" ? a.carpeta.localeCompare(b.carpeta) || a.nombre.localeCompare(b.nombre) : a.nombre.localeCompare(b.nombre)));

  async function quitar(m: MedioFila) {
    if (!window.confirm(`¿Quitar «${m.nombre}» (${peso(m.bytes)})? No lo usa nada; va a la Papelera y se puede recuperar.`)) return;
    setQuitando(m.src);
    try {
      const res = await fetch("/api/admin/medios", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ src: m.src }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      router.refresh();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : String(e));
    } finally {
      setQuitando(null);
    }
  }

  return (
    <>
      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de medios">
        {[
          [String(medios.length), "archivos", peso(total) + " en total"],
          [String(sinUso.length), "sin uso", `${peso(pesoSinUso)} que se pueden liberar`],
          [String(pesados.length), "pesados", `más de ${peso(PESADA)} cada uno`],
          [String(new Set(medios.map((m) => m.carpeta)).size), "carpetas", "una por edición"],
        ].map(([n, t, nota]) => (
          <li key={t} className="rounded-xl border border-ink/15 bg-paper-deep/40 p-4">
            <span className="font-display block text-4xl font-black leading-none text-terracota">{n}</span>
            <span className="font-sans mt-2 block text-sm font-bold">{t}</span>
            <span className="font-sans block text-xs text-ink-soft">{nota}</span>
          </li>
        ))}
      </ul>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <input
          type="search"
          value={consulta}
          onChange={(e) => setConsulta(e.target.value)}
          placeholder="Buscar por nombre, carpeta o edición…"
          aria-label="Buscar medios"
          className="font-sans min-w-[14rem] flex-1 rounded-full border border-ink/25 bg-paper px-4 py-2 text-sm outline-none focus:border-terracota"
        />
        <label className="font-sans flex items-center gap-2 text-xs font-bold">
          Ordenar por
          <select value={orden} onChange={(e) => setOrden(e.target.value as typeof orden)} className="rounded-full border border-ink/25 bg-paper px-3 py-1.5 text-sm font-normal">
            <option value="peso">peso (mayor primero)</option>
            <option value="carpeta">carpeta</option>
            <option value="nombre">nombre</option>
          </select>
        </label>
      </div>
      <div role="group" aria-label="Filtrar medios" className="font-sans mt-3 flex flex-wrap gap-2 text-xs font-bold">
        {FILTROS.map((x) => (
          <button
            key={x.id}
            type="button"
            aria-pressed={filtro === x.id}
            onClick={() => router.replace(x.id === "todos" ? "/admin/medios" : `/admin/medios?f=${x.id}`, { scroll: false })}
            className={`rounded-full border px-3 py-1 ${filtro === x.id ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink"}`}
          >
            {x.texto} <span className="opacity-70">{medios.filter(x.cumple).length}</span>
          </button>
        ))}
      </div>
      <p className="font-sans mt-3 text-xs text-ink-soft" aria-live="polite">
        {visibles.length} {visibles.length === 1 ? "archivo" : "archivos"} · {peso(visibles.reduce((n, m) => n + m.bytes, 0))}
      </p>

      {visibles.length === 0 ? (
        <p className="font-sans mt-6 text-sm italic text-ink-soft">{filtro === "sinUso" ? "Todos los archivos se usan en algún lado." : "Ningún archivo coincide."}</p>
      ) : (
        <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {visibles.map((m) => (
            <li key={m.src} className={`flex flex-col rounded-lg border p-2 ${m.usos.length === 0 ? "border-dashed border-ink/30" : "border-ink/15"}`}>
              <a href={m.src} target="_blank" rel="noreferrer" className="grid aspect-[4/3] place-items-center overflow-hidden rounded bg-ink/[0.06] text-xs text-ink-soft" title="Abrir en otra pestaña">
                {m.tipo === "imagen" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.src} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  "▶ Video"
                )}
              </a>
              <p className="font-sans mt-2 truncate text-xs font-bold" title={m.nombre}>
                {m.nombre}
              </p>
              <p className="font-sans text-[0.7rem] text-ink-soft">
                carpeta {m.carpeta} ·{" "}
                <span className={m.bytes > PESADA ? "font-bold text-amber-700 dark:text-amber-300" : ""}>{peso(m.bytes)}</span>
              </p>
              <div className="font-sans mt-1 flex-1 text-[0.7rem]">
                {m.usos.length === 0 ? (
                  <span className="inline-block rounded-full bg-ink/10 px-2 py-0.5 font-bold text-ink-soft">Sin uso</span>
                ) : (
                  <ul className="space-y-0.5">
                    {m.usos.slice(0, 3).map((u) => (
                      <li key={u.texto} className="truncate" title={u.texto}>
                        {u.href ? (
                          <Link href={u.href} className="text-terracota hover:underline">
                            {u.texto}
                          </Link>
                        ) : (
                          <span className="text-ink-soft">{u.texto}</span>
                        )}
                      </li>
                    ))}
                    {m.usos.length > 3 && <li className="text-ink-soft">y {m.usos.length - 3} más</li>}
                  </ul>
                )}
              </div>
              {m.usos.length === 0 && (
                <button
                  type="button"
                  onClick={() => quitar(m)}
                  disabled={quitando === m.src}
                  className="font-sans mt-2 self-start border border-ink/40 px-2.5 py-1 text-[0.7rem] font-bold uppercase tracking-wider hover:bg-ink hover:text-paper disabled:opacity-50"
                >
                  {quitando === m.src ? "Quitando…" : "Quitar"}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
