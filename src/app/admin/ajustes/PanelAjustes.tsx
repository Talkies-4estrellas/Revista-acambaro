"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type FilaAjuste = {
  clave: string;
  nombre: string;
  ayuda: string;
  ejemplo: string;
  editable: boolean;
  ocultar: boolean;
  donde: string;
  /** Valor actual (vacío en los ocultos: no se mandan al navegador). */
  valor: string;
  /** Lo que se muestra del valor actual. */
  resumen: string;
  definida: boolean;
  pendiente: boolean;
};

/** Cada ajuste con su estado, para qué sirve, su caja para cambiarlo (si es seguro) y «Copiar para Vercel». */
export default function PanelAjustes({ filas }: { filas: FilaAjuste[] }) {
  const router = useRouter();
  const [valores, setValores] = useState<Record<string, string>>(() => Object.fromEntries(filas.map((f) => [f.clave, f.valor])));
  const [guardando, setGuardando] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState<{ clave: string; texto: string; error?: boolean } | null>(null);

  async function guardar(f: FilaAjuste, valor: string) {
    setGuardando(f.clave);
    setMensaje(null);
    try {
      const res = await fetch("/api/admin/ajustes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cambios: { [f.clave]: valor } }) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setMensaje({ clave: f.clave, texto: valor ? "Guardado en .env.local." : "Quitado de .env.local." });
      if (f.ocultar) setValores((v) => ({ ...v, [f.clave]: "" }));
      router.refresh();
    } catch (e) {
      setMensaje({ clave: f.clave, texto: e instanceof Error ? e.message : String(e), error: true });
    } finally {
      setGuardando(null);
    }
  }

  const copiar = (f: FilaAjuste) => {
    const v = valores[f.clave] || (f.ocultar ? "" : f.valor);
    if (!v) {
      setMensaje({ clave: f.clave, texto: f.ocultar ? "Por seguridad, escribe el valor en la caja para copiarlo." : "No hay valor que copiar.", error: true });
      return;
    }
    navigator.clipboard?.writeText(v).then(() => setMensaje({ clave: f.clave, texto: `Copiado: pégalo en Vercel como ${f.clave}.` }));
  };

  const btn = "font-sans px-3 py-1.5 text-xs font-bold uppercase tracking-wider";
  const pendientes = filas.filter((f) => f.pendiente);
  return (
    <>
      {pendientes.length > 0 && (
        <p className="font-sans mt-6 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
          <b>Reinicia el servidor</b> (detén y vuelve a correr <code>npm run dev</code>) para que la revista use los cambios de:{" "}
          {pendientes.map((f) => f.nombre).join(", ")}.
        </p>
      )}
      <ul className="mt-6 space-y-4">
        {filas.map((f) => {
          const cambiado = (valores[f.clave] ?? "") !== (f.ocultar ? "" : f.valor);
          return (
            <li key={f.clave} className="rounded-xl border border-ink/15 p-5">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-xl font-black">{f.nombre}</h2>
                  <p className="font-sans text-xs text-ink-soft">
                    <code>{f.clave}</code> · {f.donde}
                  </p>
                </div>
                <span
                  className={`font-sans rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${f.definida ? "bg-terracota/15 text-terracota" : f.editable ? "bg-amber-500/15 text-amber-800 dark:text-amber-300" : "bg-ink/10 text-ink-soft"}`}
                >
                  {f.definida ? "Definida" : f.editable ? "Falta" : "Sin definir"}
                </span>
              </div>
              <p className="font-sans mt-2 text-sm text-ink-soft">{f.ayuda}</p>
              {f.definida && (
                <p className="font-sans mt-2 break-all text-xs">
                  Ahora: <code>{f.resumen}</code>
                  {f.ocultar && <span className="text-ink-soft"> (no se muestra completa)</span>}
                </p>
              )}
              {f.editable ? (
                <form
                  className="mt-3 flex flex-wrap items-center gap-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    guardar(f, valores[f.clave] ?? "");
                  }}
                >
                  <input
                    value={valores[f.clave] ?? ""}
                    onChange={(e) => setValores((v) => ({ ...v, [f.clave]: e.target.value }))}
                    placeholder={f.ocultar && f.definida ? "Escribe una nueva para cambiarla" : f.ejemplo}
                    aria-label={f.nombre}
                    spellCheck={false}
                    className="font-sans min-w-[16rem] flex-1 rounded border border-ink/30 bg-paper px-3 py-2 text-sm"
                  />
                  <button type="submit" disabled={guardando === f.clave || !cambiado || (f.ocultar && !valores[f.clave])} className={`${btn} bg-ink text-paper hover:bg-terracota disabled:opacity-40`}>
                    {guardando === f.clave ? "Guardando…" : "Guardar"}
                  </button>
                  {f.definida && (
                    <button
                      type="button"
                      disabled={guardando === f.clave}
                      onClick={() => window.confirm(`¿Quitar «${f.nombre}» de .env.local?`) && guardar(f, "")}
                      className={`${btn} border border-ink/30 text-ink-soft hover:border-ink hover:text-ink`}
                    >
                      Quitar
                    </button>
                  )}
                  <button type="button" onClick={() => copiar(f)} className={`${btn} border border-ink hover:bg-ink hover:text-paper`}>
                    Copiar para Vercel
                  </button>
                </form>
              ) : (
                <p className="font-sans mt-3 text-xs text-ink-soft">
                  Solo lectura: por seguridad se cambia a mano en <code>.env.local</code>.
                </p>
              )}
              {mensaje?.clave === f.clave && (
                <p className={`font-sans mt-2 text-xs font-bold ${mensaje.error ? "text-red-700 dark:text-red-300" : "text-terracota"}`} aria-live="polite">
                  {mensaje.texto}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
