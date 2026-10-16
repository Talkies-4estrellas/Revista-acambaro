import type { Metadata } from "next";
import Link from "next/link";
import Masthead from "@/components/Masthead";
import Footer from "@/components/Footer";
import PortadaMini from "@/components/PortadaMini";
import { IconoSvg } from "@/components/Lienzo";
import { getPublicadas, hrefPagina } from "@/lib/ediciones";

export const metadata: Metadata = {
  title: "El proyecto — ACOM-Di, Revista de Acámbaro",
  description: "Cómo se hace y qué incluye ACOM-Di: una revista digital semanal que se lee como una revista y se arma arrastrando y soltando.",
};
export const revalidate = 60;

const LECTOR = [
  { icono: "book-open", titulo: "Páginas que se pasan", texto: "Rueda, arrastre, flechas o toque. Cada página decide por dónde entra: izquierda, derecha, arriba, abajo o fundido." },
  { icono: "smartphone", titulo: "Hecha para el celular", texto: "La hoja se reduce o se apila en una columna, con las secciones y el orden que elige quien publica." },
  { icono: "search", titulo: "Buscador", texto: "Encuentra cualquier palabra en todas las ediciones, sin acentos ni mayúsculas, con el fragmento resaltado." },
  { icono: "mail", titulo: "Newsletter", texto: "Formulario de suscripción, baja con un clic y un correo listo para enviar con cada edición." },
];

const EDITOR = [
  { icono: "pencil", titulo: "Lienzo libre", texto: "Arrastra texto, fotos, video, formas e iconos. Selección múltiple, grupos, alinear, guías, reglas y deshacer." },
  { icono: "palette", titulo: "Diseño de revista", texto: "18 tipografías, estilos por tramo de texto, 197 iconos y 22 marcos de recorte para fotos." },
  { icono: "sparkles", titulo: "Animaciones", texto: "9 efectos de entrada por elemento, con duración y retraso, que se reproducen al llegar a la vista." },
  { icono: "image", titulo: "Plantillas", texto: "Guarda cualquier página como plantilla y reutilízala en todas las ediciones. Copia y pega entre páginas." },
  { icono: "clock", titulo: "Publicación programada", texto: "Elige día y hora: la edición aparece sola, y el número se asigna en orden de publicación." },
  { icono: "hash", titulo: "Numeración automática", texto: "Los borradores no cuentan hasta que se publican, y una edición ya publicada conserva su número." },
];

const DEMO = [
  { href: "/", texto: "Portada del sitio: la última edición y el archivo." },
  { href: "/ediciones/06/1", texto: "Una edición completa: pasa páginas con la rueda o las flechas." },
  { href: "/ediciones/07/6", texto: "Una página con fotos, texto y créditos, como en una revista impresa." },
  { href: "/buscar?q=acueducto", texto: "El buscador en acción." },
  { href: "/suscribirse", texto: "La suscripción al newsletter." },
];

const Seccion = ({ id, kicker, titulo, children, oscuro = false }: { id: string; kicker: string; titulo: string; children: React.ReactNode; oscuro?: boolean }) => (
  <section id={id} aria-labelledby={`${id}-t`} className={oscuro ? "paleta-clara bg-[#035c40] text-paper" : ""}>
    <div className="mx-auto max-w-6xl px-5 py-16">
      <p className={`kicker ${oscuro ? "text-[#49c59f]" : "text-terracota"}`}>{kicker}</p>
      <h2 id={`${id}-t`} className="font-display mt-2 max-w-3xl text-4xl font-black italic leading-tight sm:text-5xl">
        {titulo}
      </h2>
      <div className="mt-8">{children}</div>
    </div>
  </section>
);

const Tarjetas = ({ lista, oscuro = false }: { lista: { icono: string; titulo: string; texto: string }[]; oscuro?: boolean }) => (
  <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
    {lista.map((f) => (
      <li key={f.titulo} className={`border p-5 ${oscuro ? "border-paper/25 bg-white/5" : "border-ink/25 bg-white/40"}`}>
        <IconoSvg icono={f.icono} color={oscuro ? "#49c59f" : "#068562"} trazo={1.6} className="h-9 w-9" />
        <h3 className="font-display mt-3 text-xl font-black">{f.titulo}</h3>
        <p className={`mt-1 text-[0.95rem] leading-relaxed ${oscuro ? "text-paper/80" : "text-ink-soft"}`}>{f.texto}</p>
      </li>
    ))}
  </ul>
);

