"use client";

import { useState } from "react";

type Muestra = { id: string; numero: string; tema: string };

/**
 * Una edición de verdad para probarla sin salir de la presentación. Es una sola muestra que se adapta al aparato: en computadora se ve ancha
 * (con el giro de página de escritorio) y en celular ocupa el ancho (con la columna para el pulgar), igual que la revista. Al principio solo se ve la portada
 * (el lector no se carga hasta que se pide: así no pesa ni atrapa la rueda del ratón al desplazarse por la página).
 */
export default function MuestraHojeable({ ediciones, portadas }: { ediciones: Muestra[]; portadas: Record<string, React.ReactNode> }) {
  const [actual, setActual] = useState(ediciones[0]?.id);
  const [abierta, setAbierta] = useState(false);
  const ed = ediciones.find((e) => e.id === actual) ?? ediciones[0];
  if (!ed) return null;

  return (
    <div className="mx-auto w-full max-w-[24rem] md:max-w-none">
      {ediciones.length > 1 && (
        <div role="tablist" aria-label="Elige una edición" className="mb-3 flex flex-wrap justify-center gap-2">
          {ediciones.map((e) => (
            <button
              key={e.id}
              type="button"
              role="tab"
              aria-selected={e.id === ed.id}
              onClick={() => setActual(e.id)}
              className={`kicker border px-3 py-1.5 ${e.id === ed.id ? "border-ink bg-ink text-paper" : "border-ink/40 hover:border-ink"}`}
            >
              N.º {e.numero}
            </button>
          ))}
        </div>
      )}
      <div className="relative h-[min(40rem,78vh)] overflow-hidden rounded-2xl border-[6px] border-ink bg-paper shadow-[0_28px_60px_-18px_rgba(28,24,20,0.6)] md:h-[min(42rem,80vh)] md:rounded-lg">
        {abierta ? (
          <iframe key={ed.id} src={`/ediciones/${ed.id}/1`} title={`Muestra de la edición N.º ${ed.numero}: ${ed.tema}`} className="h-full w-full border-0 bg-paper" />
        ) : (
          <button type="button" onClick={() => setAbierta(true)} className="group relative block h-full w-full overflow-hidden bg-gradient-to-br from-[#013f4a] via-[#035c40] to-[#49c59f] text-left" aria-label={`Hojear la edición N.º ${ed.numero}: ${ed.tema}`}>
            <div className="pointer-events-none md:mx-auto md:mt-10 md:w-80 md:shadow-[0_30px_60px_-18px_rgba(0,0,0,0.6)] md:transition-transform md:duration-500 md:group-hover:-translate-y-1">{portadas[ed.id]}</div>
            <span className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 bg-gradient-to-t from-ink/90 via-ink/60 to-transparent px-4 pb-6 pt-16 text-center text-paper">
              <span className="kicker bg-paper px-5 py-3 text-ink transition-colors group-hover:bg-terracota group-hover:text-paper">▶ Hojear esta edición</span>
              <span className="font-sans text-xs text-paper/85">Pasa las páginas aquí mismo</span>
            </span>
          </button>
        )}
      </div>
      <p className="font-sans mt-3 text-center text-xs text-ink-soft">
        {abierta ? (
          <>
            Desliza hacia arriba para leer, o usa las flechas del teclado. ·{" "}
            <a href={`/ediciones/${ed.id}/1`} className="font-bold text-terracota underline">Abrir completa ↗</a>
          </>
        ) : (
          <>N.º {ed.numero} · {ed.tema}</>
        )}
      </p>
    </div>
  );
}
