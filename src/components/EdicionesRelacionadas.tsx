import Link from "next/link";
import PortadaMini from "@/components/PortadaMini";
import { hrefPagina, type Edicion } from "@/lib/ediciones";
import { edicionesRelacionadas } from "@/lib/temas";

/** Al terminar una edición: otras que podrían interesar al lector. */
export default function EdicionesRelacionadas({ ed }: { ed: Edicion }) {
  const lista = edicionesRelacionadas(ed);
  if (lista.length === 0) return null;
  return (
    <section aria-label="Sigue con otra edición" className="mx-auto max-w-3xl px-5 py-8 text-left">
      <h2 className="font-display text-center text-2xl font-black italic">Sigue con otra edición</h2>
      <ul className="mt-5 grid grid-cols-3 gap-3 sm:gap-5">
        {lista.map((e) => (
          <li key={e.id}>
            <Link href={hrefPagina(e, 1)} className="group block">
              <PortadaMini ed={e} className="shadow-[0_10px_26px_-12px_rgba(28,24,20,0.55)] transition-transform group-hover:-translate-y-1" />
              <span className="font-display mt-2 block text-sm font-bold leading-snug group-hover:underline sm:text-base">
                N.º {e.numero} · {e.tema}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
