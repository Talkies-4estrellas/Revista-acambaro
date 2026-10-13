import LienzoVista from "@/components/Lienzo";
import type { Edicion } from "@/lib/ediciones";

const TONO: Record<string, string> = {
  terracota: "var(--terracota)",
  ocre: "var(--ocre)",
  oliva: "var(--oliva)",
  indigo: "var(--indigo)",
  tinta: "var(--ink)",
};

/** La primera página de una edición, en pequeño. Las páginas hechas con plantillas antiguas se resumen en una tarjeta. */
export default function PortadaMini({ ed, className = "" }: { ed: Edicion; className?: string }) {
  const p = ed.paginas[0];
  if (p.plantilla === "lienzo") {
    return (
      <div className={`pointer-events-none overflow-hidden ${className}`} aria-hidden>
        <LienzoVista elementos={p.elementos ?? []} fondo={p.fondo} alto={p.alto} edicionId={ed.id} miniatura />
      </div>
    );
  }
  return (
    <div
      aria-hidden
      className={`flex aspect-[800/1100] flex-col justify-between p-[8%] text-paper ${className}`}
      style={{ background: TONO[p.tono ?? "terracota"] ?? TONO.terracota }}
    >
      <span className="kicker text-paper/80">{p.seccion ?? "Edición"}</span>
      <span className="font-display text-[clamp(1.1rem,4vw,2.2rem)] font-black italic leading-tight">{p.titulo ?? ed.tema}</span>
      <span className="kicker text-paper/80">N.º {ed.numero}</span>
    </div>
  );
}
