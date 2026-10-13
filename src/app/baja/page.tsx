import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import BotonBaja from "./BotonBaja";

export const metadata: Metadata = { title: "Darse de baja — Acámbaro", robots: { index: false, follow: false } };

export default async function Baja({ searchParams }: { searchParams: Promise<{ t?: string }> }) {
  const { t } = await searchParams;
  return (
    <>
      <Masthead compact />
      <main className="mx-auto max-w-xl px-5 py-16 text-center">
        <h1 className="font-display text-4xl font-black italic">Darte de baja</h1>
        {t ? (
          <BotonBaja token={t} />
        ) : (
          <p className="mt-4 text-ink-soft">Este enlace no es válido. Usa el enlace de baja del correo que recibiste.</p>
        )}
      </main>
      <Footer />
    </>
  );
}
