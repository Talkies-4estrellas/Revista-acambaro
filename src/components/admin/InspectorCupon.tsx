"use client";

import { useEffect, useState } from "react";
import { ETIQUETA_ESTADO, descuento, diaDeVencimiento } from "@/lib/cupon-estado";
import type { DatosCupon, ElementoCupon } from "@/lib/esquema";
import { btnCls } from "./campos";
import { cargarCupones, type CuponElegible } from "./SelectorCupones";

/** Campos de la «foto» que, si cambian en AcambaGo, conviene volver a tomar (el resto es interno). */
const CAMPOS: (keyof DatosCupon)[] = ["titulo", "descripcion", "tipo", "valor", "codigo", "qr", "negocio", "vence", "limite"];

/**
 * Panel del cupón en el editor: qué cupón es, cómo está ahora en AcambaGo y si sus datos cambiaron desde que se puso en la página.
 * Los textos no se editan aquí (salen del cupón); solo el color de la franja y si se ve el QR en la hoja.
 */
export default function InspectorCupon({
  el,
  set,
  cambiarCupon,
  CampoColor,
  Interruptor,
}: {
  el: ElementoCupon;
  set: (patch: Partial<ElementoCupon>) => void;
  cambiarCupon?: () => void;
  CampoColor: (p: { label: string; value: string | undefined; onChange: (v: string | undefined) => void }) => React.ReactNode;
  Interruptor: (p: { label: string; value: boolean; onChange: (v: boolean) => void }) => React.ReactNode;
}) {
  const [actual, setActual] = useState<CuponElegible | null | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);

  const leer = (forzar: boolean) => {
    setError(null);
    cargarCupones(forzar)
      .then((l) => setActual(l.find((c) => c.id === el.cupon) ?? null))
      .catch((e) => setError(e instanceof Error ? e.message : String(e)));
  };
  useEffect(() => {
    leer(false);
    // Solo al cambiar de cupón.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el.cupon]);

  const d = el.datos;
  const cambiaron = actual ? CAMPOS.filter((k) => JSON.stringify(actual.datos[k] ?? null) !== JSON.stringify(d[k] ?? null)) : [];

  return (
    <div className="font-sans space-y-3">
      <div className="border border-ink/20 bg-white/60 p-2 text-xs dark:bg-white/5">
        <p className="font-display text-lg font-black leading-none">{descuento(d.tipo, d.valor)}</p>
        <p className="mt-1 font-bold">{d.titulo}</p>
        <p className="text-ink-soft">
          {d.negocio} · <span className="font-mono">{d.codigo}</span>
        </p>
        <p className="text-ink-soft">{d.vence ? `Vence ${diaDeVencimiento(d.vence)}` : "Sin vencimiento"}</p>
      </div>

      <div className="text-xs">
        {error ? (
          <p className="border border-ink/30 bg-paper-deep p-2">{error}</p>
        ) : actual === undefined ? (
          <p className="text-ink-soft">Consultando AcambaGo…</p>
        ) : actual === null ? (
          <p className="border border-ink/30 bg-paper-deep p-2">⚠ Este cupón ya no existe en AcambaGo: en el sitio saldrá como «Ya no disponible». Cámbialo por otro.</p>
        ) : (
          <>
            <p>
              Ahora en AcambaGo: <b>{ETIQUETA_ESTADO[actual.estado]}</b>
              {actual.datos.limite != null ? ` · ${actual.usados} de ${actual.datos.limite} usos` : ` · ${actual.usados} usos`}
            </p>
            {actual.estado !== "vigente" && (
              <p className="mt-1 text-ink-soft">
                {el.sustituir !== false ? "En el sitio se cambiará por otra promoción vigente del negocio; si no tiene, saldrá «Ya no disponible»." : "En el sitio saldrá como «Ya no disponible» y sin QR."}
              </p>
            )}
            {cambiaron.length > 0 && (
              <p className="mt-2 border border-ocre bg-ocre/15 p-2">
                Cambió en AcambaGo desde que lo pusiste ({cambiaron.join(", ")}).{" "}
                <button type="button" className="font-bold underline" onClick={() => set({ datos: actual.datos })}>
                  Actualizar datos
                </button>
              </p>
            )}
          </>
        )}
      </div>

      <div className="flex gap-2">
        {cambiarCupon && (
          <button type="button" className={btnCls} onClick={cambiarCupon}>
            Cambiar cupón…
          </button>
        )}
        <button type="button" className={btnCls} onClick={() => leer(true)} title="Volver a leer el cupón en AcambaGo">
          ↻ Revisar
        </button>
      </div>

      <CampoColor label="Color de la franja" value={el.color ?? "terracota"} onChange={(v) => set({ color: v })} />
      <Interruptor label="Mostrar el QR en la página (siempre sale al tocarlo)" value={el.qr !== false} onChange={(v) => set({ qr: v ? undefined : false })} />
      <Interruptor label="Si deja de servir, mostrar otra promoción vigente del mismo negocio" value={el.sustituir !== false} onChange={(v) => set({ sustituir: v ? undefined : false })} />
      <p className="text-[0.7rem] text-ink-soft">Los textos salen del cupón y no se escriben a mano. En el sitio, al tocarlo se abre el QR grande para canjearlo.</p>
    </div>
  );
}
