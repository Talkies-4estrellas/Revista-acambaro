import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { buscar, partirResaltado } from "@/lib/busqueda";

export const metadata: Metadata = { title: "Buscar — Acámbaro", robots: { index: false, follow: true } };

/** Resultados por página (la lista completa en un teléfono pasaba de 7000 px de alto). */
const POR_PAGINA = 10;
const MAX_RESULTADOS = 100;

const primero = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function Buscar({ searchParams }: { searchParams: Promise<{ q?: string | string[]; pag?: string | string[] }> }) {
  const sp = await searchParams;
  const q = primero(sp.q)?.slice(0, 80).trim() ?? "";
  const todos = q.length >= 2 ? buscar(q, undefined, MAX_RESULTADOS) : [];
  const paginas = Math.max(1, Math.ceil(todos.length / POR_PAGINA));
  const pag = Math.min(paginas, Math.max(1, Number.parseInt(primero(sp.pag) ?? "1", 10) || 1));
  const resultados = todos.slice((pag - 1) * POR_PAGINA, pag * POR_PAGINA);
  const enlace = (n: number) => `/buscar?q=${encodeURIComponent(q)}${n > 1 ? `&pag=${n}` : ""}`;

  return (
    <>
      <Masthead compact sinBusquedaEnCelular />
      <main className="mx-auto max-w-3xl px-5 py-6 sm:py-10">
        <h1 className="font-display text-4xl font-black italic sm:text-6xl">Buscar</h1>
        <form action="/buscar" role="search" className="mt-4 flex gap-2 sm:mt-6">
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
            className="font-sans min-w-0 flex-1 border border-ink bg-paper px-4 py-3 text-base outline-none focus:ring-2 focus:ring-terracota sm:text-sm"
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
              : `${todos.length}${todos.length >= MAX_RESULTADOS ? "+" : ""} ${todos.length === 1 ? "resultado" : "resultados"} para “${q}”${paginas > 1 ? ` · página ${pag} de ${paginas}` : ""}`}
          </p>
        )}

        <ol className="mt-4">
          {resultados.map((r) => (
            <li key={r.href} className="border-t border-ink/60">
              <Link href={r.href} className="group block py-4 sm:py-5">
                <span className="kicker block text-terracota">
                  Edición N.º {r.numero} · {r.tema} · <span className="whitespace-nowrap">pág. {r.pagina}</span>
                </span>
                <span className="font-display mt-1 block text-xl font-bold leading-snug group-hover:underline decoration-terracota decoration-2 underline-offset-4 sm:text-2xl">
                  {r.titulo}
                </span>
                <span className="mt-1 line-clamp-3 block text-sm leading-relaxed text-ink-soft sm:line-clamp-none">
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

        {paginas > 1 && (
          <nav aria-label="Páginas de resultados" className="mt-6 flex items-center justify-between gap-3 border-t border-ink/60 pt-5">
            {pag > 1 ? (
              <Link href={enlace(pag - 1)} className="kicker inline-flex min-h-11 items-center border border-ink px-4 hover:bg-ink hover:text-paper">
                ← Anteriores
              </Link>
            ) : (
              <span />
            )}
            <span className="font-sans text-xs tabular-nums text-ink-soft">
              {pag} / {paginas}
            </span>
            {pag < paginas ? (
              <Link href={enlace(pag + 1)} className="kicker inline-flex min-h-11 items-center bg-ink px-4 text-paper hover:bg-terracota">
                Más resultados →
              </Link>
            ) : (
              <span />
            )}
          </nav>
        )}
      </main>
      <Footer />
    </>
  );
}
