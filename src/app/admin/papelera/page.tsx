import { listarPapelera } from "@/lib/admin-extra";
import BotonRecuperar from "./BotonRecuperar";

const peso = (b: number) => (b >= 1024 * 1024 ? `${(b / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(b / 1024))} KB`);
const fecha = (ms: number) =>
  new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "America/Mexico_City" }).format(new Date(ms));

/** Papelera: ediciones borradas y archivos de medios quitados, con un botón para recuperarlos. */
export default function Papelera() {
  const todo = listarPapelera();
  const ediciones = todo.filter((x) => x.tipo === "edicion");
  const medios = todo.filter((x) => x.tipo === "medio");

  return (
    <main className="mx-auto max-w-5xl px-5 py-8">
      <h1 className="font-display text-5xl font-black italic">Papelera</h1>
      <p className="font-sans mt-2 max-w-2xl text-sm text-ink-soft">
        Lo que borras desde el panel no se pierde: viene aquí (<code>content/papelera</code> y <code>content/papelera-medios</code>). «Recuperar» lo devuelve a su
        lugar; si ya hay otro con el mismo nombre, vuelve como «…-recuperada». Una edición recuperada vuelve como borrador.
      </p>

      <section id="ediciones" aria-label="Ediciones borradas" className="mt-10 scroll-mt-20">
        <h2 className="font-display border-b border-ink pb-2 text-2xl font-black">
          Ediciones <span className="text-terracota">{ediciones.length}</span>
        </h2>
        {ediciones.length === 0 ? (
          <p className="font-sans py-4 text-sm italic text-ink-soft">No hay ediciones en la papelera.</p>
        ) : (
          <ul>
            {ediciones.map((x) =>
              x.tipo !== "edicion" ? null : (
                <li key={x.archivo} className="flex flex-wrap items-center justify-between gap-3 border-b border-ink/15 py-3">
                  <div className="min-w-0">
                    <p className="font-display text-lg font-bold">{x.tema ?? `Edición “${x.id}”`}</p>
                    <p className="font-sans text-xs text-ink-soft">
                      archivo {x.id}.json · {x.paginas ?? "?"} págs.{x.numero ? ` · conservaba la N.º ${x.numero}` : ""} · borrada el {fecha(x.borrado)}
                    </p>
                  </div>
                  <BotonRecuperar tipo="edicion" archivo={x.archivo} nombre={x.tema ?? x.id} />
                </li>
              ),
            )}
          </ul>
        )}
      </section>

      <section id="medios" aria-label="Fotos y videos quitados" className="mt-12 scroll-mt-20">
        <h2 className="font-display border-b border-ink pb-2 text-2xl font-black">
          Fotos y videos <span className="text-terracota">{medios.length}</span>
        </h2>
        {medios.length === 0 ? (
          <p className="font-sans py-4 text-sm italic text-ink-soft">No hay fotos ni videos en la papelera.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {medios.map((x) =>
              x.tipo !== "medio" ? null : (
                <li key={x.archivo} className="flex flex-col rounded-lg border border-ink/15 p-2">
                  <div className="grid aspect-[4/3] place-items-center overflow-hidden rounded bg-ink/[0.06] text-xs text-ink-soft">
                    {x.esImagen ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={`/api/admin/papelera/vista?archivo=${encodeURIComponent(x.archivo)}`} alt="" className="h-full w-full object-cover" loading="lazy" />
                    ) : (
                      "Video"
                    )}
                  </div>
                  <p className="font-sans mt-2 truncate text-xs font-bold" title={x.nombre}>
                    {x.nombre}
                  </p>
                  <p className="font-sans text-[0.7rem] text-ink-soft">
                    carpeta {x.carpeta} · {peso(x.bytes)} · {fecha(x.borrado)}
                  </p>
                  <div className="mt-2">
                    <BotonRecuperar tipo="medio" archivo={x.archivo} nombre={x.nombre} />
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </section>
    </main>
  );
}
