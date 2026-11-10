import type { Metadata } from "next";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { cuponesVigentes, type CuponPublico } from "@/lib/cupones-publicos";
import ListaCupones from "./ListaCupones";

export const metadata: Metadata = {
  title: "Cupones — ACOM-Di, Revista de Acámbaro",
  description: "Descuentos vigentes en negocios de Acámbaro: enseña el QR en el negocio o guárdalo en tu cuenta de AcambaGo.",
};
// Se rehace como mucho cada 5 minutos (los cupones nuevos de AcambaGo aparecen solos).
export const revalidate = 300;

/** Todos los cupones vigentes de AcambaGo, con la misma tarjeta y ventana que en las ediciones. */
export default async function Cupones() {
  let cupones: CuponPublico[] | null = null;
  try {
    cupones = await cuponesVigentes();
  } catch {
    cupones = null;
  }

  return (
    <>
      <Masthead compact />
      <main className="mx-auto max-w-5xl px-5 py-12">
        <p className="kicker text-terracota">Negocios de Acámbaro</p>
        <h1 className="font-display mt-2 text-5xl font-black italic">Cupones</h1>
        <p className="font-sans mt-3 max-w-2xl text-ink-soft">
          Descuentos vigentes de los negocios de AcambaGo. Toca un cupón para ver su QR y enséñalo en el negocio, o guárdalo en tu cuenta de AcambaGo.
        </p>
        {cupones === null ? (
          <p className="font-sans mt-8 rounded-xl border border-dashed border-ink/25 p-6 text-center text-ink-soft">Los cupones no están disponibles en este momento. Vuelve a intentarlo en unos minutos.</p>
        ) : cupones.length === 0 ? (
          <p className="font-sans mt-8 rounded-xl border border-dashed border-ink/25 p-6 text-center text-ink-soft">Por ahora no hay cupones vigentes. Pronto habrá más.</p>
        ) : (
          <ListaCupones cupones={cupones} />
        )}
      </main>
      <Footer />
    </>
  );
}
