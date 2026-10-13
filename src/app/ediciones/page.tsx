import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { fechaLarga, getPublicadas, hrefPagina } from "@/lib/ediciones";

export const metadata: Metadata = { title: "Ediciones — Acámbaro" };

/** Se regenera cada minuto para que una edición programada aparezca sola cuando llega su hora. */
export const revalidate = 60;

export default function Ediciones() {
  const ediciones = getPublicadas();
  return (
    <>
      <Masthead compact />
      <main className="mx-auto max-w-4xl px-5 py-10">
        <h1 className="font-display text-5xl font-black italic sm:text-7xl">Ediciones</h1>
        <ol className="mt-10">
          {ediciones.map((ed) => (
            <li key={ed.id} className="border-t border-ink">
              <Link href={hrefPagina(ed, 1)} className="group grid grid-cols-[4rem_1fr_auto] items-baseline gap-4 py-5">
                <span className="font-display text-4xl font-black text-terracota">{ed.numero}</span>
                <span>
                  <span className="font-display block text-2xl font-bold leading-snug group-hover:underline decoration-terracota decoration-2 underline-offset-4">
                    {ed.tema}
                  </span>
                  <span className="kicker mt-1 block text-ink-soft">{fechaLarga(ed.fecha)}</span>
                </span>
                <span className="font-sans text-xs text-ink-soft">{ed.paginas.length} páginas</span>
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </>
  );
}
