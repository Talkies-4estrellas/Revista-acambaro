import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Logo from "@/components/Logo";
import PortadaMini from "@/components/PortadaMini";
import MuestraHojeable from "@/components/MuestraHojeable";
import FormSuscripcion from "@/components/FormSuscripcion";
import ThemeToggle from "@/components/ThemeToggle";
import Revelar from "@/components/Revelar";
import MenuSecciones from "@/components/MenuSecciones";
import LienzoVista, { IconoSvg } from "@/components/Lienzo";
import { fechaLarga, getEdiciones, getPublicadas, hrefPagina, type Edicion } from "@/lib/ediciones";
import { buscar } from "@/lib/busqueda";

export const metadata: Metadata = {
  title: "Bienvenida — ACOM-Di, Revista de Acámbaro",
  description: "ACOM-Di es una revista digital semanal sobre la historia, la gastronomía, la gente y los paisajes de Acámbaro. Conoce de qué trata y cómo se lee.",
  // Al compartir el enlace (WhatsApp, Facebook…); la imagen la pone opengraph-image.tsx.
  openGraph: {
    type: "website",
    locale: "es_MX",
    siteName: "ACOM-Di · Revista de Acámbaro",
    title: "ACOM-Di: la revista digital de Acámbaro",
    description: "Historia, sabor, gente y paisajes de Acámbaro, contados cada semana en páginas que se hojean. Sin cuenta y en cualquier pantalla.",
  },
  twitter: {
    card: "summary_large_image",
    title: "ACOM-Di: la revista digital de Acámbaro",
    description: "Historia, sabor, gente y paisajes de Acámbaro, contados cada semana en páginas que se hojean.",
  },
};
export const revalidate = 60;

const TEMAS = [
  { icono: "landmark", titulo: "Historia", texto: "El ferrocarril, los barrios, los edificios y los hechos que explican cómo se hizo Acámbaro." },
  { icono: "utensils", titulo: "Sabor", texto: "El pan, los guisos, los mercados y las recetas que se heredan en la mesa." },
  { icono: "users", titulo: "Gente", texto: "Oficios, familias y personajes: quienes hacen que el pueblo sea lo que es." },
  { icono: "mountain", titulo: "Paisajes", texto: "Lugares para visitar, caminos y rincones de Acámbaro y sus alrededores." },
];

const PROBLEMAS = [
  { icono: "puzzle", t: "Está regado", x: "La historia y las recetas de Acámbaro viven en grupos de Facebook, álbumes de fotos y la memoria de cada familia. Nadie las tiene juntas." },
  { icono: "hourglass", t: "Se pierde con el scroll", x: "Una publicación buena dura un día en el muro y después nadie la vuelve a encontrar." },
  { icono: "scroll", t: "Se va con quien la sabe", x: "Cuando alguien mayor ya no está, se va con esa persona lo que sabía del barrio, del oficio o del guiso." },
  { icono: "store", t: "Los negocios no tienen dónde lucirse", x: "Un anuncio suelto se pierde entre mil; en una página de revista se ve y se lee con calma." },
];

const PORQUES = [
  { icono: "zap", t: "Sin fricción", x: "Sin cuenta, sin contraseña, sin instalar nada. Abres y lees." },
  { icono: "clock", t: "Con calma", x: "Una edición por semana, hecha con tiempo y pensada para leerse de principio a fin." },
  { icono: "map-pin", t: "Hecha aquí", x: "Todo el contenido es de Acámbaro y sobre Acámbaro: su gente, su historia, su mesa." },
];

/** Para quién es la revista (píldoras junto a «¿Te resulta familiar?»). */
const LECTORES = [
  { icono: "house", texto: "Gente de Acámbaro" },
  { icono: "plane", texto: "Quienes viven lejos" },
  { icono: "luggage", texto: "Visitantes" },
  { icono: "library", texto: "Curiosos de la historia" },
  { icono: "store", texto: "Negocios locales" },
];

const FORMATOS = [
  { icono: "image", titulo: "Página completa", texto: "Tu arte a sangre, con una franja de contacto: lo primero que se ve al llegar a la página." },
  { icono: "newspaper", titulo: "Media página", texto: "Dos negocios por página, cada uno con su pie de dirección y WhatsApp." },
  { icono: "pencil", titulo: "Contenido patrocinado", texto: "Una nota útil escrita contigo (una guía, una receta, tu historia), claramente marcada como publicidad." },
  { icono: "ticket", titulo: "Cupones", texto: "Promociones que el lector puede tocar y mostrar en tu negocio." },
];

/** Contacto para anunciantes: se define con NEXT_PUBLIC_CONTACTO_ANUNCIOS (un enlace de WhatsApp, un mailto: o una página). */
/** Ediciones de donde salen las páginas de publicidad de muestra (con negocios inventados). Otras ediciones pueden traer marcas reales como demostración: no se usan aquí. */
const EDICIONES_DE_MUESTRA = ["modelismo-ferroviario"];

