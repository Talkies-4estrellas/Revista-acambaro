import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";

export default function NoEncontrada() {
  return (
    <>
      <Masthead compact />
      <main className="mx-auto max-w-xl px-5 py-20 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/emblema.svg" alt="" className="mx-auto mb-4 h-24 w-auto" />
        <p className="kicker text-terracota">Error 404</p>
        <h1 className="font-display mt-2 text-5xl font-black italic">Esta página se perdió en la vía</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">No encontramos lo que buscabas. Puede que la edición aún no esté publicada.</p>
        <Link href="/ediciones" className="kicker mt-8 inline-block bg-ink px-6 py-3 text-paper hover:bg-terracota">
          Ver las ediciones
        </Link>
      </main>
      <Footer />
    </>
  );
}
