import CarruselEdiciones from "@/components/CarruselEdiciones";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import PortadaMini from "@/components/PortadaMini";
import FormSuscripcion from "@/components/FormSuscripcion";
import { IconoSvg } from "@/components/Lienzo";
import { fechaLarga, getPublicadas, hrefPagina } from "@/lib/ediciones";

/** Se regenera cada minuto para que una edición programada aparezca sola cuando llega su hora. */
export const revalidate = 60;

const FORMAS_DE_LEER = [
  { icono: "book-open", titulo: "Se lee como una revista", texto: "Pasa la página con la rueda, arrastrando, con las flechas o tocando: cada giro tiene su animación." },
  { icono: "smartphone", titulo: "También en el celular", texto: "En pantallas pequeñas la página se reacomoda en una columna pensada para leer con el pulgar." },
  { icono: "search", titulo: "Todo se puede buscar", texto: "Escribe una palabra y encuentra la página exacta, en cualquier edición." },
];

/** La portada del sitio: edición destacada, archivo de ediciones y suscripción. */
export default function Home() {
  const ediciones = getPublicadas();
  const ultima = ediciones[0];

  return (
    <>
      <Masthead />
      <main>
        {ultima ? (
          <section aria-label="Última edición" className="bg-paper-deep/60">
            <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-12 md:grid-cols-[minmax(0,22rem)_1fr] md:py-16">
              <Link href={hrefPagina(ultima, 1)} aria-label={`Leer la edición N.º ${ultima.numero}: ${ultima.tema}`} className="group mx-auto block w-full max-w-sm">
                <PortadaMini
                  ed={ultima}
                  className="shadow-[0_18px_50px_-14px_rgba(28,24,20,0.55)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:rotate-[-0.6deg]"
                />
              </Link>
              <div>
                <p className="kicker text-terracota">Última edición · N.º {ultima.numero}</p>
                <h1 className="font-display mt-3 text-5xl font-black italic leading-[1.02] sm:text-6xl lg:text-7xl">{ultima.tema}</h1>
                <p className="kicker mt-3 text-ink-soft">
                  {fechaLarga(ultima.fecha)} · {ultima.paginas.length} páginas
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link href={hrefPagina(ultima, 1)} className="kicker bg-ink px-6 py-3 text-paper hover:bg-terracota">
                    Leer la edición →
                  </Link>
                  <Link href="/ediciones" className="kicker border border-ink px-6 py-3 hover:bg-ink hover:text-paper">
                    Todas las ediciones
                  </Link>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <p className="font-display py-24 text-center text-2xl italic text-ink-soft">Aún no hay ediciones publicadas.</p>
        )}

        {ediciones.length > 1 && (
          <section aria-label="Ediciones anteriores" className="mx-auto max-w-6xl px-5 py-14">
            <div className="flex items-baseline justify-between border-b-2 border-ink pb-2">
              <h2 className="font-display text-3xl font-black italic">Ediciones anteriores</h2>
              <Link href="/ediciones" className="kicker py-2 text-terracota hover:underline">
                Ver todas
              </Link>
            </div>
            {/* Celular: carrusel horizontal con imán (se asoma la siguiente portada); desde sm, la cuadrícula de siempre. */}
            <p className="kicker mt-4 text-center text-ink-soft sm:hidden">Desliza para ver más →</p>
            <CarruselEdiciones etiqueta="Ediciones anteriores" className="-mx-5 mt-4 flex snap-x snap-mandatory overflow-x-auto py-4 [scrollbar-width:none] [&>li+li]:-ml-[9%] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:mt-8 sm:grid sm:grid-cols-3 sm:gap-x-5 sm:gap-y-10 sm:overflow-visible sm:py-0 sm:[&>li+li]:ml-0 lg:grid-cols-4">
              {ediciones.slice(1).map((ed) => (
                <li key={ed.id} className="w-[min(62vw,17rem)] shrink-0 snap-center sm:w-auto sm:shrink sm:snap-align-none">
                  <Link href={hrefPagina(ed, 1)} className="group block">
                    <PortadaMini ed={ed} className="shadow-[0_10px_30px_-12px_rgba(28,24,20,0.5)] transition-transform duration-300 group-hover:-translate-y-1" />
                    {/* En el carrusel del celular solo la portada central muestra su título (--pie lo pone CarruselEdiciones). */}
                    <span className="block max-sm:text-center max-sm:[opacity:var(--pie,1)]">
                    <span className="mt-3 flex items-baseline gap-3 max-sm:justify-center">
                      <span className="font-display text-3xl font-black text-terracota">{ed.numero}</span>
                      <span className="font-display text-lg font-bold leading-snug group-hover:underline decoration-terracota decoration-2 underline-offset-4">{ed.tema}</span>
                    </span>
                    <span className="kicker mt-1 block text-ink-soft">{fechaLarga(ed.fecha)}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </CarruselEdiciones>
          </section>
        )}

        <section aria-label="Cómo se lee" className="border-y-4 border-double border-ink bg-paper-deep/50">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-3 md:gap-12 md:py-16">
            {FORMAS_DE_LEER.map((f) => (
              <div key={f.titulo} className="text-center">
                <IconoSvg icono={f.icono} color="#068562" trazo={1.6} className="mx-auto h-10 w-10 md:h-16 md:w-16" />
                <h3 className="font-display mt-3 text-2xl font-black md:mt-4 md:text-3xl">{f.titulo}</h3>
                <p className="mx-auto mt-2 max-w-sm text-ink-soft">{f.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-label="Suscripción" className="mx-auto max-w-3xl px-5 py-16 text-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/emblema.svg" alt="" className="mx-auto mb-4 h-14 w-auto" />
          <h2 className="font-display text-4xl font-black italic">Una edición nueva cada semana</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-soft">Déjanos tu correo y te avisamos cuando salga la próxima. Sin ruido.</p>
          <FormSuscripcion className="relative mx-auto mt-6 max-w-md" />
          <p className="font-sans mt-6 text-xs text-ink-soft">
            ¿Quieres saber cómo se hace esta revista?{" "}
            <Link href="/proyecto" className="inline-block py-2.5 font-bold text-terracota underline underline-offset-2">
              Conoce el proyecto
            </Link>
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
