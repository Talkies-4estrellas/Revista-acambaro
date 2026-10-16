import Link from "next/link";

type Target = { href: string; label: string };

/**
 * Pase de página manual al final de cada página. El giro animado lo resuelve
 * PageFlow, que intercepta los enlaces a la página contigua.
 * En pantallas estrechas el contador pasa arriba y los dos títulos se reparten la fila (con corte a dos líneas), para
 * que nombres largos como «Contracarátula · Bimbo» no rompan la cuadrícula.
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
  const titulo =
    "font-display line-clamp-2 break-words text-base font-bold leading-snug group-hover:underline decoration-terracota decoration-2 underline-offset-4 sm:text-2xl";
  const kicker = "kicker block text-[0.62rem] text-ink-soft sm:text-[0.68rem]";
  return (
    <>
      <nav
        aria-label="Pasar de página"
        className="mx-auto mt-10 grid max-w-6xl grid-cols-2 items-start gap-x-4 gap-y-3 border-t-4 border-double border-ink px-5 py-6 sm:mt-12 sm:grid-cols-[1fr_auto_1fr] sm:items-center"
      >
        <span className="col-span-2 text-center font-sans text-xs text-ink-soft sm:order-none sm:col-span-1 sm:col-start-2 sm:row-start-1">{page}</span>
        {prev ? (
          <Link href={prev.href} className="group min-w-0 sm:col-start-1 sm:row-start-1">
            <span className={kicker}>← Anterior</span>
            <span className={titulo}>{prev.label}</span>
          </Link>
        ) : (
          <span className="sm:col-start-1 sm:row-start-1" />
        )}
        {next ? (
          <Link href={next.href} className="group col-start-2 min-w-0 text-right sm:col-start-3 sm:row-start-1">
            <span className={kicker}>Siguiente →</span>
            <span className={titulo}>{next.label}</span>
          </Link>
        ) : (
          <span className="col-start-2 sm:col-start-3 sm:row-start-1" />
        )}
      </nav>
      <p className="mx-auto max-w-6xl px-5 pb-2 text-center font-sans text-[0.7rem] text-ink-soft">
        <span className="sm:hidden">Desliza hacia los lados o usa los botones para pasar de página.</span>
        <span className="hidden sm:inline">Sigue desplazando, arrastra con el ratón o usa las flechas ← → para pasar de página.</span>
      </p>
    </>
  );
}
