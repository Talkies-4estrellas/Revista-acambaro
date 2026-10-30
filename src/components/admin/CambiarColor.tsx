"use client";

import { useEffect, useMemo, useState } from "react";
import { cambiarColor, coloresUsados, type Alcance } from "@/lib/cambiar-color";
import { colorCss, type EdicionDatos } from "@/lib/esquema";
import { btnCls } from "./campos";
import { BotonColor } from "./PaletaColores";

/**
 * Cambiar un color por otro (opcional): se elige un color de los que ya se usan, el color nuevo y si vale para esta página o para toda
 * la edición; antes de aplicar dice cuántos lugares cambiarán. Queda sin guardar y se puede deshacer desde aquí.
 */
export default function CambiarColor({
  datos,
  pagina,
  ultimo,
  onAplicar,
  onDeshacer,
  onCerrar,
}: {
  datos: EdicionDatos;
  /** Página abierta (índice desde 0). */
  pagina: number;
  ultimo: { resumen: string } | null;
  onAplicar: (nuevos: EdicionDatos, resumen: string) => void;
  onDeshacer: () => void;
  onCerrar: () => void;
}) {
  const [soloPagina, setSoloPagina] = useState(false);
  const alcance: Alcance = soloPagina ? { tipo: "pagina", indice: pagina } : { tipo: "edicion" };
  const usados = useMemo(() => coloresUsados(datos, alcance), [datos, soloPagina, pagina]); // eslint-disable-line react-hooks/exhaustive-deps
  const [de, setDe] = useState<string | undefined>(undefined);
  const [a, setA] = useState<string | undefined>(undefined);
  const [mensaje, setMensaje] = useState("");
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => e.key === "Escape" && !document.querySelector("[data-paleta-flotante]") && onCerrar();
    window.addEventListener("keydown", tecla, true); // en captura: se ve si el selector de color sigue abierto antes de que él mismo se cierre
    return () => window.removeEventListener("keydown", tecla, true);
  }, [onCerrar]);
  const origen = de && usados.some((u) => u.color === de.toLowerCase()) ? de.toLowerCase() : undefined;
  const previa = origen && a && origen !== a.toLowerCase() ? cambiarColor(datos, origen, a, alcance).cambios : 0;

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-black/50 p-4" role="dialog" aria-modal="true" aria-label="Cambiar un color por otro" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div className="font-sans mt-10 w-full max-w-lg rounded-lg border border-ink/40 bg-paper p-5 shadow-2xl">
        <div className="mb-3 flex items-center">
          <h2 className="font-display text-2xl font-black">Cambiar un color por otro</h2>
          <button type="button" className={`${btnCls} ml-auto`} onClick={onCerrar}>✕ Cerrar</button>
        </div>
        <p className="mb-3 text-xs text-ink-soft">Opcional. Sustituye un color por otro en los textos, formas, bordes, iconos y fondos. Tras aplicarlo puedes deshacerlo aquí mismo.</p>

        <label className="mb-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={soloPagina} onChange={(e) => { setSoloPagina(e.target.checked); setDe(undefined); setMensaje(""); }} />
          Solo en la página {pagina + 1} (si no, en toda la edición)
        </label>

        <h3 className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-ink-soft">Color que quieres cambiar</h3>
        {usados.length === 0 ? (
          <p className="mb-3 text-xs italic text-ink-soft">No hay colores propios en {soloPagina ? "esta página" : "la edición"}.</p>
        ) : (
          <div className="mb-3 flex flex-wrap gap-2">
            {usados.map((u) => (
              <button key={u.color} type="button" onClick={() => { setDe(u.color); setMensaje(""); }} aria-pressed={origen === u.color} title={`${u.color} · ${u.usos} uso${u.usos === 1 ? "" : "s"}`} className={`flex items-center gap-1.5 rounded-full border py-1 pl-1 pr-2.5 text-xs ${origen === u.color ? "border-terracota ring-2 ring-terracota" : "border-ink/30"}`}>
                <span aria-hidden className="h-6 w-6 rounded-full border border-ink/30" style={{ background: colorCss(u.color, "transparent") }} />
                <span className="font-semibold">{u.usos}×</span>
              </button>
            ))}
          </div>
        )}

        <h3 className="mb-1.5 text-[0.68rem] font-bold uppercase tracking-wider text-ink-soft">Color nuevo</h3>
        <div className="mb-3">
          <BotonColor valor={a} onChange={(v) => { setA(v); setMensaje(""); }} etiqueta={a ? undefined : "Elegir el color nuevo…"} />
        </div>

        <p className="mb-3 min-h-[1.25rem] text-sm" role="status">
          {origen && a ? (origen === a.toLowerCase() ? "Elige un color distinto." : previa ? `Se cambiarán ${previa} lugar${previa === 1 ? "" : "es"}.` : "Nada que cambiar.") : mensaje || "Elige el color de origen y el nuevo."}
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`${btnCls} !bg-ink !text-paper disabled:opacity-40`}
            disabled={!previa}
            onClick={() => {
              const r = cambiarColor(datos, origen!, a!, alcance);
              onAplicar(r.datos, `Color ${origen} → ${a} (${r.cambios})`);
              setMensaje(`Listo: ${r.cambios} lugar${r.cambios === 1 ? "" : "es"} cambiado${r.cambios === 1 ? "" : "s"}.`);
              setDe(undefined);
            }}
          >
            Cambiar {previa ? previa : ""}
          </button>
          {ultimo && (
            <button type="button" className={btnCls} onClick={() => { onDeshacer(); setMensaje("Deshecho."); }}>
              ↶ Deshacer: {ultimo.resumen}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
