"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AMBITOS, OPCIONES_INICIALES, buscarEnEdicion, reemplazarEnEdicion, type Ambito, type OpcionesBuscar } from "@/lib/buscar-reemplazar";
import type { EdicionDatos } from "@/lib/esquema";
import { btnCls, inputCls } from "./campos";

const etiquetaPagina = (n: number) => (n === -1 ? "Datos de la edición" : n === 0 ? "Elementos repetidos" : `Página ${n}`);

/**
 * Buscar y reemplazar en toda la edición: textos, títulos, enlaces, descripciones y créditos. Muestra cada lugar donde aparece lo buscado
 * (con lo que cambiaría), deja desmarcar los que no se quieren tocar y reemplaza solo los marcados. El cambio queda en el editor sin guardar
 * (se guarda con Guardar o con el autoguardado) y se puede deshacer de un paso mientras no se haga otro.
 */
export default function BuscarReemplazar({
  datos,
  paginas,
  ultimo,
  onAplicar,
  onDeshacer,
  onIr,
  onCerrar,
}: {
  datos: EdicionDatos;
  /** Título de cada página, para rotular los resultados. */
  paginas: string[];
  /** El último reemplazo hecho (para ofrecer deshacerlo). */
  ultimo: { resumen: string } | null;
  onAplicar: (nuevos: EdicionDatos, resumen: string) => void;
  onDeshacer: () => void;
  /** Lleva a una página (número desde 1), o a los datos de la edición (-1). */
  onIr: (pagina: number) => void;
  onCerrar: () => void;
}) {
  const [op, setOp] = useState<OpcionesBuscar>(OPCIONES_INICIALES);
  const [desmarcadas, setDesmarcadas] = useState<Set<string>>(new Set());
  const [mensaje, setMensaje] = useState("");
  const entrada = useRef<HTMLInputElement>(null);
  useEffect(() => entrada.current?.focus(), []);

  const resultados = useMemo(() => buscarEnEdicion(datos, op), [datos, op]);
  const marcadas = resultados.filter((r) => !desmarcadas.has(r.clave));
  const totalVeces = marcadas.reduce((s, r) => s + r.veces, 0);
  const porPagina = useMemo(() => {
    const mapa = new Map<number, typeof resultados>();
    for (const r of resultados) mapa.set(r.pagina, [...(mapa.get(r.pagina) ?? []), r]);
    return [...mapa.entries()].sort((a, b) => a[0] - b[0]);
  }, [resultados]);

  const cambiar = (patch: Partial<OpcionesBuscar>) => {
    setOp((o) => ({ ...o, ...patch }));
    setMensaje("");
  };
  const alternar = (clave: string) =>
    setDesmarcadas((d) => {
      const n = new Set(d);
      if (n.has(clave)) n.delete(clave);
      else n.add(clave);
      return n;
    });

  function reemplazar() {
    const r = reemplazarEnEdicion(datos, op, new Set(marcadas.map((m) => m.clave)));
    if (r.reemplazos === 0) {
      setMensaje(r.omitidos ? `No se reemplazó nada: ${r.omitidos} enlace(s) dejarían de ser válidos.` : "No había nada que reemplazar.");
      return;
    }
    const resumen = `«${op.buscar}» → «${op.reemplazo}»: ${r.reemplazos} reemplazo${r.reemplazos === 1 ? "" : "s"} en ${r.campos} lugar${r.campos === 1 ? "" : "es"}`;
    onAplicar(r.datos, resumen);
    setDesmarcadas(new Set());
    setMensaje(`${resumen}.${r.omitidos ? ` Se omitieron ${r.omitidos} enlace(s) que habrían quedado inválidos.` : ""} Guarda para conservarlo.`);
  }

  const casilla = "h-3.5 w-3.5 accent-[#068562]";

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div role="dialog" aria-modal="true" aria-label="Buscar y reemplazar" className="w-full max-w-3xl border-2 border-ink bg-paper shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-ink/30 bg-paper-deep px-5 py-3">
          <h2 className="font-display text-2xl font-black">Buscar y reemplazar</h2>
          <button type="button" className={btnCls} onClick={onCerrar}>
            ✕ Cerrar
          </button>
        </header>

        <section className="space-y-3 border-b border-ink/20 px-5 py-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="font-sans mb-1 block text-[0.72rem] font-bold uppercase tracking-wide text-ink-soft">Buscar</span>
              <input ref={entrada} className={inputCls} value={op.buscar} onChange={(e) => cambiar({ buscar: e.target.value })} placeholder="Texto, teléfono, dirección…" />
            </label>
            <label className="block">
              <span className="font-sans mb-1 block text-[0.72rem] font-bold uppercase tracking-wide text-ink-soft">Reemplazar con</span>
              <input className={inputCls} value={op.reemplazo} onChange={(e) => cambiar({ reemplazo: e.target.value })} placeholder="(vacío = borrar lo encontrado)" />
            </label>
          </div>
          <div className="font-sans flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <label className="flex items-center gap-1.5">
              <input type="checkbox" className={casilla} checked={op.mayusculas} onChange={(e) => cambiar({ mayusculas: e.target.checked })} />
              Distinguir mayúsculas
            </label>
            <label className="flex items-center gap-1.5">
              <input type="checkbox" className={casilla} checked={op.palabra} onChange={(e) => cambiar({ palabra: e.target.checked })} />
              Solo palabras completas
            </label>
          </div>
          <div className="font-sans flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            <span className="font-bold uppercase tracking-wide text-ink-soft">Buscar en:</span>
            {AMBITOS.map((a) => (
              <label key={a.id} className="flex items-center gap-1.5">
                <input type="checkbox" className={casilla} checked={op.en[a.id as Ambito]} onChange={(e) => cambiar({ en: { ...op.en, [a.id]: e.target.checked } })} />
                {a.nombre}
              </label>
            ))}
          </div>
        </section>

        {ultimo && (
          <p className="font-sans flex flex-wrap items-center gap-3 border-b border-ink/20 bg-oliva/10 px-5 py-2 text-xs">
            <span className="min-w-0 flex-1">Último reemplazo: {ultimo.resumen}.</span>
            <button type="button" className={btnCls} onClick={() => { onDeshacer(); setMensaje("Reemplazo deshecho."); }}>
              ↶ Deshacer
            </button>
          </p>
        )}

        <section className="px-5 py-4">
          {mensaje && (
            <p role="status" className="font-sans mb-3 border-l-4 border-oliva bg-oliva/10 px-3 py-1.5 text-xs">
              {mensaje}
            </p>
          )}
          {op.buscar === "" ? (
            <p className="font-sans text-sm italic text-ink-soft">Escribe lo que buscas. Se revisan todas las páginas y los elementos que se repiten.</p>
          ) : resultados.length === 0 ? (
            <p className="font-sans text-sm italic text-ink-soft">No se encontró «{op.buscar}».</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center gap-3">
                <p className="font-sans text-xs font-bold uppercase tracking-wider text-ink-soft">
                  {resultados.length} lugar(es) · {totalVeces} coincidencia(s) marcada(s)
                </p>
                <button type="button" className={btnCls} onClick={() => setDesmarcadas(new Set())}>
                  Marcar todos
                </button>
                <button type="button" className={btnCls} onClick={() => setDesmarcadas(new Set(resultados.map((r) => r.clave)))}>
                  Desmarcar todos
                </button>
                <button type="button" className={`${btnCls} ml-auto !bg-ink !px-4 !text-paper`} disabled={marcadas.length === 0} onClick={reemplazar}>
                  Reemplazar {marcadas.length === resultados.length ? "todo" : `${marcadas.length} marcado(s)`} ({totalVeces})
                </button>
              </div>
              <div className="space-y-4">
                {porPagina.map(([pagina, lista]) => (
                  <div key={pagina}>
                    <p className="font-sans mb-1 flex items-center gap-2 text-xs font-bold">
                      {etiquetaPagina(pagina)}
                      {pagina > 0 && <span className="font-normal text-ink-soft">· {paginas[pagina - 1] ?? ""}</span>}
                      {pagina !== 0 && (
                        <button type="button" className="font-bold text-terracota hover:underline" onClick={() => { onIr(pagina); onCerrar(); }}>
                          Ir →
                        </button>
                      )}
                    </p>
                    <ul className="space-y-1">
                      {lista.map((r) => (
                        <li key={r.clave} className="flex items-start gap-2 border border-ink/20 bg-white/50 px-2.5 py-1.5 dark:bg-white/5">
                          <input type="checkbox" className={`${casilla} mt-1`} checked={!desmarcadas.has(r.clave)} onChange={() => alternar(r.clave)} aria-label={`Reemplazar en ${r.tipo}`} />
                          <div className="min-w-0 flex-1">
                            <p className="font-sans text-[0.65rem] font-bold uppercase tracking-wider text-ink-soft">
                              {r.tipo}
                              {r.veces > 1 ? ` · ${r.veces} veces` : ""}
                            </p>
                            <p className="font-sans break-words text-xs">
                              {r.antes}
                              <del className="bg-terracota/20 px-0.5 text-terracota">{r.encontrado}</del>
                              {op.reemplazo !== "" && <ins className="bg-oliva/25 px-0.5 no-underline">{op.reemplazo}</ins>}
                              {r.despues}
                            </p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </div>
    </div>
  );
}
