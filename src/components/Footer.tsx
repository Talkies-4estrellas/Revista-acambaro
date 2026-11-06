import Link from "next/link";
import Logo from "./Logo";

export default function Footer() {
  return (
    <footer className="mt-12 border-t-4 border-double border-ink">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-2 px-5 py-6 text-center sm:flex-row sm:text-left">
        <Logo className="h-9 w-auto" />
        <nav aria-label="Pie" className="kicker flex flex-wrap items-center justify-center gap-x-4 text-terracota sm:gap-x-5">
          <Link href="/ediciones" className="py-3 hover:underline">Ediciones</Link>
          <Link href="/suscribirse" className="py-3 hover:underline">Newsletter</Link>
          <Link href="/proyecto" className="py-3 hover:underline">El proyecto</Link>
          <Link href="/bienvenida" className="py-3 hover:underline">Bienvenida</Link>
        </nav>
        <p className="font-sans text-xs text-ink-soft">
          © 2026 · Hecho en Michoacán
        </p>
      </div>
    </footer>
  );
}
