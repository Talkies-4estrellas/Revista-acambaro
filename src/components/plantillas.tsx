import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import Logo from "@/components/Logo";
import ThemeToggle from "@/components/ThemeToggle";
import PageTurner from "@/components/PageTurner";
import Ticker from "@/components/Ticker";
import AnimacionesLienzo from "@/components/AnimacionesLienzo";
import { LienzoResponsivo } from "@/components/Lienzo";
import Bloques, { Galeria, Imagen, Video } from "@/components/Bloques";
import {
  etiqueta,
  hrefPagina,
  tipoPagina,
  type Edicion,
  type Pagina,
  type Plantilla,
  type Tono,
} from "@/lib/ediciones";

type Props = { ed: Edicion; n: number; pagina: Pagina };

const esIndice = (p: Pagina) =>
  p.enIndice !== false && p.plantilla !== "portada" && p.plantilla !== "indice";

const FONDO: Record<Tono, string> = {
  terracota: "bg-terracota text-paper",
  ocre: "bg-ocre text-ink",
  oliva: "bg-oliva text-paper",
  indigo: "bg-indigo text-paper dark:text-white",
  tinta: "bg-ink text-paper",
};

/** Cabecera + pie comunes; el contenido de cada plantilla va en medio. */
function Hoja({
  ed,
  n,
  full = false,
  children,
}: {
  ed: Edicion;
  n: number;
  full?: boolean;
  children: React.ReactNode;
}) {
  const prev = ed.paginas[n - 2];
  const next = ed.paginas[n];
  return (
    <>
      <Masthead edicion={ed} compact={!full} />
      {children}
      <PageTurner
        page={`${tipoPagina(ed.paginas[n - 1])} · ${n} de ${ed.paginas.length}`}
        prev={prev && { href: hrefPagina(ed, n - 1), label: etiqueta(prev) }}
        next={next && { href: hrefPagina(ed, n + 1), label: etiqueta(next) }}
      />
      <Footer />
    </>
  );
}

function Cabecera({ p }: { p: Pagina }) {
  return (
    <header className="mx-auto max-w-3xl px-5 pt-10 text-center">
      {p.seccion && <p className="kicker text-terracota">{p.seccion}</p>}
      {p.titulo && (
        <h1 className="font-display mt-3 text-4xl font-black leading-[1.05] sm:text-6xl">{p.titulo}</h1>
      )}
      {p.bajada && (
        <p className="font-display mt-4 text-xl italic leading-snug text-ink-soft">{p.bajada}</p>
      )}
      {(p.autor || p.lectura || p.fecha) && (
        <p className="font-sans mt-5 text-xs text-ink-soft">
          {[p.autor && `Por ${p.autor}`, p.lectura && `${p.lectura} min de lectura`, p.fecha]
            .filter(Boolean)
            .join(" · ")}
        </p>
      )}
    </header>
  );
}

/* ------------------------------ Portada ------------------------------ */

function Portada({ ed, n, pagina: p }: Props) {
  const destino = hrefPagina(ed, p.enlace ?? Math.min(3, ed.paginas.length));
  const titulos = ed.paginas.filter(esIndice).map(etiqueta);
  return (
    <Hoja ed={ed} n={n} full>
      <Ticker titulos={titulos} />
      <main className="mx-auto max-w-6xl px-5">
        <section className="grid gap-8 py-10 lg:grid-cols-[1fr_20rem] lg:gap-10">
          <article>
            <Link href={destino} className="block">
              <Imagen m={{ proporcion: "16/10", tono: p.tono ?? "terracota", alt: "Portada", ...p.imagen }} />
            </Link>
            <p className="kicker mt-5 text-terracota">
              {[p.seccion, `Tema del número: ${ed.tema}`].filter(Boolean).join(" · ")}
            </p>
            <h2 className="font-display mt-2 text-4xl font-black leading-[1.05] sm:text-6xl">{p.titulo}</h2>
            {p.bajada && <p className="drop-cap mt-5 max-w-2xl text-lg leading-relaxed">{p.bajada}</p>}
            <p className="font-sans mt-4 text-xs text-ink-soft">
              {[p.autor && `Por ${p.autor}`, p.lectura && `${p.lectura} min de lectura`, p.fecha]
                .filter(Boolean)
                .join(" · ")}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href={destino} className="kicker bg-ink px-6 py-3 text-paper hover:bg-terracota">
                Leer el reportaje
              </Link>
              <Link
                href={hrefPagina(ed, Math.min(2, ed.paginas.length))}
                className="kicker border border-ink px-6 py-3 hover:bg-ink hover:text-paper"
              >
                Ver el índice →
              </Link>
            </div>
          </article>

          {p.destacados && p.destacados.length > 0 && (
            <aside aria-label="Destacados" className="lg:border-l lg:border-ink lg:pl-8">
              <h2 className="kicker mb-1 text-ink-soft">Además en este número</h2>
              {p.destacados.map((d) => (
                <Link
                  key={d.titulo}
                  href={hrefPagina(ed, d.pagina)}
                  className="group grid grid-cols-[7rem_1fr] gap-4 border-t border-ink py-4 sm:grid-cols-[9rem_1fr] lg:grid-cols-[7rem_1fr]"
                >
                  <Imagen m={{ proporcion: "1/1", tono: d.tono ?? "ocre", alt: d.titulo, ...d.imagen }} sinEtiqueta />
                  <div>
                    {d.seccion && <p className="kicker text-terracota">{d.seccion}</p>}
                    <h3 className="font-display mt-1 text-lg font-bold leading-tight group-hover:underline decoration-terracota decoration-2 underline-offset-4">
                      {d.titulo}
                    </h3>
                    <p className="font-sans mt-2 text-xs text-ink-soft">
                      {[d.autor, d.lectura && `${d.lectura} min`].filter(Boolean).join(" · ")}
                    </p>
                  </div>
                </Link>
              ))}
            </aside>
          )}
        </section>
      </main>
    </Hoja>
  );
}

