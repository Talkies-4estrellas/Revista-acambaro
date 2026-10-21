import Link from "next/link";
import { mesAnio, type Edicion } from "@/lib/ediciones";
import Logo from "./Logo";
import ThemeToggle from "./ThemeToggle";

export default function Masthead({
  edicion,
  compact = false,
  sinBusquedaEnCelular = false,
}: {
  edicion?: Pick<Edicion, "numero" | "fecha">;
  compact?: boolean;
  /** En celular se oculta el campo de búsqueda de la cabecera (la página de resultados ya trae el suyo); el botón de tema se queda. */
  sinBusquedaEnCelular?: boolean;
}) {
  return (
    <header className="border-b-4 border-double border-ink">
      <div className="mx-auto max-w-6xl px-5">
        <div className="kicker flex flex-wrap items-center justify-between gap-2 border-b border-ink py-2 text-ink-soft">
          <span>{edicion ? `Edición N.º ${edicion.numero} · ${mesAnio(edicion.fecha)}` : "Revista digital"}</span>
          <form action="/buscar" role="search" className={`flex items-center gap-1 sm:order-none sm:mx-6 sm:w-auto sm:max-w-3xl sm:flex-1 ${sinBusquedaEnCelular ? "max-sm:w-auto" : "order-last w-full"}`}>
            <label htmlFor="busca-cabecera" className="sr-only">
              Buscar en la revista
            </label>
            <input
              id="busca-cabecera"
              name="q"
              type="search"
              placeholder="Buscar…"
              className={`font-sans min-w-0 flex-1 border border-ink/50 bg-paper px-3 py-2.5 text-base normal-case tracking-normal text-ink outline-none focus:border-ink focus:ring-1 focus:ring-terracota sm:px-3 sm:py-1 sm:text-sm ${sinBusquedaEnCelular ? "max-sm:hidden" : ""}`}
            />
            <button type="submit" className={`inline-flex items-center justify-center self-stretch bg-ink px-2.5 text-paper hover:bg-terracota sm:px-3.5 ${sinBusquedaEnCelular ? "max-sm:hidden" : ""}`} aria-label="Buscar">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true">
                <circle cx="10.5" cy="10.5" r="6.5" />
                <path d="M15.5 15.5 21 21" />
              </svg>
            </button>
            <ThemeToggle className={`!h-auto w-11 self-stretch border border-ink/50 sm:w-8 ${sinBusquedaEnCelular ? "max-sm:!h-10 max-sm:w-10 max-sm:self-center max-sm:border-0" : ""}`} />
          </form>
          <Link href="/ediciones" className="py-2 text-terracota hover:underline sm:py-0">Todas las ediciones</Link>
        </div>

        {compact ? (
          <div className="flex items-baseline justify-between py-4">
            <Link href="/" aria-label="ACOM-Di, Revista de Acámbaro — inicio" className="block self-center">
              <Logo className="h-12 w-auto sm:h-16" />
            </Link>
            <p className="font-display hidden text-sm italic text-ink-soft sm:block">
              Revista de cultura, sabor y memoria
            </p>
          </div>
        ) : (
          <div className="py-6 text-center sm:py-8">
            <h1 className="flex justify-center">
              <Logo className="h-auto w-[min(88vw,34rem)]" />
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