const CONTACTO_ANUNCIOS = process.env.NEXT_PUBLIC_CONTACTO_ANUNCIOS;

/** Palabras que se prueban (en orden) para el ejemplo del buscador: la primera con resultados reales. */
const BUSQUEDAS_DE_EJEMPLO = ["tren", "Acámbaro", "pan"];

/** Foto del cierre (de la edición 05, con su crédito). */
const FOTO_CIERRE = {
  src: "/media/05/fidelita.jpg",
  credito: "La Fidelita (N. de M. 296), exhibida en Acámbaro. Foto: Mizael Contreras, CC BY-SA 4.0.",
};

const PREGUNTAS = [
  ["¿Necesito crear una cuenta?", "No. Abres el sitio y lees. La única cuenta es opcional: tu correo, si quieres que te avisemos de cada edición."],
  ["¿Cada cuánto sale una edición?", "La idea es una edición por semana. Cada una tiene su número, su fecha y su tema, y se queda en el archivo para leerla cuando quieras."],
  ["¿Puedo leerla en el celular?", "Sí. La revista está hecha para verse bien en cualquier pantalla; en el celular la página se acomoda en una columna."],
  ["¿Cómo encuentro algo que leí antes?", "Con el buscador de la parte de arriba: escribe una palabra y te lleva a la página donde aparece, en cualquier edición."],
  ["¿Quién hace la revista?", "Una persona, con poco tiempo, armando cada página como en una revista impresa. En «El proyecto» se cuenta cómo."],
];

/** Una página de una edición, en pequeño (solo las del lienzo; las de plantillas antiguas no se muestran). */
function Pagina({ ed, n, className = "" }: { ed: Edicion; n: number; className?: string }) {
  const p = ed.paginas[n];
  if (!p || p.plantilla !== "lienzo") return null;
  return (
    <div aria-hidden className={`pointer-events-none overflow-hidden ${className}`}>
      <LienzoVista elementos={p.elementos ?? []} fondo={p.fondo} alto={p.alto} edicionId={ed.id} miniatura />
    </div>
  );
}

/** Lista con palomitas, como en las fichas de funciones. */
function Palomitas({ items }: { items: string[] }) {
  return (
    <ul className="font-sans mt-6 space-y-3 text-[0.95rem]">
      {items.map((t) => (
        <li key={t} className="flex items-start gap-3">
          <span aria-hidden className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-ink text-[0.7rem] font-bold text-paper">
            ✓
          </span>
          {t}
        </li>
      ))}
    </ul>
  );
}

/** Bloque de función: texto a un lado y una imagen grande sobre fondo de color al otro (alternando). */
function Bloque({ icono, kicker, titulo, texto, items, fondo, invertir, children }: {
  icono: string;
  kicker: string;
  titulo: ReactNode;
  texto: string;
  items: string[];
  fondo: string;
  invertir?: boolean;
  children: ReactNode;
}) {
  return (
    <Revelar className="grid items-center gap-10 md:grid-cols-2 md:gap-14">
      <div className={invertir ? "md:order-last" : ""}>
        <span className="grid h-12 w-12 place-items-center rounded-xl" style={{ background: fondo }}>
          <IconoSvg icono={icono} color="#ffffff" trazo={1.8} className="h-6 w-6" />
        </span>
        <p className="kicker mt-5 text-terracota">{kicker}</p>
        <h3 className="font-display mt-2 text-3xl font-black leading-tight sm:text-4xl">{titulo}</h3>
        <p className="mt-4 text-lg text-ink-soft">{texto}</p>
        <Palomitas items={items} />
      </div>
      <div className="relative overflow-hidden rounded-2xl p-6 sm:p-10" style={{ background: fondo }}>
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div aria-hidden className="pointer-events-none absolute -bottom-20 -left-10 h-48 w-48 rounded-full bg-black/10" />
        <div className="relative">{children}</div>
      </div>
    </Revelar>
  );
}

