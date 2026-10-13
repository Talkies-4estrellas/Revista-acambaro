import Link from "next/link";

type Target = { href: string; label: string };

/**
 * Pase de página manual al final de cada página. El giro animado lo resuelve
 * PageFlow, que intercepta los enlaces a la página contigua.
 */
export default function PageTurner({
  prev,
  next,
  page,
}: {
  prev?: Target;
  next?: Target;
  page: string;
}) {
  return (
    <>
      <nav
        aria-label="Pasar de página"
        className="mx-auto mt-12 grid max-w-6xl grid-cols-[1fr_auto_1fr] items-center gap-4 border-t-4 border-double border-ink px-5 py-6"
      >
        {prev ? (
          <Link href={prev.href} className="group">
            <span className="kicker block text-ink-soft">← Página anterior</span>
            <span className="font-display text-xl font-bold group-hover:underline decoration-terracota decoration-2 underline-offset-4 sm:text-2xl">
              {prev.label}
            </span>
          </Link>
        ) : (
          <span />
        )}
        <span className="font-sans text-xs text-ink-soft">{page}</span>
        {next ? (
          <Link href={next.href} className="group text-right">
            <span className="kicker block text-ink-soft">Siguiente página →</span>
            <span className="font-display text-xl font-bold group-hover:underline decoration-terracota decoration-2 underline-offset-4 sm:text-2xl">
              {next.label}
            </span>
          </Link>
        ) : (
          <span />
        )}
      </nav>
      <p className="mx-auto max-w-6xl px-5 pb-2 text-center font-sans text-[0.7rem] text-ink-soft">
        Sigue desplazando, arrastra con el ratón o usa las flechas ← → para pasar de página.
      </p>
    </>
  );
}
