import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getEdiciones } from "@/lib/ediciones";
import { leerAnunciantes, numerosDe } from "@/lib/anunciantes";
import LienzoVista from "@/components/Lienzo";
import BotonImprimir from "./BotonImprimir";

export const metadata: Metadata = { title: "Reporte de publicidad — ACOM-Di" };

const numero = (n: number) => new Intl.NumberFormat("es-MX").format(n);
const porcentaje = (t: number | null) => (t === null ? "—" : `${(t * 100).toLocaleString("es-MX", { maximumFractionDigits: 1 })} %`);
const fechaLarga = (iso: string) => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${iso}T12:00:00Z`));

/** Barras de vistas (y clics encima) de los últimos 30 días, en SVG para que se imprima bien. */
function Grafica({ dias }: { dias: { dia: string; vistas: number; clics: number }[] }) {
  const max = Math.max(1, ...dias.map((d) => d.vistas));
  const W = 600;
  const H = 140;
  const ancho = W / dias.length;
  return (
    <svg viewBox={`0 0 ${W} ${H + 22}`} role="img" aria-label="Vistas y clics por día, últimos 30 días" className="h-auto w-full">
      {[0.5, 1].map((f) => (
        <line key={f} x1={0} x2={W} y1={H - H * f} y2={H - H * f} stroke="#cbd5e1" strokeDasharray="3 4" strokeWidth={1} />
      ))}
      {dias.map((d, i) => {
        const hv = (d.vistas / max) * (H - 6);
        const hc = (d.clics / max) * (H - 6);
        return (
          <g key={d.dia}>
            <title>{`${d.dia}: ${d.vistas} vistas, ${d.clics} clics`}</title>
            <rect x={i * ancho + 2} y={H - hv} width={ancho - 4} height={hv} rx={2} fill="#49c59f" />
            {d.clics > 0 && <rect x={i * ancho + 2} y={H - hc} width={ancho - 4} height={hc} rx={2} fill="#013f4a" />}
          </g>
        );
      })}
      <line x1={0} x2={W} y1={H} y2={H} stroke="#94a3b8" strokeWidth={1} />
      {[0, 14, 29].map((i) => (
        <text key={i} x={i * ancho + ancho / 2} y={H + 16} fontSize={11} textAnchor={i === 0 ? "start" : i === 29 ? "end" : "middle"} fill="#475569">
          {dias[i] ? new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(`${dias[i].dia}T12:00:00Z`)) : ""}
        </text>
      ))}
    </svg>
  );
}

/** Reporte para el anunciante: sus anuncios y sus números, listo para imprimir o guardar en PDF y mandárselo. */
export default async function Reporte({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = leerAnunciantes().find((x) => x.id === id);
  if (!a) notFound();
  const ediciones = getEdiciones();
  const n = numerosDe(a, { ediciones });
  const hoy = new Date().toISOString().slice(0, 10);
  const desde = n.dias[0]?.dia ?? hoy;
  const conDatos = n.anuncios.filter((x) => x.existe && x.publicada);

  return (
    <div className="paleta-clara min-h-screen bg-[#e9edf2] py-8 text-ink print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-[52rem] justify-end gap-2 px-5 print:hidden">
        <a href="/admin/anunciantes" className="font-sans border border-ink px-3 py-2 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-paper">
          ← Anunciantes
        </a>
        <BotonImprimir />
      </div>

      <article className="mx-auto max-w-[52rem] bg-white px-10 py-10 shadow-[0_20px_60px_-30px_rgba(0,0,0,0.5)] print:max-w-none print:px-0 print:py-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6 border-b-4 border-double border-ink pb-5">
          <div>
            {/* El reporte siempre es blanco (también en modo oscuro e impreso): el logo es siempre el de fondo claro. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.svg" alt="ACOM-Di, Revista de Acámbaro" className="h-12 w-auto" />
            <p className="font-sans mt-4 text-xs font-bold uppercase tracking-[0.2em] text-terracota">Reporte de publicidad</p>
            <h1 className="font-display mt-1 text-4xl font-black leading-tight">{a.nombre}</h1>
          </div>
          <div className="font-sans text-right text-xs text-ink-soft">
            <p>Generado el {fechaLarga(hoy)}</p>
            <p>Últimos 30 días: {fechaLarga(desde)} – {fechaLarga(hoy)}</p>
            {a.vence && <p>Vigencia: hasta el {fechaLarga(a.vence)}</p>}
          </div>
        </header>

        <section aria-label="Resumen" className="mt-6 grid grid-cols-3 gap-3">
          {[
            [numero(n.vistas.total), "vistas de sus páginas", `${numero(n.vistas.d30)} en los últimos 30 días`],
            [numero(n.clics.total), "clics en sus enlaces", `${numero(n.clics.d30)} en los últimos 30 días`],
            [porcentaje(n.tasa), "tasa de clics", "clics por cada vista"],
          ].map(([v, t, nota]) => (
            <div key={t} className="rounded-lg border border-ink/15 p-4">
              <p className="font-display text-4xl font-black leading-none text-terracota">{v}</p>
              <p className="font-sans mt-2 text-sm font-bold">{t}</p>
              <p className="font-sans text-xs text-ink-soft">{nota}</p>
            </div>
          ))}
        </section>

        <section aria-label="Por día" className="mt-8 break-inside-avoid">
          <h2 className="font-display text-xl font-black">Vistas y clics por día</h2>
          <p className="font-sans text-xs text-ink-soft">
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#49c59f] align-middle" /> vistas ·{" "}
            <span className="mr-1 inline-block h-2.5 w-2.5 rounded-sm bg-[#013f4a] align-middle" /> clics
          </p>
          <div className="mt-3">
            <Grafica dias={n.dias} />
          </div>
        </section>

        <section aria-label="Sus anuncios" className="mt-8">
          <h2 className="font-display text-xl font-black">Sus anuncios</h2>
          {n.anuncios.length === 0 ? (
            <p className="font-sans mt-2 text-sm italic text-ink-soft">Todavía no tiene páginas asignadas.</p>
          ) : (
            <ul className="mt-3 space-y-3">
              {n.anuncios.map((x) => {
                const pag = ediciones.find((e) => e.id === x.edicion)?.paginas[x.pagina - 1];
                return (
                  <li key={`${x.edicion}|${x.pagina}`} className="flex break-inside-avoid items-center gap-4 rounded-lg border border-ink/15 p-3">
                    <div className="w-20 shrink-0 overflow-hidden rounded-sm shadow-[0_6px_14px_-8px_rgba(0,0,0,0.5)]">
                      {pag?.plantilla === "lienzo" ? (
                        <div aria-hidden className="pointer-events-none">
                          <LienzoVista elementos={pag.elementos ?? []} fondo={pag.fondo} alto={pag.alto} edicionId={x.edicion} miniatura />
                        </div>
                      ) : (
                        <div className="aspect-[800/1100] bg-ink/10" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-display text-lg font-bold leading-snug">{x.titulo}</p>
                      <p className="font-sans text-xs text-ink-soft">
                        {x.numero && x.publicada ? `Edición N.º ${x.numero} · ` : ""}
                        {x.tema} · página {x.pagina}
                        {!x.publicada ? " · aún no publicada" : ""}
                      </p>
                    </div>
                    <table className="font-sans shrink-0 text-right text-xs">
                      <thead>
                        <tr className="text-ink-soft">
                          <th className="px-2 font-normal" />
                          <th className="px-2 font-normal">7 días</th>
                          <th className="px-2 font-normal">30 días</th>
                          <th className="px-2 font-normal">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th className="px-2 text-left font-bold">Vistas</th>
                          <td className="px-2">{numero(x.vistas.d7)}</td>
                          <td className="px-2">{numero(x.vistas.d30)}</td>
                          <td className="px-2 font-bold">{numero(x.vistas.total)}</td>
                        </tr>
                        <tr>
                          <th className="px-2 text-left font-bold">Clics</th>
                          <td className="px-2">{numero(x.clics.d7)}</td>
                          <td className="px-2">{numero(x.clics.d30)}</td>
                          <td className="px-2 font-bold">{numero(x.clics.total)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {n.porEnlace.length > 0 && (
          <section aria-label="Clics por enlace" className="mt-8 break-inside-avoid">
            <h2 className="font-display text-xl font-black">Clics por enlace</h2>
            <table className="font-sans mt-3 w-full text-sm">
              <thead>
                <tr className="border-b border-ink text-left text-xs uppercase tracking-wider text-ink-soft">
                  <th className="py-1.5">Enlace</th>
                  <th className="py-1.5 text-right">30 días</th>
                  <th className="py-1.5 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {n.porEnlace.map((e) => (
                  <tr key={e.url} className="border-b border-ink/10">
                    <td className="py-1.5">
                      <b>{e.etiqueta || "Enlace"}</b> <span className="break-all text-xs text-ink-soft">{e.url}</span>
                    </td>
                    <td className="py-1.5 text-right">{numero(e.d30)}</td>
                    <td className="py-1.5 text-right font-bold">{numero(e.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        <footer className="font-sans mt-10 border-t border-ink/20 pt-4 text-[0.7rem] leading-relaxed text-ink-soft">
          <p>
            <b>Cómo se cuenta.</b> Una <b>vista</b> es una persona que tuvo la página de su anuncio a la vista en la revista (cada visitante cuenta una vez
            cada 30 minutos). Un <b>clic</b> es una vez que alguien tocó uno de sus enlaces (WhatsApp, sitio, teléfono, redes; una vez cada 10 minutos por
            persona). La <b>tasa de clics</b> es clics ÷ vistas. Solo se cuentan las ediciones publicadas.
            {conDatos.length < n.anuncios.length ? " Los anuncios en ediciones aún no publicadas todavía no tienen números." : ""}
          </p>
          <p className="mt-2">ACOM-Di · Revista de Acámbaro</p>
        </footer>
      </article>
    </div>
  );
}
