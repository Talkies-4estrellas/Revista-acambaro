"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export type SeccionRapida = { texto: string; grupo: string; href: string; externo?: boolean };
type EdicionRapida = { id: string; numero: string | null; tema: string; paginas: string[] };
type Resultado = { clave: string; texto: string; nota: string; href: string; externo?: boolean };

const MAX_RESULTADOS = 12;
const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

/**
 * Buscador rápido del panel: Ctrl+K (o Cmd+K) abre una caja para saltar a cualquier sección, edición o página escribiendo, sin
 * usar el ratón. Las ediciones se piden la primera vez que se abre y se vuelven a pedir en cada apertura (pueden haber cambiado).
 */
export default function BuscadorRapido({ secciones, alIr }: { secciones: SeccionRapida[]; alIr: (href: string) => void }) {
  const router = useRouter();
  const [abierto, setAbierto] = useState(false);
  const [consulta, setConsulta] = useState("");
  const [ediciones, setEdiciones] = useState<EdicionRapida[]>([]);
  const [error, setError] = useState(false);
  const [elegido, setElegido] = useState(0);
  const caja = useRef<HTMLInputElement>(null);
  const lista = useRef<HTMLUListElement>(null);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey && e.key.toLowerCase() === "k") {
        e.preventDefault(); // en el navegador, Ctrl+K llevaría a la barra de direcciones
        setAbierto((v) => !v);
      }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  useEffect(() => {
    if (!abierto) return;
    setConsulta("");
    setElegido(0);
    setError(false);
    caja.current?.focus();
    fetch("/api/admin/rapido")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((j) => setEdiciones(j.ediciones ?? []))
      .catch(() => setError(true));
  }, [abierto]);

  const resultados = useMemo<Resultado[]>(() => {
    const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
    const coincide = (t: string) => palabras.every((p) => normalizar(t).includes(p));
    const deSeccion = secciones.filter((s) => coincide(`${s.grupo} ${s.texto}`)).map((s) => ({ clave: `s-${s.href}`, texto: s.texto, nota: s.grupo, href: s.href, externo: s.externo }));
    if (palabras.length === 0) return deSeccion.slice(0, MAX_RESULTADOS);

    // Un número solo («57», «n 57») va primero a esa edición.
    const num = /^(?:n\.?º?\s*)?(\d{1,4})$/i.exec(consulta.trim())?.[1];
    const deEdicion = ediciones
      .filter((e) => coincide(`${e.tema} ${e.id} ${e.numero ?? ""}`))
      .sort((a, b) => Number(!!num && Number(b.numero) === Number(num)) - Number(!!num && Number(a.numero) === Number(num)))
      .map((e) => ({ clave: `e-${e.id}`, texto: e.tema, nota: e.numero ? `Edición N.º ${e.numero}` : "Muestra", href: `/admin/${e.id}` }));
    const dePagina = ediciones.flatMap((e) =>
      e.paginas.flatMap((t, i) => (t && coincide(t) ? [{ clave: `p-${e.id}-${i}`, texto: t, nota: `Página ${i + 1} · ${e.numero ? `N.º ${e.numero} · ` : ""}${e.tema}`, href: `/admin/${e.id}#p=${i + 1}` }] : [])),
    );
    return [...deEdicion, ...deSeccion, ...dePagina].slice(0, MAX_RESULTADOS);
  }, [consulta, ediciones, secciones]);

  useEffect(() => setElegido(0), [consulta]);
  useEffect(() => {
    lista.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest" });
  }, [elegido]);

  function ir(r: Resultado) {
    setAbierto(false);
    if (r.externo) {
      window.open(r.href, "_blank", "noreferrer");
      return;
    }
    router.push(r.href);
    alIr(r.href);
  }

  function teclas(e: React.KeyboardEvent) {
    if (e.key === "Escape") setAbierto(false);
    else if (e.key === "ArrowDown") {
      e.preventDefault();
      setElegido((n) => Math.min(n + 1, resultados.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setElegido((n) => Math.max(n - 1, 0));
    } else if (e.key === "Enter" && resultados[elegido]) {
      e.preventDefault();
      ir(resultados[elegido]);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setAbierto(true)}
        className="font-sans hidden items-center gap-2 rounded-lg border border-ink/20 px-3 py-1.5 text-sm text-ink-soft hover:border-ink hover:text-ink sm:inline-flex"
      >
        <span aria-hidden>⌕</span> Ir a…
        <kbd className="rounded bg-ink/[0.08] px-1.5 py-0.5 text-[0.7rem] font-bold">Ctrl K</kbd>
      </button>

      {abierto && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 px-4 pt-[12vh]" onMouseDown={(e) => e.target === e.currentTarget && setAbierto(false)}>
          <div role="dialog" aria-modal="true" aria-label="Buscador rápido" className="w-full max-w-xl overflow-hidden rounded-xl border border-ink/20 bg-paper shadow-2xl">
            <input
              ref={caja}
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              onKeyDown={teclas}
              role="combobox"
              aria-expanded="true"
              aria-controls="rapido-lista"
              aria-activedescendant={resultados[elegido] ? `rapido-${elegido}` : undefined}
              placeholder="Edición, número, título de una página o sección…"
              className="font-sans w-full border-b border-ink/15 bg-transparent px-4 py-3.5 text-base outline-none"
            />
            <ul ref={lista} id="rapido-lista" role="listbox" aria-label="Resultados" className="max-h-[50vh] overflow-y-auto p-2">
              {resultados.map((r, i) => (
                <li
                  key={r.clave}
                  id={`rapido-${i}`}
                  role="option"
                  aria-selected={i === elegido}
                  onMouseMove={() => setElegido(i)}
                  onClick={() => ir(r)}
                  className={`font-sans cursor-pointer rounded-lg px-3 py-2 ${i === elegido ? "bg-ink text-paper" : ""}`}
                >
                  <span className="block truncate text-sm font-semibold">
                    {r.texto}
                    {r.externo ? " ↗" : ""}
                  </span>
                  <span className={`block truncate text-xs ${i === elegido ? "text-paper/75" : "text-ink-soft"}`}>{r.nota}</span>
                </li>
              ))}
              {resultados.length === 0 && <li className="font-sans px-3 py-6 text-center text-sm text-ink-soft">{error ? "No se pudieron cargar las ediciones." : "Nada coincide."}</li>}
            </ul>
            <p className="font-sans border-t border-ink/15 px-4 py-2 text-[0.7rem] text-ink-soft">↑ ↓ para moverte · Enter para abrir · Esc para cerrar</p>
          </div>
        </div>
      )}
    </>
  );
}
