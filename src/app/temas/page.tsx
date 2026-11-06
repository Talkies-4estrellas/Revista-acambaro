import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { IconoSvg } from "@/components/Lienzo";
import { TEMAS, paginasDeTema } from "@/lib/temas";

export const metadata: Metadata = {
  title: "Temas — ACOM-Di, Revista de Acámbaro",
  description: "Explora la revista por tema: historia, sabor, gente y paisajes de Acámbaro y su región.",
};
export const revalidate = 60;

/** Las páginas de todas las ediciones, agrupadas por tema. */
export default function Temas() {
  return (
    <>
      <Masthead compact />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <p className="kicker text-terracota">Explora la revista</p>
        <h1 className="font-display mt-2 text-5xl font-black italic">Temas</h1>
        <ul className="mt-8 grid gap-5 sm:grid-cols-2">
          {TEMAS.map((t) => (
            <li key={t.slug}>
              <Link href={`/temas/${t.slug}`} className="group flex h-full gap-4 rounded-2xl border border-ink/15 p-5 transition-colors hover:border-terracota">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#067556]/10">
                  <IconoSvg icono={t.icono} color="#067556" trazo={1.7} className="h-6 w-6" />
                </span>
                <span>
                  <span className="font-display block text-2xl font-black group-hover:underline">{t.nombre}</span>
                  <span className="mt-1 block text-ink-soft">{t.texto}</span>
                  <span className="kicker mt-2 block text-ink-soft">{paginasDeTema(t.slug).length} páginas</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </main>
      <Footer />
    </>
  );
}
