import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import FormSuscripcion from "@/components/FormSuscripcion";

export const metadata: Metadata = { title: "Suscríbete — Acámbaro" };

export default function Suscribirse() {
  return (
    <>
      <Masthead compact />
      <main className="mx-auto max-w-xl px-5 py-16 text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/brand/emblema.svg" alt="" className="mx-auto mb-4 h-20 w-auto" />
        <p className="kicker text-terracota">Newsletter</p>
        <h1 className="font-display mt-2 text-5xl font-black italic">Recibe la próxima edición</h1>
        <p className="mx-auto mt-3 max-w-md text-ink-soft">
          Un correo con la edición de la semana y sus historias. Sin ruido; te das de baja cuando quieras.
        </p>
        <FormSuscripcion className="relative mx-auto mt-8 max-w-md" />
        <p className="font-sans mt-8 text-xs text-ink-soft">
          <Link href="/ediciones" className="underline underline-offset-2 hover:text-terracota">
            Ver las ediciones anteriores
          </Link>
        </p>
      </main>
      <Footer />
    </>
  );
}
