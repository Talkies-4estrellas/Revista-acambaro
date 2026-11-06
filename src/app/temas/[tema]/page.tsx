import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import { IconoSvg } from "@/components/Lienzo";
import { fotoDeTarjeta, srcsetMedia } from "@/lib/imagen";
import { TEMAS, paginasDeTema } from "@/lib/temas";

export const revalidate = 60;
export const generateStaticParams = () => TEMAS.map((t) => ({ tema: t.slug }));

type Props = { params: Promise<{ tema: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tema } = await params;
  const datos = TEMAS.find((x) => x.slug === tema);
  return datos ? { title: `${datos.nombre} — ACOM-Di, Revista de Acámbaro`, description: datos.texto } : {};
}

/** Las páginas de un tema, de todas las ediciones publicadas. */
export default async function Tema({ params }: Props) {
  const { tema } = await params;
  const t = TEMAS.find((x) => x.slug === tema);
  if (!t) notFound();
  const paginas = paginasDeTema(t.slug);

  return (
    <>
      <Masthead compact />
      <main className="mx-auto max-w-6xl px-5 py-12">
        <nav aria-label="Otros temas" className="font-sans flex flex-wrap gap-2 text-xs font-bold">
          <Link href="/temas" className="rounded-full border border-ink/25 px-3 py-1.5 hover:border-ink">
            ← Temas
          </Link>
          {TEMAS.map((x) => (
            <Link key={x.slug} href={`/temas/${x.slug}`} aria-current={x.slug === t.slug ? "page" : undefined} className={`rounded-full border px-3 py-1.5 ${x.slug === t.slug ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink"}`}>
              {x.nombre}
            </Link>
          ))}
        </nav>
        <div className="mt-8 flex items-center gap-4">
          <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-[#067556]/10">
            <IconoSvg icono={t.icono} color="#067556" trazo={1.7} className="h-7 w-7" />
          </span>
          <h1 className="font-display text-5xl font-black italic">{t.nombre}</h1>
        </div>
        <p className="mt-3 max-w-2xl text-lg text-ink-soft">{t.texto}</p>
        <p className="kicker mt-3 text-ink-soft">
          {paginas.length} {paginas.length === 1 ? "página" : "páginas"}
        </p>

        {paginas.length === 0 ? (
          <p className="font-sans mt-8 text-sm italic text-ink-soft">Pronto habrá páginas de este tema.</p>
        ) : (
          <ol className="mt-8 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">
            {paginas.map(({ edicion, n, pagina, titulo, href }) => {
              // Una foto por tarjeta, no la página completa en miniatura: «Historia» pesaba 880 KB de HTML con 40 páginas dibujadas.
              // Casi la mitad de las páginas son solo texto o ilustración: esas muestran la portada de su edición.
              const foto = fotoDeTarjeta(pagina.elementos) ?? fotoDeTarjeta(edicion.paginas[0].elementos);
              return (
              <li key={href}>
                <Link href={href} className="group block">
                  <div className="aspect-[4/3] overflow-hidden rounded-sm bg-paper-deep shadow-[0_14px_30px_-14px_rgba(0,0,0,0.55)] transition-transform group-hover:-translate-y-1">
                    {foto ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={foto.src} srcSet={srcsetMedia(foto.src)} sizes="(max-width: 639px) 46vw, 270px" alt="" loading="lazy" className="h-full w-full object-cover" style={foto.enfoque ? { objectPosition: `${foto.enfoque.x}% ${foto.enfoque.y}%` } : undefined} />
                    ) : (
                      <span aria-hidden className="kicker grid h-full place-items-center p-3 text-center text-ink-soft">
                        {pagina.seccion}
                      </span>
                    )}
                  </div>
                  <span className="font-display mt-3 block text-lg font-bold leading-snug group-hover:underline">{titulo}</span>
                  <span className="kicker mt-1 block text-ink-soft">
                    N.º {edicion.numero} · p. {n}
                  </span>
                </Link>
              </li>
              );
            })}
          </ol>
        )}
      </main>
      <Footer />
    </>
  );
}
