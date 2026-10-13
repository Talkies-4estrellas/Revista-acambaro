import Link from "next/link";
import { mesAnio, type Edicion } from "@/lib/ediciones";

export default function Masthead({
  edicion,
  compact = false,
}: {
  edicion?: Pick<Edicion, "numero" | "fecha">;
  compact?: boolean;
}) {
  return (
    <header className="border-b-4 border-double border-ink">
      <div className="mx-auto max-w-6xl px-5">
        <div className="kicker flex flex-wrap items-center justify-between gap-2 border-b border-ink py-2 text-ink-soft">
          <span>{edicion ? `Edición N.º ${edicion.numero} · ${mesAnio(edicion.fecha)}` : "Revista digital"}</span>
          <form action="/buscar" role="search" className="order-last flex w-full items-center gap-1 sm:order-none sm:w-auto">
            <label htmlFor="busca-cabecera" className="sr-only">
              Buscar en la revista
            </label>
            <input
              id="busca-cabecera"
              name="q"
              type="search"
              placeholder="Buscar…"
              className="font-sans min-w-0 flex-1 border border-ink/50 bg-paper px-2 py-1 text-xs normal-case tracking-normal text-ink outline-none focus:border-ink focus:ring-1 focus:ring-terracota sm:w-44 sm:flex-none"
            />
            <button type="submit" className="bg-ink px-2 py-1 text-paper hover:bg-terracota" aria-label="Buscar">
              ⌕
            </button>
          </form>
          <Link href="/ediciones" className="text-terracota hover:underline">Todas las ediciones</Link>
        </div>

        {compact ? (
          <div className="flex items-baseline justify-between py-4">
            <Link href="/" aria-label="ACOM-Di, Revista de Acámbaro — inicio" className="block self-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.svg" alt="ACOM-Di, Revista de Acámbaro" className="h-12 w-auto sm:h-16" />
            </Link>
            <p className="font-display hidden text-sm italic text-ink-soft sm:block">
              Revista de cultura, sabor y memoria
            </p>
          </div>
        ) : (
          <div className="py-6 text-center sm:py-8">
            <h1 className="flex justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/logo.svg" alt="ACOM-Di, Revista de Acámbaro" className="h-auto w-[min(88vw,34rem)]" />
            </h1>
            <p className="font-display mt-2 text-base italic text-ink-soft sm:text-xl">
              Revista de cultura, sabor y memoria
            </p>
          </div>
        )}
      </div>
    </header>
  );
}
