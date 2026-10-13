import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { buscar, partirResaltado } from "@/lib/busqueda";

export const metadata: Metadata = { title: "Buscar — Acámbaro", robots: { index: false, follow: true } };

export default async function Buscar({ searchParams }: { searchParams: Promise<{ q?: string | string[] }> }) {
  const sp = await searchParams;
  const q = (Array.isArray(sp.q) ? sp.q[0] : sp.q)?.slice(0, 80).trim() ?? "";
  const resultados = q.length >= 2 ? buscar(q) : [];

  return (
    <>
      <Masthead compact />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-display text-5xl font-black italic sm:text-6xl">Buscar</h1>
        <form action="/buscar" role="search" className="mt-6 flex gap-2">
          <label htmlFor="q" className="sr-only">
            Buscar en la revista
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q}
            autoFocus={!q}
            placeholder="Locomotora, pan, estación…"
            className="font-sans min-w-0 flex-1 border border-ink bg-paper px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-terracota"
          />
          <button type="submit" className="kicker bg-ink px-6 py-3 text-paper hover:bg-terracota">
            Buscar
          </button>
        </form>

        {q.length > 0 && q.length < 2 && <p className="font-sans mt-6 text-sm text-ink-soft">Escribe al menos dos letras.</p>}
        {q.length >= 2 && (
          <p className="font-sans mt-6 text-sm text-ink-soft" role="status">
            {resultados.length === 0
              ? `Sin resultados para “${q}”. Prueba con otra palabra o menos palabras.`
              : `${resultados.length} ${resultados.length === 1 ? "resultado" : "resultados"} para “${q}”`}
          </p>
        )}

        <ol className="mt-4">
          {resultados.map((r) => (
            <li key={r.href} className="border-t border-ink/60">
              <Link href={r.href} className="group block py-5">
                <span className="kicker block text-terracota">
                  Edición N.º {r.numero} · {r.tema} · pág. {r.pagina}
                </span>
                <span className="font-display mt-1 block text-2xl font-bold leading-snug group-hover:underline decoration-terracota decoration-2 underline-offset-4">
                  {r.titulo}
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-ink-soft">
                  {partirResaltado(r.fragmento, q).map((p, i) =>
                    p.resaltar ? (
                      <mark key={i} className="bg-ocre/40 text-ink">
                        {p.texto}
                      </mark>
                    ) : (
                      <span key={i}>{p.texto}</span>
                    ),
                  )}
                </span>
              </Link>
            </li>
          ))}
        </ol>
      </main>
      <Footer />
    </>
  );
}
