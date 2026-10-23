import Link from "next/link";
import { clicsRecientes, leerClics, type RegistroClics } from "@/lib/clics";
import { getEdiciones } from "@/lib/ediciones";
import { leerVistas, vistasRecientes, type RegistroVistas } from "@/lib/vistas";

export const dynamic = "force-dynamic";

const pct = (clics: number, vistas: number) => (vistas > 0 ? `${((clics / vistas) * 100).toLocaleString("es-MX", { maximumFractionDigits: 1 })} %` : "—");

export default function Clics() {
  const registros = leerClics();
  const vistas = leerVistas();
  const ediciones = getEdiciones();
  const temas = new Map(ediciones.map((e) => [e.id, `N.º ${e.numero} · ${e.tema}`]));
  const titulos = new Map(ediciones.map((e) => [e.id, e.paginas.map((p) => p.titulo ?? "")]));
  const clicsPor = new Map<string, RegistroClics[]>();
  for (const r of registros) clicsPor.set(r.edicion, [...(clicsPor.get(r.edicion) ?? []), r]);
  const vistasPor = new Map<string, RegistroVistas[]>();
  for (const v of vistas) vistasPor.set(v.edicion, [...(vistasPor.get(v.edicion) ?? []), v]);
  const ids = [...new Set([...clicsPor.keys(), ...vistasPor.keys()])].sort((a, b) => b.localeCompare(a));
  const total = registros.reduce((s, r) => s + r.total, 0);
  const totalAnuncios = registros.filter((r) => r.anuncio).reduce((s, r) => s + r.total, 0);
  const totalVistas = vistas.reduce((s, v) => s + v.total, 0);
  const hayDatos = registros.length > 0 || vistas.length > 0;

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Link href="/admin" className="font-sans text-xs font-bold uppercase tracking-wider text-terracota hover:underline">
        ← Ediciones
      </Link>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display mt-2 text-5xl font-black italic">Estadísticas</h1>
        {registros.length > 0 && (
          <a href="/api/admin/clics" className="font-sans border border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-paper">
            ⬇ Exportar CSV
          </a>
        )}
      </div>
      <p className="font-sans mt-2 max-w-2xl text-sm text-ink-soft">
        Cuántas veces se vio cada página y cuántas veces tocaron sus enlaces (anuncios, redes, correo, teléfono, WhatsApp, otras partes del sitio), solo en ediciones publicadas.
        La <strong>tasa de clics</strong> es clics ÷ vistas de la página donde está el enlace. Se guarda en <code>content/clics.json</code> y <code>content/vistas.json</code>. Un mismo
        visitante cuenta una vez cada 10 minutos por enlace y cada 30 por página. En Vercel no se pueden escribir esos archivos: define <code>CLICS_WEBHOOK_URL</code> para enviar cada
        clic y cada vista (campo <code>evento</code>) a una hoja de cálculo o servicio (ver <code>GUIA-EDICIONES.md</code>).
      </p>

      {!hayDatos ? (
        <p className="font-sans mt-8 border-t border-ink py-4 text-sm italic text-ink-soft">
          Aún no hay datos. Publica una edición y ábrela en el sitio: las vistas se cuentan al leer cada página y los clics al tocar un enlace (el elemento debe tener su enlace en «Lleva a»).
        </p>
      ) : (
        <>
          <p className="font-sans mt-6 text-sm">
            <strong>{totalVistas}</strong> vistas de página · <strong>{total}</strong> clics en total · <strong>{totalAnuncios}</strong> en páginas de publicidad
          </p>
          {ids.map((id) => {
            const lc = [...(clicsPor.get(id) ?? [])].sort((a, b) => b.total - a.total);
            const lv = vistasPor.get(id) ?? [];
            const vPag = new Map(lv.map((v) => [v.pagina, v]));
            const vistasEd = lv.reduce((s, v) => s + v.total, 0);
            const clicsEd = lc.reduce((s, r) => s + r.total, 0);
            const masVistas = [...lv].sort((a, b) => b.total - a.total).slice(0, 8);
            const nombres = titulos.get(id) ?? [];
            return (
              <section key={id} className="mt-10" aria-label={`Edición ${id}`}>
                <h2 className="font-display text-2xl font-black">{temas.get(id) ?? `Edición ${id}`}</h2>
                <p className="font-sans mt-1 text-sm text-ink-soft">
                  <strong className="text-ink">{vistasEd}</strong> vistas · <strong className="text-ink">{clicsEd}</strong> clics
                </p>

                {lc.length > 0 && (
                  <div className="font-sans mt-3 overflow-x-auto">
                    <table className="w-full min-w-[40rem] border-t-2 border-ink text-left text-sm">
                      <thead className="text-xs uppercase tracking-wider text-ink-soft">
                        <tr>
                          <th className="py-2 pr-3">Elemento</th>
                          <th className="py-2 pr-3">Pág.</th>
                          <th className="py-2 pr-3 text-right">Vistas pág.</th>
                          <th className="py-2 pr-3 text-right">7 días</th>
                          <th className="py-2 pr-3 text-right">30 días</th>
                          <th className="py-2 pr-3 text-right">Total</th>
                          <th className="py-2 text-right">Tasa</th>
                        </tr>
                      </thead>
                      <tbody>
                        {lc.map((r) => (
                          <tr key={`${r.elemento}|${r.url}`} className="border-t border-ink/20 align-top">
                            <td className="py-2 pr-3">
                              <span className="font-bold">{r.etiqueta || "(sin texto)"}</span>
                              {r.anuncio && <span className="ml-2 bg-ink px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-paper">Publicidad</span>}
                              <br />
                              {/^https?:\/\//i.test(r.url) ? (
                                <a href={r.url} target="_blank" rel="noreferrer noopener" className="break-all text-xs text-terracota hover:underline">
                                  {r.url}
                                </a>
                              ) : (
                                <span className="break-all text-xs text-ink-soft">{r.url}</span>
                              )}
                            </td>
                            <td className="py-2 pr-3">{r.pagina}</td>
                            <td className="py-2 pr-3 text-right">{vPag.get(r.pagina)?.total ?? 0}</td>
                            <td className="py-2 pr-3 text-right">{clicsRecientes(r, 7)}</td>
                            <td className="py-2 pr-3 text-right">{clicsRecientes(r, 30)}</td>
                            <td className="py-2 pr-3 text-right font-bold">{r.total}</td>
                            <td className="py-2 text-right">{pct(r.total, vPag.get(r.pagina)?.total ?? 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {masVistas.length > 0 && (
                  <div className="font-sans mt-4 overflow-x-auto">
                    <table className="w-full min-w-[26rem] border-t-2 border-ink text-left text-sm">
                      <thead className="text-xs uppercase tracking-wider text-ink-soft">
                        <tr>
                          <th className="py-2 pr-3">Páginas más vistas</th>
                          <th className="py-2 pr-3 text-right">7 días</th>
                          <th className="py-2 pr-3 text-right">30 días</th>
                          <th className="py-2 text-right">Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {masVistas.map((v) => (
                          <tr key={v.pagina} className="border-t border-ink/20">
                            <td className="py-2 pr-3">
                              <span className="font-bold">{v.pagina}.</span> {nombres[v.pagina - 1] || "(sin título)"}
                            </td>
                            <td className="py-2 pr-3 text-right">{vistasRecientes(v, 7)}</td>
                            <td className="py-2 pr-3 text-right">{vistasRecientes(v, 30)}</td>
                            <td className="py-2 text-right font-bold">{v.total}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            );
          })}
        </>
      )}
    </main>
  );
}