/* ------------------------------- Índice ------------------------------ */

function Indice({ ed, n, pagina: p }: Props) {
  const entradas = ed.paginas
    .map((pg, i) => ({ pg, i }))
    .filter(({ pg }) => esIndice(pg));
  return (
    <Hoja ed={ed} n={n}>
      <main className="mx-auto max-w-6xl px-5 py-10">
        <p className="kicker text-terracota">Edición N.º {ed.numero}</p>
        <h1 className="font-display mt-2 text-5xl font-black italic sm:text-7xl">{p.titulo ?? "Índice"}</h1>
        <p className="font-display mt-2 text-lg italic text-ink-soft">{ed.tema}</p>

        <div className={`mt-10 grid gap-12 ${p.agenda ? "md:grid-cols-[1fr_20rem]" : ""}`}>
          <ol>
            {entradas.map(({ pg, i }, k) => (
              <li key={i} className="border-t border-ink">
                <Link
                  href={hrefPagina(ed, i + 1)}
                  className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-4 py-4 sm:grid-cols-[4rem_1fr_auto]"
                >
                  <span className="font-display text-3xl font-black text-terracota sm:text-4xl">
                    {String(k + 1).padStart(2, "0")}
                  </span>
                  <span>
                    <span className="kicker block text-ink-soft">{pg.seccion ?? tipoPagina(pg)}</span>
                    <span className="font-display mt-1 block text-xl font-bold leading-snug group-hover:underline decoration-terracota decoration-2 underline-offset-4 sm:text-2xl">
                      {etiqueta(pg)}
                    </span>
                    {pg.bajada && (
                      <span className="mt-1 block text-[0.95rem] leading-relaxed text-ink-soft">{pg.bajada}</span>
                    )}
                  </span>
                  <span className="font-sans text-xs text-ink-soft">p. {i + 1}</span>
                </Link>
              </li>
            ))}
          </ol>

          {p.agenda && (
            <aside aria-label="Agenda" className="md:border-l md:border-ink md:pl-8">
              <h2 className="font-display text-3xl font-black italic">Agenda</h2>
              <ul className="mt-4">
                {p.agenda.map((e) => (
                  <li key={e.titulo} className="grid grid-cols-[4rem_1fr] items-center gap-4 border-t border-ink py-3">
                    <div className="bg-ink py-2 text-center text-paper">
                      <p className="font-display text-2xl font-black leading-none">{e.dia}</p>
                      <p className="kicker mt-1 text-[0.6rem]">{e.mes}</p>
                    </div>
                    <div>
                      <p className="font-display text-lg font-bold leading-tight">{e.titulo}</p>
                      {e.lugar && <p className="font-sans text-xs text-ink-soft">{e.lugar}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            </aside>
          )}
        </div>
      </main>
    </Hoja>
  );
}

/* ------------------------------ Reportaje ---------------------------- */

function Reportaje({ ed, n, pagina: p }: Props) {
  return (
    <Hoja ed={ed} n={n}>
      <main className="pb-6">
        <article>
          <Cabecera p={p} />
          {p.imagen && (
            <div className="mx-auto mt-8 max-w-5xl px-5">
              <Imagen m={{ proporcion: "16/9", ...p.imagen }} />
              {p.imagen.pie && <p className="font-sans mt-2 text-xs text-ink-soft">{p.imagen.pie}</p>}
            </div>
          )}
          <div className="mt-10">
            {p.bloques && <Bloques bloques={p.bloques} capitularPrimero />}
          </div>
        </article>
      </main>
    </Hoja>
  );
}

/* ------------------------------- Galería ----------------------------- */

function GaleriaPagina({ ed, n, pagina: p }: Props) {
  return (
    <Hoja ed={ed} n={n}>
      <main className="pb-6">
        <Cabecera p={p} />
        <div className="mx-auto mt-10 max-w-5xl px-5">
          <Galeria imagenes={p.imagenes ?? []} columnas={p.columnas} />
        </div>
        {p.bloques && (
          <div className="mt-10">
            <Bloques bloques={p.bloques} />
          </div>
        )}
      </main>
    </Hoja>
  );
}

/* --------------------------------- Cita ------------------------------ */

function Cita({ ed, n, pagina: p }: Props) {
  return (
    <Hoja ed={ed} n={n}>
      <main className={`flex min-h-[65vh] items-center justify-center px-6 py-16 text-center ${FONDO[p.tono ?? "terracota"]}`}>
        <figure className="max-w-4xl">
          <blockquote className="font-display text-3xl font-bold italic leading-snug sm:text-5xl">
            “{p.texto}”
          </blockquote>
          {p.autor && <figcaption className="kicker mt-8 opacity-80">{p.autor}</figcaption>}
        </figure>
      </main>
    </Hoja>
  );
}

/* --------------------------------- Video ----------------------------- */

function VideoPagina({ ed, n, pagina: p }: Props) {
  return (
    <Hoja ed={ed} n={n}>
      <main className="pb-6">
        <Cabecera p={p} />
        <div className="mx-auto mt-8 max-w-5xl px-5">
          <Video v={p.video ?? {}} />
          {p.video?.pie && <p className="font-sans mt-2 text-xs text-ink-soft">{p.video.pie}</p>}
        </div>
        {p.bloques && (
          <div className="mt-10">
            <Bloques bloques={p.bloques} />
          </div>
        )}
      </main>
    </Hoja>
  );
}

/* --------------------------------- Libre ----------------------------- */

function Libre({ ed, n, pagina: p }: Props) {
  return (
    <Hoja ed={ed} n={n}>
      <main className="pb-6">
        <Cabecera p={p} />
        <div className="mt-10">{p.bloques && <Bloques bloques={p.bloques} />}</div>
      </main>
    </Hoja>
  );
}

/* -------------------------------- Lienzo ----------------------------- */

function LienzoPagina({ ed, n, pagina: p }: Props) {
  const prev = ed.paginas[n - 2];
  const next = ed.paginas[n];
  return (
    <>
      {/* Barra superior: tres zonas fijas (volver · logo · posición). Sin el estilo «kicker», cuyo espaciado de letras
          es enorme en pantallas de 360 px y partía «← Ediciones» y «N.º 10 · 1/54» en dos líneas. */}
      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-ink/40 px-4 py-2 font-sans text-[0.64rem] font-bold uppercase leading-none tracking-[0.06em] text-ink-soft sm:px-5 sm:text-[0.68rem] sm:tracking-[0.18em]">
        <Link href="/ediciones" className="inline-flex items-center gap-1 justify-self-start whitespace-nowrap py-2 hover:text-terracota" aria-label="Volver a todas las ediciones">
          <span aria-hidden>←</span>
          <span>Ediciones</span>
        </Link>
        <Link href="/" aria-label="ACOM-Di, Revista de Acámbaro — inicio" className="block justify-self-center">
          <Logo className="h-7 w-auto sm:h-9" />
        </Link>
        <span className="flex items-center gap-1 justify-self-end whitespace-nowrap tabular-nums" title={`Edición N.º ${ed.numero}`}>
          <span>
            <span className="hidden sm:inline">N.º {ed.numero} · </span>
            {n}/{ed.paginas.length}
          </span>
          <ThemeToggle className="-mr-2 sm:mr-0" />
        </span>
      </div>
      <main className="bg-paper-deep/60 py-6 sm:py-10">
        <h1 className="sr-only">{etiqueta(p)}</h1>
        <div className="mx-auto max-w-[900px] shadow-[0_10px_40px_-12px_rgba(28,24,20,0.35)]">
          <LienzoResponsivo elementos={p.elementos ?? []} fondo={p.fondo} alto={p.alto} movil={p.movil} ordenMovil={p.ordenMovil} edicionId={ed.id} animar />
          {/* Sin JavaScript no hay quien reproduzca las animaciones: todo se muestra tal cual. */}
          <noscript>
            <style>{`[data-anim]{opacity:1!important}`}</style>
          </noscript>
          <AnimacionesLienzo key={n} />
        </div>
      </main>
      <PageTurner
        page={`${n} de ${ed.paginas.length}`}
        prev={prev && { href: hrefPagina(ed, n - 1), label: etiqueta(prev) }}
        next={next && { href: hrefPagina(ed, n + 1), label: etiqueta(next) }}
      />
      <Footer />
    </>
  );
}

export const PLANTILLA_COMPONENTES: Record<Plantilla, (props: Props) => React.ReactElement> = {
  lienzo: LienzoPagina,
  portada: Portada,
  indice: Indice,
  reportaje: Reportaje,
  galeria: GaleriaPagina,
  cita: Cita,
  video: VideoPagina,
  libre: Libre,
};