/** Presentación para quien llega por primera vez: qué es la revista y cómo se lee. Quien ya la vio va directo a la portada (ver proxy.ts). */
export default function Bienvenida() {
  const ediciones = getPublicadas();
  const ultima = ediciones[0];
  const paginas = ediciones.reduce((n, e) => n + e.paginas.length, 0);

  // Para hojear: la edición de muestra propia (content/ediciones/muestra-bienvenida.json). Si falta, las últimas publicadas.
  const propia = getEdiciones().filter((e) => e.muestra);
  const muestras = propia.length ? propia.slice(0, 1) : ediciones.slice(0, 3);
  // La revista «en grande» de la portada y de los bloques sale de la muestra (páginas sin anuncios de terceros).
  const vitrina = propia[0];

  // Ejemplo real del buscador: la primera palabra que encuentra algo en las ediciones publicadas.
  let busqueda = { palabra: "", resultados: [] as ReturnType<typeof buscar> };
  for (const palabra of BUSQUEDAS_DE_EJEMPLO) {
    // Un resultado por título (varias páginas de una edición pueden compartirlo).
    const vistosT = new Set<string>();
    const r = buscar(palabra, ediciones, 12)
      .filter((x) => {
        const clave = x.titulo.trim().toLowerCase();
        if (vistosT.has(clave)) return false;
        vistosT.add(clave);
        return true;
      })
      .slice(0, 3);
    if (r.length) {
      busqueda = { palabra, resultados: r };
      break;
    }
  }

  // Páginas de publicidad de muestra (también de borradores), una de cada formato.
  const vistos = new Set<string>();
  const anuncios = getEdiciones()
    .filter((e) => EDICIONES_DE_MUESTRA.includes(e.id))
    .flatMap((e) => e.paginas.filter((p) => p.seccion === "Publicidad" && p.plantilla === "lienzo").map((p) => ({ ed: e, p })))
    .filter(({ p }) => {
      const clave = (p.titulo ?? "").trim().toLowerCase();
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    })
    .slice(0, 4);
  // Página de cupones de muestra (negocios de ejemplo) para el bloque de cupones.
  const cupones = anuncios.find(({ p }) => /cup[oó]n/i.test(p.titulo ?? ""));

  return (
    <>
      <header className="sticky top-0 z-30 border-b-4 border-double border-ink bg-paper/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3">
          <Link href="/bienvenida" aria-label="ACOM-Di, Revista de Acámbaro">
            <Logo className="h-8 w-auto sm:h-12" />
          </Link>
          <MenuSecciones />
          <nav aria-label="En esta página" className="font-sans hidden items-center gap-6 text-sm font-semibold lg:flex">
            {[["#porque", "Por qué"], ["#como", "Cómo funciona"], ["#hojear", "Hojéala"], ["#anunciar", "Negocios"], ["#preguntas-t", "Preguntas"]].map(([h, t]) => (
              <a key={h} href={h} className="hover:text-terracota hover:underline decoration-2 underline-offset-4">{t}</a>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <ThemeToggle className="!h-10 w-10 border border-ink/50" />
            <Link href="/" className="kicker whitespace-nowrap bg-ink px-4 py-2.5 text-paper hover:bg-terracota">
              Entrar<span className="hidden sm:inline"> a la revista</span>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Presentación: centrada, con la revista en grande debajo */}
        <section aria-labelledby="bienvenida-t" className="overflow-hidden">
          <div className="mx-auto max-w-4xl px-5 pt-16 text-center md:pt-24">
            <p className="kicker text-terracota">Te presentamos ACOM-Di</p>
            <h1 id="bienvenida-t" className="font-display mt-5 text-5xl font-black leading-[1.02] sm:text-7xl lg:text-[5.6rem]">
              La revista digital
              <span className="block font-medium italic text-terracota">de Acámbaro</span>
            </h1>
            <p className="mx-auto mt-7 max-w-2xl text-lg text-ink-soft sm:text-xl">
              Cultura, sabor y memoria: la historia, la gastronomía, la gente y los paisajes de Acámbaro, contados cada semana en páginas que se
              pasan como las de una revista.
            </p>
            <div className="mt-9 flex flex-wrap justify-center gap-3">
              <Link href="/" className="kicker bg-ink px-7 py-3.5 text-paper hover:bg-terracota">
                Entrar a la revista →
              </Link>
              <a href="#hojear" className="kicker border border-ink px-7 py-3.5 hover:bg-ink hover:text-paper">
                Hojéala primero
              </a>
            </div>
            <p className="kicker mt-5 text-ink-soft">Sin cuenta · Sin instalar nada · En cualquier pantalla</p>
          </div>

          <div className="relative mx-auto mt-14 max-w-5xl px-5 pb-16 md:mt-16 md:pb-24">
            <div aria-hidden className="absolute inset-x-5 bottom-8 top-[28%] rounded-3xl bg-gradient-to-br from-[#013f4a] via-[#035c40] to-[#49c59f] md:bottom-12" />
            {vitrina ? (
              <a href="#hojear" aria-label="Hojear la edición de muestra" className="group relative flex items-end justify-center">
                <Pagina ed={vitrina} n={2} className="relative -mr-[7%] hidden w-[30%] translate-y-8 -rotate-6 rounded-md shadow-[0_24px_50px_-16px_rgba(0,0,0,0.55)] transition-transform duration-500 group-hover:-rotate-[8deg] sm:block" />
                <Pagina ed={vitrina} n={0} className="relative z-10 w-[72%] rounded-md shadow-[0_34px_70px_-18px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:-translate-y-2 sm:w-[38%]" />
                <Pagina ed={vitrina} n={3} className="relative -ml-[7%] hidden w-[30%] translate-y-8 rotate-6 rounded-md shadow-[0_24px_50px_-16px_rgba(0,0,0,0.55)] transition-transform duration-500 group-hover:rotate-[8deg] sm:block" />
              </a>
            ) : (
              ultima && (
                <Link href={hrefPagina(ultima, 1)} aria-label={`Leer la edición N.º ${ultima.numero}: ${ultima.tema}`} className="relative mx-auto block w-[60%] sm:w-[34%]">
                  <PortadaMini ed={ultima} className="rounded-md shadow-[0_34px_70px_-18px_rgba(0,0,0,0.6)]" />
                </Link>
              )
            )}
            <p className="kicker paleta-clara relative mt-8 text-center text-paper/90 md:mt-10">Así se ve por dentro · hojéala más abajo ↓</p>
          </div>
        </section>

        {/* El problema */}
        <section id="porque" aria-labelledby="problema-t" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16">
          <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
            <div>
              <p className="kicker text-terracota">¿Te resulta familiar?</p>
              <h2 id="problema-t" className="font-display mt-2 text-4xl font-black leading-tight sm:text-5xl">
                Lo mejor de Acámbaro <span className="italic text-terracota">anda disperso</span>
              </h2>
              <p className="mt-5 text-lg text-ink-soft">ACOM-Di junta en un solo lugar lo que vale la pena guardar y lo deja ordenado, con su fecha y su autor.</p>
              <div className="mt-6">
                <h3 className="kicker text-ink-soft">Hecha para</h3>
                <ul className="font-sans mt-3 flex flex-wrap gap-2 text-sm font-semibold">
                  {LECTORES.map((l) => (
                    <li key={l.texto} className="flex items-center gap-2 rounded-full border border-ink/15 bg-paper-deep/60 px-3 py-1.5">
                      <IconoSvg icono={l.icono} color="#068562" trazo={1.8} className="h-4 w-4 shrink-0" />
                      {l.texto}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            <Revelar>
              <ol className="grid overflow-hidden rounded-2xl border border-ink/15 sm:grid-cols-2">
                {PROBLEMAS.map((p, i) => (
                  <li key={p.t} className="relative border-ink/15 p-6 [&:not(:last-child)]:border-b sm:[&:nth-child(odd)]:border-r sm:[&:nth-child(3)]:border-b-0">
                    <span aria-hidden className="font-display absolute right-5 top-2 text-7xl font-black text-ink/[0.07]">{i + 1}</span>
                    <span className="relative grid h-11 w-11 place-items-center rounded-full bg-ink/[0.06]">
                      <IconoSvg icono={p.icono} color="currentColor" trazo={1.7} className="h-5 w-5 text-ink-soft" />
                    </span>
                    <h3 className="font-display relative mt-4 text-xl font-black">{p.t}</h3>
                    <p className="relative mt-2 text-[0.95rem] leading-relaxed text-ink-soft">{p.x}</p>
                  </li>
                ))}
              </ol>
            </Revelar>
          </div>
        </section>

        {/* Qué encontrarás */}
        <section aria-labelledby="temas-t" className="mx-auto max-w-6xl px-5 py-16">
          <p className="kicker text-terracota">Qué encontrarás</p>
          <h2 id="temas-t" className="font-display mt-2 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
            Un pueblo contado <span className="italic">con calma</span>
          </h2>
          <Revelar>
            <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {TEMAS.map((t) => (
                <li key={t.titulo} className="border-t-4 border-terracota pt-4">
                  <IconoSvg icono={t.icono} color="#068562" trazo={1.6} className="h-9 w-9" />
                  <h3 className="font-display mt-3 text-2xl font-black">{t.titulo}</h3>
                  <p className="mt-1 text-ink-soft">{t.texto}</p>
                </li>
              ))}
            </ul>
          </Revelar>
        </section>

        {/* Por qué: sección oscura, con los números reales del archivo */}
        <section aria-labelledby="porques-t" className="paleta-clara bg-[#0b2a30] text-paper">
          <div className="mx-auto max-w-6xl px-5 py-20 text-center">
            <p className="kicker text-[#49c59f]">Por qué ACOM-Di</p>
            <h2 id="porques-t" className="font-display mx-auto mt-2 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
              Hecha para quien valora <span className="font-medium italic text-[#49c59f]">el tiempo y el pueblo</span>
            </h2>
            <Revelar>
              <ul className="mt-12 grid overflow-hidden rounded-2xl border border-paper/15 md:grid-cols-3">
                {PORQUES.map((p) => (
                  <li key={p.t} className="border-paper/15 px-7 py-9 [&:not(:last-child)]:border-b md:[&:not(:last-child)]:border-b-0 md:[&:not(:last-child)]:border-r">
                    <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-white/10">
                      <IconoSvg icono={p.icono} color="#49c59f" trazo={1.7} className="h-6 w-6" />
                    </span>
                    <h3 className="font-display mt-5 text-2xl font-black">{p.t}</h3>
                    <p className="mx-auto mt-2 max-w-xs text-paper/75">{p.x}</p>
                  </li>
                ))}
              </ul>
            </Revelar>
            {ediciones.length > 0 && (
              <dl className="mx-auto mt-12 grid max-w-3xl gap-8 sm:grid-cols-3">
                {[
                  [String(ediciones.length), ediciones.length === 1 ? "edición publicada" : "ediciones publicadas"],
                  [String(paginas), "páginas para leer"],
                  ["0", "cuentas que crear"],
                ].map(([n, t]) => (
                  <div key={t}>
                    <dd className="font-display text-5xl font-black text-[#49c59f] sm:text-6xl">{n}</dd>
                    <dt className="kicker mt-2 text-paper/70">{t}</dt>
                  </div>
                ))}
              </dl>
            )}
            <div className="mt-12 flex flex-wrap justify-center gap-3">
              <Link href="/" className="kicker bg-paper px-7 py-3.5 text-ink hover:bg-[#49c59f]">Entrar a la revista →</Link>
              <a href="#hojear" className="kicker border border-paper/60 px-7 py-3.5 hover:bg-paper hover:text-ink">Hojéala primero</a>
            </div>
          </div>
        </section>

        {/* Cómo funciona: bloques alternados con imagen grande */}
        <section id="como" aria-labelledby="como-t" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-20">
          <div className="text-center">
            <p className="kicker text-terracota">Cómo funciona</p>
            <h2 id="como-t" className="font-display mx-auto mt-2 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
              Se lee como una revista, <span className="italic">en tu pantalla</span>
            </h2>
          </div>
          <div className="mt-16 space-y-24">
            <Bloque
              icono="book-open"
              kicker="En la computadora"
              titulo={<>Pasar la página, <span className="italic">como en papel</span></>}
              texto="Cada edición se hojea: la página gira y entra la siguiente, cada una con su propio movimiento."
              items={["Con la rueda del ratón, las flechas o arrastrando", "Cada página entra con su propio giro", "Fotos grandes, a sangre, como en una revista impresa"]}
              fondo="linear-gradient(135deg, #013f4a, #035c40)"
            >
              {vitrina ? (
                <div className="flex justify-center [perspective:1400px]">
                  <Pagina ed={vitrina} n={1} className="w-1/2 rounded-l-md shadow-[0_20px_40px_-14px_rgba(0,0,0,0.6)]" />
                  <Pagina ed={vitrina} n={2} className="w-1/2 origin-left rounded-r-md shadow-[0_20px_40px_-14px_rgba(0,0,0,0.6)] [transform:rotateY(-18deg)]" />
                </div>
              ) : (
                ultima && <PortadaMini ed={ultima} className="mx-auto w-1/2 rounded-md" />
              )}
            </Bloque>

            {busqueda.resultados.length > 0 && (
              <Bloque
                icono="search"
                kicker="Para encontrar algo"
                titulo={<>Todo se puede <span className="italic">buscar</span></>}
                texto="Escribe una palabra y llegas a la página exacta donde aparece, en cualquier edición."
                items={["Sin importar acentos ni mayúsculas", "En todas las ediciones a la vez", "Te lleva directo a la página"]}
                fondo="linear-gradient(135deg, #a8501c, #d07a3a)"
                invertir
              >
                <div aria-hidden className="pointer-events-none rounded-xl bg-paper p-4 text-ink shadow-[0_24px_50px_-16px_rgba(0,0,0,0.55)] sm:p-5">
                  <div className="font-sans flex items-center gap-3 rounded-lg border border-ink/20 px-4 py-3">
                    <IconoSvg icono="search" color="currentColor" trazo={2} className="h-5 w-5 text-ink-soft" />
                    <span className="font-semibold">{busqueda.palabra}</span>
                    <span className="h-5 w-px animate-pulse bg-ink" />
                  </div>
                  <ol className="mt-3 divide-y divide-ink/10">
                    {busqueda.resultados.map((r) => (
                      <li key={r.href} className="py-3">
                        <p className="kicker text-terracota">N.º {r.numero} · p. {r.pagina}</p>
                        <p className="font-display mt-0.5 text-lg font-black leading-snug">{r.titulo}</p>
                        {r.fragmento.trim() !== r.titulo.trim() && <p className="mt-0.5 line-clamp-2 text-sm text-ink-soft">{r.fragmento}</p>}
                      </li>
                    ))}
                  </ol>
                </div>
                <p className="font-sans mt-3 text-center text-xs text-white/80">Resultados reales del buscador para «{busqueda.palabra}»</p>
              </Bloque>
            )}

            <Bloque
              icono="smartphone"
              kicker="En el celular"
              titulo={<>Hecha también <span className="italic">para el pulgar</span></>}
              texto="En pantallas pequeñas la página se acomoda en una columna para leerla de arriba abajo, sin hacer zoom."
              items={["La página se acomoda sola a tu pantalla", "Modo oscuro para leer de noche", "Aviso por correo de cada edición, si lo quieres"]}
              fondo="linear-gradient(135deg, #068562, #49c59f)"
            >
              <div className="mx-auto w-[min(15rem,70%)] rounded-[2.2rem] border-[8px] border-ink bg-ink shadow-[0_28px_60px_-16px_rgba(0,0,0,0.6)]">
                <div aria-hidden className="mx-auto mb-1 h-1.5 w-14 rounded-full bg-paper/30" />
                <div className="overflow-hidden rounded-[1.5rem] bg-paper">
                  {vitrina ? <Pagina ed={vitrina} n={2} /> : ultima && <PortadaMini ed={ultima} />}
                </div>
              </div>
            </Bloque>

            {cupones && (
              <div id="cupones" className="scroll-mt-24">
              <Bloque
                icono="ticket"
                kicker="Para ahorrar"
                titulo={<>Cupones de los negocios <span className="italic">de Acámbaro</span></>}
                texto="Algunas páginas de la revista traen promociones de negocios de la zona. Las ves al hojear y las aprovechas en la tienda."
                items={["Promociones de negocios locales, dentro de la revista", "Lo muestras desde tu celular en el negocio", "Sin registrarte ni descargar nada"]}
                fondo="linear-gradient(135deg, #7a2e12, #a8501c)"
                invertir
              >
                <div aria-hidden className="pointer-events-none mx-auto w-[min(20rem,85%)] -rotate-2 overflow-hidden rounded-md shadow-[0_28px_60px_-16px_rgba(0,0,0,0.6)]">
                  <LienzoVista elementos={cupones.p.elementos ?? []} fondo={cupones.p.fondo} alto={cupones.p.alto} edicionId={cupones.ed.id} miniatura />
                </div>
                <p className="font-sans mt-5 text-center text-xs text-white/80">Página de muestra: los negocios y las promociones son de ejemplo</p>
              </Bloque>
              </div>
            )}
          </div>
        </section>

        {/* Hojéala aquí */}
        {muestras.length > 0 && (
          <section id="hojear" aria-labelledby="hojear-t" className="scroll-mt-24 bg-paper-deep/60">
            <div className="mx-auto max-w-5xl px-5 py-16">
              <div>
                <p className="kicker text-terracota">Pruébala</p>
                <h2 id="hojear-t" className="font-display mt-2 text-4xl font-black leading-tight sm:text-5xl">
                  Hojéala <span className="italic">aquí mismo</span>
                </h2>
                <p className="mt-5 max-w-lg text-lg text-ink-soft">
                  Es una edición de verdad, hecha para esta presentación: seis páginas para que veas cómo se pasa y cómo se ve, antes de entrar.
                </p>
                <ul className="font-sans mt-6 space-y-2 text-sm">
                  {["Pulsa «Hojear» para abrirla en el marco.", "Desliza o usa las flechas para pasar la página.", "Al final, entra a la revista con un clic."].map((t) => (
                    <li key={t} className="flex gap-2">
                      <span aria-hidden className="text-terracota">→</span>
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
              <Revelar className="mt-10">
                <MuestraHojeable
                  ediciones={muestras.map((e) => ({ id: e.id, numero: e.numero, tema: e.tema }))}
                  portadas={Object.fromEntries(muestras.map((e) => [e.id, <PortadaMini key={e.id} ed={e} />]))}
                />
              </Revelar>
            </div>
          </section>
        )}

        {/* Ediciones para empezar */}
        {ediciones.length > 1 && (
          <section aria-labelledby="empezar-t" className="bg-paper-deep/60">
            <div className="mx-auto max-w-6xl px-5 py-16">
              <p className="kicker text-terracota">Para empezar</p>
              <h2 id="empezar-t" className="font-display mt-2 text-4xl font-black italic sm:text-5xl">Elige una portada</h2>
              <Revelar>
                <ol className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
                  {ediciones.slice(0, 4).map((ed) => (
                    <li key={ed.id}>
                      <Link href={hrefPagina(ed, 1)} className="group block">
                        <PortadaMini ed={ed} className="shadow-[0_14px_36px_-12px_rgba(28,24,20,0.55)] transition-transform group-hover:-translate-y-1" />
                        <span className="font-display mt-3 block text-lg font-bold leading-snug group-hover:underline decoration-terracota decoration-2 underline-offset-4">
                          N.º {ed.numero} · {ed.tema}
                        </span>
                        <span className="kicker mt-1 block text-ink-soft">{fechaLarga(ed.fecha)}</span>
                      </Link>
                    </li>
                  ))}
                </ol>
              </Revelar>
            </div>
          </section>
        )}

        {/* Para anunciantes */}
        <section id="anunciar" aria-labelledby="anunciar-t" className="paleta-clara scroll-mt-24 bg-[#013f4a] text-paper">
          <div className="mx-auto max-w-6xl px-5 py-16">
            <p className="kicker text-[#49c59f]">Para negocios</p>
            <h2 id="anunciar-t" className="font-display mt-2 max-w-3xl text-4xl font-black leading-tight sm:text-5xl">
              Tu negocio, en una revista <span className="italic">que se lee</span>
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-paper/85">
              Quien abre ACOM-Di viene a leer sobre Acámbaro: justo la gente que le interesa lo que se hace aquí.
            </p>
            <aside className="mt-6 flex max-w-3xl items-start gap-4 rounded-2xl border border-[#49c59f]/40 bg-white/[0.08] p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[#49c59f]/20">
                <IconoSvg icono="book-open" color="#49c59f" trazo={1.7} className="h-6 w-6" />
              </span>
              <div>
                <h3 className="font-display text-xl font-black">Tu anuncio es una página más, no un estorbo</h3>
                <p className="mt-1 text-[0.95rem] leading-relaxed text-paper/85">
                  No salta encima del texto ni tapa la lectura: el lector lo encuentra al pasar la hoja, como en una revista impresa, y va marcado como publicidad.
                </p>
              </div>
            </aside>
            <Revelar>
              <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {FORMATOS.map((x) => (
                  <li key={x.titulo} className="rounded-2xl border border-paper/20 bg-white/5 p-6">
                    <IconoSvg icono={x.icono} color="#49c59f" trazo={1.6} className="h-8 w-8" />
                    <h3 className="font-display mt-3 text-xl font-black">{x.titulo}</h3>
                    <p className="mt-1 text-[0.92rem] leading-relaxed text-paper/80">{x.texto}</p>
                  </li>
                ))}
              </ul>
            </Revelar>
            {anuncios.length > 0 && (
              <>
                <h3 className="kicker mt-12 text-paper/80">Así se ven (páginas de muestra; los negocios son de ejemplo)</h3>
                <Revelar>
                  <ol className="mt-4 grid grid-cols-2 gap-5 sm:grid-cols-4">
                    {anuncios.map(({ ed, p }) => (
                      <li key={`${ed.id}-${p.titulo}`}>
                        <div aria-hidden className="pointer-events-none overflow-hidden rounded-md shadow-[0_14px_36px_-10px_rgba(0,0,0,0.6)]">
                          <LienzoVista elementos={p.elementos ?? []} fondo={p.fondo} alto={p.alto} edicionId={ed.id} miniatura />
                        </div>
                        <span className="kicker mt-2 block text-paper/80">{p.titulo?.replace(/^Anuncios? · /, "")}</span>
                      </li>
                    ))}
                  </ol>
                </Revelar>
              </>
            )}
            <div className="mt-10 flex flex-wrap items-center gap-4">
              {CONTACTO_ANUNCIOS ? (
                <a href={CONTACTO_ANUNCIOS} className="kicker bg-[#49c59f] px-7 py-3.5 text-ink hover:bg-paper">
                  Quiero anunciarme →
                </a>
              ) : (
                <p className="font-sans text-sm text-paper/80">Pronto: aquí irán los datos de contacto para anunciarte.</p>
              )}
              <p className="font-sans text-sm text-paper/70">Escríbenos y te mostramos precios y fechas.</p>
            </div>
          </div>
        </section>

        {/* Dos formas de estar */}
        <section aria-labelledby="planes-t" className="mx-auto max-w-5xl px-5 py-16">
          <p className="kicker text-terracota">Para todos</p>
          <h2 id="planes-t" className="font-display mt-2 text-4xl font-black leading-tight sm:text-5xl">
            Leer es gratis. <span className="italic">Anunciarte, a tu medida.</span>
          </h2>
          <Revelar className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border-2 border-ink p-7">
              <p className="kicker text-terracota">Lectores</p>
              <p className="font-display mt-1 text-5xl font-black">Gratis</p>
              <p className="font-sans mt-1 text-sm text-ink-soft">Siempre, sin tarjeta ni cuenta</p>
              <ul className="font-sans mt-5 space-y-2 text-sm">
                {["Todas las ediciones y todo el archivo", "Buscador por palabra", "Aviso por correo de cada edición (opcional)", "Se lee en cualquier pantalla"].map((t) => (
                  <li key={t} className="flex gap-2"><span aria-hidden className="text-terracota">✓</span>{t}</li>
                ))}
              </ul>
              <Link href="/" className="kicker mt-6 inline-block bg-ink px-6 py-3 text-paper hover:bg-terracota">Entrar a la revista →</Link>
            </div>
            <div className="rounded-2xl border-2 border-terracota bg-paper-deep/60 p-7">
              <p className="kicker text-terracota">Negocios</p>
              <p className="font-display mt-1 text-5xl font-black">A tu medida</p>
              <p className="font-sans mt-1 text-sm text-ink-soft">Precios y fechas según el formato</p>
              <ul className="font-sans mt-5 space-y-2 text-sm">
                {["Página completa, media página o contenido patrocinado", "Cupones que el lector puede mostrar", "Tu dirección y WhatsApp en la misma página", "Marcado claramente como publicidad"].map((t) => (
                  <li key={t} className="flex gap-2"><span aria-hidden className="text-terracota">✓</span>{t}</li>
                ))}
              </ul>
              <a href={CONTACTO_ANUNCIOS ?? "#anunciar"} className="kicker mt-6 inline-block bg-terracota px-6 py-3 text-paper hover:bg-ink">Quiero anunciarme →</a>
            </div>
          </Revelar>
        </section>

        {/* Preguntas */}
        <section aria-labelledby="preguntas-t" className="mx-auto grid max-w-6xl scroll-mt-24 gap-10 px-5 pb-24 pt-4 md:grid-cols-[1fr_1.6fr] md:gap-16">
          <div>
            <p className="kicker text-terracota">Preguntas frecuentes</p>
            <h2 id="preguntas-t" className="font-display mt-2 text-4xl font-black leading-tight sm:text-5xl">
              Antes de <span className="italic">entrar</span>
            </h2>
            <p className="mt-4 text-ink-soft">Ya respondimos lo que más nos preguntan, para que no tengas que preguntar.</p>
          </div>
          <div className="space-y-2">
            {PREGUNTAS.map(([p, r], i) => (
              <details key={p} open={i === 0} className="group rounded-xl border-b border-ink/15 px-5 transition-colors open:border-transparent open:bg-paper-deep/80">
                <summary className="font-display flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-bold sm:text-xl [&::-webkit-details-marker]:hidden">
                  {p}
                  <IconoSvg icono="chevron-down" color="currentColor" trazo={2} className="h-5 w-5 shrink-0 text-ink-soft transition-transform group-open:rotate-180" />
                </summary>
                <p className="-mt-1 pb-5 text-ink-soft">{r}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Cierre: foto a sangre, una frase y la tarjeta para entrar */}
        <section aria-labelledby="cierre-t" className="paleta-clara relative isolate overflow-hidden text-paper">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={FOTO_CIERRE.src} alt="" className="absolute inset-0 -z-10 h-full w-full object-cover" />
          <div aria-hidden className="absolute inset-0 -z-10 bg-gradient-to-b from-[#013f4a]/45 via-[#013f4a]/60 to-[#013f4a]/95" />
          <div className="mx-auto max-w-5xl px-5 pb-10 pt-28 md:pt-40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo-claro.svg" alt="" className="mx-auto h-14 w-auto brightness-0 invert sm:h-16" />
            <p className="font-display mx-auto mt-8 max-w-3xl text-center text-4xl font-medium italic leading-tight sm:text-6xl">
              «Un pueblo que se cuenta no se olvida».
            </p>
            <Revelar className="mt-16 grid gap-10 rounded-2xl bg-paper p-7 text-ink shadow-[0_30px_80px_-20px_rgba(0,0,0,0.6)] md:mt-24 md:grid-cols-[1.1fr_1fr] md:p-10">
              <div>
                <h2 id="cierre-t" className="font-display text-3xl font-black leading-tight sm:text-4xl">
                  Pasa la <span className="italic text-terracota">primera página</span>
                </h2>
                <p className="mt-3 text-ink-soft">La próxima vez que vengas, te llevamos directo a la portada de la revista.</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/" className="kicker bg-ink px-7 py-3.5 text-paper hover:bg-terracota">
                    Entrar a la revista →
                  </Link>
                  <Link href="/proyecto" className="kicker border border-ink px-7 py-3.5 hover:bg-ink hover:text-paper">
                    El proyecto
                  </Link>
                </div>
              </div>
              <div className="md:border-l md:border-ink/15 md:pl-10">
                <h3 className="font-display text-2xl font-black">¿Prefieres que te avisemos?</h3>
                <p className="mt-1 text-ink-soft">Deja tu correo y te llega un aviso cuando sale una edición nueva. Puedes darte de baja con un clic.</p>
                <FormSuscripcion className="mt-4" />
              </div>
              <footer className="relative overflow-hidden border-t border-ink/15 pt-8 md:col-span-2">
                <div className="grid gap-8 sm:grid-cols-3">
                  {[
                    ["La revista", [["/", "Portada"], ["/ediciones", "Todas las ediciones"], ["/buscar", "Buscar"]]],
                    ["Quédate", [["/suscribirse", "Newsletter"], ["#hojear", "Hojear la muestra"]]],
                    ["El proyecto", [["/proyecto", "Cómo se hace"], ["#anunciar", "Anúnciate"], ["#preguntas-t", "Preguntas"]]],
                  ].map(([titulo, enlaces]) => (
                    <nav key={titulo as string} aria-label={titulo as string}>
                      <p className="font-sans text-sm font-bold">{titulo as string}</p>
                      <ul className="font-sans mt-3 space-y-2 text-sm text-ink-soft">
                        {(enlaces as string[][]).map(([href, t]) => (
                          <li key={href}>
                            <a href={href} className="hover:text-terracota hover:underline">{t}</a>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  ))}
                </div>
                <p className="font-sans mt-8 text-xs text-ink-soft">© 2026 · Hecho en Michoacán</p>
                <p aria-hidden className="font-display pointer-events-none -mb-[0.22em] mt-4 select-none whitespace-nowrap text-center text-[clamp(3rem,13vw,9.5rem)] font-black leading-none text-ink/[0.06]">
                  ACOM-Di
                </p>
              </footer>
            </Revelar>
            <p className="font-sans mt-4 text-right text-xs text-paper/75">{FOTO_CIERRE.credito}</p>
          </div>
        </section>
      </main>
    </>
  );
}
