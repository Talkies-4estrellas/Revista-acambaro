import Link from "next/link";
import { clicsRecientes, leerClics, type RegistroClics } from "@/lib/clics";
import { getEdiciones } from "@/lib/ediciones";

export const dynamic = "force-dynamic";

export default function Clics() {
  const registros = leerClics();
  const temas = new Map(getEdiciones().map((e) => [e.id, `N.º ${e.numero} · ${e.tema}`]));
  const porEdicion = new Map<string, RegistroClics[]>();
  for (const r of registros) porEdicion.set(r.edicion, [...(porEdicion.get(r.edicion) ?? []), r]);
  const ediciones = [...porEdicion.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  const total = registros.reduce((s, r) => s + r.total, 0);
  const totalAnuncios = registros.filter((r) => r.anuncio).reduce((s, r) => s + r.total, 0);

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      <Link href="/admin" className="font-sans text-xs font-bold uppercase tracking-wider text-terracota hover:underline">
        ← Ediciones
      </Link>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display mt-2 text-5xl font-black italic">Clics en enlaces</h1>
        {registros.length > 0 && (
          <a href="/api/admin/clics" className="font-sans border border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-paper">
            ⬇ Exportar CSV
          </a>
        )}
      </div>
      <p className="font-sans mt-2 max-w-2xl text-sm text-ink-soft">
        Cuenta cuántas veces tocaron los enlaces externos de la revista (anuncios, redes, sitios de anunciantes), solo en ediciones publicadas. Se guarda en{" "}
        <code>content/clics.json</code>. Un mismo visitante cuenta una vez cada 10 minutos por enlace. En Vercel no se puede escribir ese archivo: define{" "}
        <code>CLICS_WEBHOOK_URL</code> para enviar cada clic a una hoja de cálculo o servicio (ver <code>GUIA-EDICIONES.md</code>).
      </p>

      {registros.length === 0 ? (
        <p className="font-sans mt-8 border-t border-ink py-4 text-sm italic text-ink-soft">
          Aún no hay clics. Agrega un enlace <code>https://…</code> a un elemento, publica la edición y toca el enlace en el sitio.
        </p>
      ) : (
        <>
          <p className="font-sans mt-6 text-sm">
            <strong>{total}</strong> clics en total · <strong>{totalAnuncios}</strong> en páginas de publicidad
          </p>
          {ediciones.map(([id, lista]) => (
            <section key={id} className="mt-8" aria-label={`Edición ${id}`}>
              <h2 className="font-display text-2xl font-black">{temas.get(id) ?? `Edición ${id}`}</h2>
              <div className="font-sans mt-2 overflow-x-auto">
                <table className="w-full min-w-[34rem] border-t-2 border-ink text-left text-sm">
                  <thead className="text-xs uppercase tracking-wider text-ink-soft">
                    <tr>
                      <th className="py-2 pr-3">Elemento</th>
                      <th className="py-2 pr-3">Pág.</th>
                      <th className="py-2 pr-3 text-right">7 días</th>
                      <th className="py-2 pr-3 text-right">30 días</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lista
                      .sort((a, b) => b.total - a.total)
                      .map((r) => (
                        <tr key={`${r.elemento}|${r.url}`} className="border-t border-ink/20 align-top">
                          <td className="py-2 pr-3">
                            <span className="font-bold">{r.etiqueta || "(sin texto)"}</span>
                            {r.anuncio && <span className="ml-2 bg-ink px-1.5 py-0.5 text-[0.65rem] font-bold uppercase tracking-wider text-paper">Publicidad</span>}
                            <br />
                            <a href={r.url} target="_blank" rel="noreferrer noopener" className="break-all text-xs text-terracota hover:underline">
                              {r.url}
                            </a>
                          </td>
                          <td className="py-2 pr-3">{r.pagina}</td>
                          <td className="py-2 pr-3 text-right">{clicsRecientes(r, 7)}</td>
                          <td className="py-2 pr-3 text-right">{clicsRecientes(r, 30)}</td>
                          <td className="py-2 text-right font-bold">{r.total}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </section>
          ))}
        </>
      )}
    </main>
  );
}