export default function Proyecto() {
  const ediciones = getPublicadas();
  return (
    <>
      <Masthead compact />
      <main>
        {/* Portada del proyecto */}
        <section className="paleta-clara bg-[#013f4a] text-paper">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-[1.3fr_1fr] md:py-24">
            <div>
              <p className="kicker text-[#49c59f]">El proyecto</p>
              <h1 className="font-display mt-3 text-5xl font-black italic leading-[1.02] sm:text-6xl lg:text-7xl">Una revista digital que se lee como una revista</h1>
              <p className="mt-5 max-w-xl text-lg text-paper/85">
                ACOM-Di cuenta la historia, el sabor y la gente de Acámbaro cada semana. Una sola persona la arma, página por página, arrastrando y
                soltando, sin escribir código.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href="/" className="kicker bg-[#49c59f] px-6 py-3 text-ink hover:bg-paper">
                  Ver la revista →
                </Link>
                <a href="#demo" className="kicker border border-paper/60 px-6 py-3 hover:bg-paper hover:text-ink">
                  Recorrido de 5 minutos
                </a>
              </div>
            </div>
            <div className="mx-auto flex max-w-xs justify-center gap-3">
              {ediciones.slice(0, 2).map((ed, i) => (
                <Link key={ed.id} href={hrefPagina(ed, 1)} aria-label={`Leer ${ed.tema}`} className={`block w-1/2 ${i === 1 ? "mt-8" : ""}`}>
                  <PortadaMini ed={ed} className="shadow-[0_20px_50px_-10px_rgba(0,0,0,0.6)]" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <Seccion id="idea" kicker="La idea" titulo="Publicar cada semana, con calidad de revista y sin depender de nadie">
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["Quién la hace", "Una persona, con poco tiempo. Por eso cada edición es un archivo sencillo y el panel hace el trabajo pesado."],
              ["Qué la distingue", "No es un blog ni un PDF: cada página se diseña a mano como en una revista y se pasa con animación."],
              ["Cómo llega", "Un sitio web que funciona en cualquier pantalla y un newsletter que avisa de cada edición nueva."],
            ].map(([t, x]) => (
              <div key={t} className="border-t-4 border-terracota pt-3">
                <h3 className="font-display text-2xl font-black">{t}</h3>
                <p className="mt-2 text-ink-soft">{x}</p>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion id="lector" kicker="Lo que ve el lector" titulo="Leer, buscar y suscribirse" oscuro>
          <Tarjetas lista={LECTOR} oscuro />
          {ediciones.length > 0 && (
            <ol className="mt-10 grid grid-cols-2 gap-5 sm:grid-cols-4">
              {ediciones.slice(0, 4).map((ed) => (
                <li key={ed.id}>
                  <Link href={hrefPagina(ed, 1)} className="group block">
                    <PortadaMini ed={ed} className="shadow-[0_14px_36px_-10px_rgba(0,0,0,0.6)] transition-transform group-hover:-translate-y-1" />
                    <span className="kicker mt-2 block text-paper/80">
                      N.º {ed.numero} · {ed.tema}
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </Seccion>

        <Seccion id="editor" kicker="Lo que usa quien publica" titulo="Un editor de páginas con las herramientas de un diseñador">
          <Tarjetas lista={EDITOR} />
          <p className="font-sans mt-6 max-w-2xl text-sm text-ink-soft">
            El panel de edición funciona hoy en el equipo de quien publica. Llevarlo a internet, con inicio de sesión, es la siguiente fase.
          </p>
        </Seccion>

        <Seccion id="tecnica" kicker="Por dentro" titulo="Simple de mantener, barata de alojar" oscuro>
          <div className="grid gap-6 md:grid-cols-3">
            {[
              ["Cada edición es un archivo", "Páginas, textos y posiciones viven en un JSON legible. Se respalda, se copia y se versiona como cualquier archivo."],
              ["Tecnología actual", "Next.js 16, React 19, TypeScript y Tailwind. Se despliega en Vercel y las páginas se regeneran solas cada minuto."],
              ["Sin base de datos", "Para empezar no hace falta servidor de datos ni costos fijos: el panel guarda archivos y el sitio los publica."],
            ].map(([t, x]) => (
              <div key={t} className="border-t-4 border-[#49c59f] pt-3">
                <h3 className="font-display text-2xl font-black">{t}</h3>
                <p className="mt-2 text-paper/80">{x}</p>
              </div>
            ))}
          </div>
        </Seccion>

        <Seccion id="ruta" kicker="Hoja de ruta" titulo="Lo que ya está y lo que sigue">
          <div className="grid gap-8 md:grid-cols-2">
            <div>
              <h3 className="kicker text-oliva">Ya está</h3>
              <ul className="font-sans mt-3 space-y-2 text-sm">
                {["Lectura con giro de página y modo celular", "Editor de lienzo con plantillas, animaciones y orden en el celular", "Numeración y publicación programada", "Newsletter: alta, baja, exportación y correo de cada edición", "Búsqueda en todas las ediciones", "Nueve ediciones de muestra, más de 120 páginas"].map((x) => (
                  <li key={x} className="flex gap-2">
                    <span aria-hidden className="text-oliva">✓</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="kicker text-terracota">Sigue</h3>
              <ul className="font-sans mt-3 space-y-2 text-sm">
                {["Panel en línea con inicio de sesión (Supabase)", "Envío automático del newsletter", "Estadísticas de lectura", "Versión descargable en PDF", "Imagen para compartir cada edición en redes"].map((x) => (
                  <li key={x} className="flex gap-2">
                    <span aria-hidden className="text-terracota">→</span>
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Seccion>

        <section id="demo" aria-labelledby="demo-t" className="border-t-4 border-double border-ink bg-paper-deep/60">
          <div className="mx-auto max-w-4xl px-5 py-16">
            <p className="kicker text-terracota">Pruébalo</p>
            <h2 id="demo-t" className="font-display mt-2 text-4xl font-black italic sm:text-5xl">Recorrido de 5 minutos</h2>
            <ol className="mt-8">
              {DEMO.map((d, i) => (
                <li key={d.href} className="border-t border-ink/60">
                  <Link href={d.href} className="group grid grid-cols-[3rem_1fr_auto] items-baseline gap-3 py-4">
                    <span className="font-display text-3xl font-black text-terracota">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-lg group-hover:underline decoration-terracota decoration-2 underline-offset-4">{d.texto}</span>
                    <span aria-hidden className="kicker text-terracota">Abrir →</span>
                  </Link>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
