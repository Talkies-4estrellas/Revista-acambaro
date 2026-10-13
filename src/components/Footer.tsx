export default function Footer() {
  return (
    <footer className="mt-12 border-t-4 border-double border-ink">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-center sm:flex-row sm:text-left">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/logo.svg" alt="ACOM-Di, Revista de Acámbaro" className="h-9 w-auto" />
        <nav aria-label="Pie" className="kicker flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-terracota">
          <a href="/ediciones" className="hover:underline">Ediciones</a>
          <a href="/suscribirse" className="hover:underline">Newsletter</a>
          <a href="/proyecto" className="hover:underline">El proyecto</a>
        </nav>
        <p className="font-sans text-xs text-ink-soft">
          Prototipo con contenido de ejemplo · © 2026 · Hecho en Guanajuato
        </p>
      </div>
    </footer>
  );
}
