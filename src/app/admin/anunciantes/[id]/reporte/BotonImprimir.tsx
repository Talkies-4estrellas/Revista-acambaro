"use client";

/** Abre el diálogo de impresión del navegador (ahí también se elige «Guardar como PDF»). */
export default function BotonImprimir() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="font-sans bg-ink px-3 py-2 text-xs font-bold uppercase tracking-wider text-paper hover:bg-terracota"
    >
      Imprimir o guardar en PDF
    </button>
  );
}
