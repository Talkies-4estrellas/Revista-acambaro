import type { Ancho, Bloque, Medio, VideoData } from "@/lib/ediciones";
import FormSuscripcion from "./FormSuscripcion";
import Placeholder from "./Placeholder";

const RATIO: Record<string, string> = {
  "16/9": "aspect-video",
  "16/10": "aspect-[16/10]",
  "21/9": "aspect-[21/9]",
  "4/3": "aspect-[4/3]",
  "1/1": "aspect-square",
  "3/4": "aspect-[3/4]",
};

const ANCHO: Record<Ancho, string> = {
  columna: "max-w-2xl px-5",
  ancho: "max-w-5xl px-5",
  completo: "max-w-none px-0",
};

/** **negrita** y *cursiva* dentro de un texto. */
export function Inline({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (/^\*\*[^*]+\*\*$/.test(p)) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (/^\*[^*]+\*$/.test(p)) return <em key={i}>{p.slice(1, -1)}</em>;
        return p;
      })}
    </>
  );
}

/** Imagen o gif. Sin `src` dibuja una ilustración provisional. */
export function Imagen({
  m,
  className = "",
  sinEtiqueta = false,
}: {
  m: Medio;
  className?: string;
  sinEtiqueta?: boolean;
}) {
  const ratio = m.proporcion ? RATIO[m.proporcion] : undefined;
  if (m.src) {
    if (!ratio)
      // eslint-disable-next-line @next/next/no-img-element
      return <img src={m.src} alt={m.alt ?? ""} loading="lazy" className={`block h-auto w-full ${className}`} />;
    return (
      <div className={`relative overflow-hidden bg-paper-deep ${ratio} ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={m.src} alt={m.alt ?? ""} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
      </div>
    );
  }
  return (
    <Placeholder
      tone={m.tono ?? "terracota"}
      label={m.alt ?? "Imagen"}
      showLabel={!sinEtiqueta}
      className={`${ratio ?? "aspect-video"} ${className}`}
    />
  );
}

export function Video({ v, className = "" }: { v: VideoData; className?: string }) {
  const box = `relative aspect-video w-full overflow-hidden bg-ink ${className}`;
  if (v.youtube)
    return (
      <div className={box}>
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${v.youtube}`}
          title={v.pie ?? "Video"}
          allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  if (v.vimeo)
    return (
      <div className={box}>
        <iframe
          src={`https://player.vimeo.com/video/${v.vimeo}`}
          title={v.pie ?? "Video"}
          allow="fullscreen; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="absolute inset-0 h-full w-full"
        />
      </div>
    );
  if (v.src)
    return (
      <video
        src={v.src}
        poster={v.poster}
        className={`block aspect-video w-full bg-ink ${className}`}
        playsInline
        preload="metadata"
        {...(v.animado
          ? { autoPlay: true, muted: true, loop: true }
          : { controls: true })}
      />
    );
  return (
    <div className={`${box} flex items-center justify-center text-paper`} role="img" aria-label="Video pendiente">
      <div className="text-center">
        <p className="font-display text-5xl">▶</p>
        <p className="kicker mt-2 opacity-70">Video pendiente</p>
      </div>
    </div>
  );
}

function Figura({
  ancho = "columna",
  pie,
  children,
}: {
  ancho?: Ancho;
  pie?: string;
  children: React.ReactNode;
}) {
  return (
    <figure className={`mx-auto my-8 w-full ${ANCHO[ancho]}`}>
      {children}
      {pie && (
        <figcaption className={`font-sans mt-2 text-xs text-ink-soft ${ancho === "completo" ? "px-5" : ""}`}>
          {pie}
        </figcaption>
      )}
    </figure>
  );
}

const COLUMNAS: Record<number, string> = {
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
};

export function Galeria({ imagenes, columnas = 2 }: { imagenes: Medio[]; columnas?: 2 | 3 }) {
  return (
    <div className={`grid gap-x-5 gap-y-8 ${COLUMNAS[columnas]}`}>
      {imagenes.map((m, i) => (
        <figure key={i}>
          <Imagen m={m} />
          {m.pie && <figcaption className="font-sans mt-2 text-xs text-ink-soft">{m.pie}</figcaption>}
        </figure>
      ))}
    </div>
  );
}

export function Suscripcion({ titulo, texto }: { titulo?: string; texto?: string }) {
  return (
    <section
      id="suscripcion"
      className="mx-auto my-10 max-w-3xl border-4 border-double border-ink bg-paper-deep px-6 py-10 text-center"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/emblema.svg" alt="" className="mx-auto mb-3 h-14 w-auto" />
      <h2 className="font-display text-3xl font-black sm:text-4xl">{titulo ?? "Recibe la próxima edición"}</h2>
      <p className="mx-auto mt-2 max-w-md text-ink-soft">
        {texto ?? "Un correo con las historias y fechas de cada edición. Sin ruido."}
      </p>
      <FormSuscripcion className="relative mx-auto mt-5 max-w-md" />
    </section>
  );
}

export default function Bloques({
  bloques,
  capitularPrimero = false,
}: {
  bloques: Bloque[];
  capitularPrimero?: boolean;
}) {
  let primerTexto = true;
  return (
    <div className="text-lg leading-[1.75]">
      {bloques.map((b, i) => {
        switch (b.tipo) {
          case "texto": {
            const capitular = b.capitular ?? (capitularPrimero && primerTexto);
            primerTexto = false;
            return (
              <div key={i} className="mx-auto my-5 max-w-2xl px-5">
                {b.parrafos.map((p, j) => (
                  <p key={j} className={`mt-5 first:mt-0 ${capitular && j === 0 ? "drop-cap" : ""}`}>
                    <Inline text={p} />
                  </p>
                ))}
              </div>
            );
          }
          case "subtitulo":
            return (
              <h2 key={i} className="font-display mx-auto mt-10 max-w-2xl px-5 text-2xl font-black leading-tight sm:text-3xl">
                {b.texto}
              </h2>
            );
          case "imagen":
          case "gif":
            return (
              <Figura key={i} ancho={b.ancho} pie={b.pie}>
                <Imagen m={b} />
              </Figura>
            );
          case "video":
            return (
              <Figura key={i} ancho={b.ancho} pie={b.pie}>
                <Video v={b} />
              </Figura>
            );
          case "cita":
            return (
              <blockquote
                key={i}
                className="mx-auto my-10 max-w-3xl border-l-4 border-terracota px-5 pl-6"
              >
                <p className="font-display text-2xl font-bold italic leading-snug sm:text-3xl">“{b.texto}”</p>
                {b.autor && <footer className="kicker mt-3 text-ink-soft">{b.autor}</footer>}
              </blockquote>
            );
          case "lista": {
            const Tag = b.ordenada ? "ol" : "ul";
            return (
              <Tag
                key={i}
                className={`mx-auto my-5 max-w-2xl space-y-1 px-5 pl-10 ${b.ordenada ? "list-decimal" : "list-disc"}`}
              >
                {b.items.map((it, j) => (
                  <li key={j}><Inline text={it} /></li>
                ))}
              </Tag>
            );
          }
          case "galeria":
            return (
              <div key={i} className="mx-auto my-8 max-w-5xl px-5">
                <Galeria imagenes={b.imagenes} columnas={b.columnas} />
              </div>
            );
          case "agenda":
            return (
              <ul key={i} className="mx-auto my-8 max-w-2xl px-5">
                {b.eventos.map((e) => (
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
            );
          case "separador":
            return <hr key={i} className="mx-auto my-10 w-24 border-t-4 border-double border-ink" />;
          case "suscripcion":
            return <Suscripcion key={i} titulo={b.titulo} texto={b.texto} />;
        }
      })}
    </div>
  );
}
