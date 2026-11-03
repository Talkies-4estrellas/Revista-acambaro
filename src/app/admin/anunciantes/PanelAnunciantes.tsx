"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import type { Anunciante, NumerosAnunciante, PaginaAnuncio } from "@/lib/anunciantes";

export type FichaAnunciante = Anunciante & { numeros: NumerosAnunciante };
export type PaginaElegible = PaginaAnuncio & { asignada: boolean; enlaces: string[]; miniatura: ReactNode };

type Borrador = { id?: string; nombre: string; contacto: string; vence: string; notas: string; enlaces: string; anuncios: string[] };
const vacio: Borrador = { nombre: "", contacto: "", vence: "", notas: "", enlaces: "", anuncios: [] };
const clave = (p: { edicion: string; pagina: number }) => `${p.edicion}|${p.pagina}`;
const numero = (n: number) => new Intl.NumberFormat("es-MX").format(n);
const porcentaje = (t: number | null) => (t === null ? "—" : `${(t * 100).toLocaleString("es-MX", { maximumFractionDigits: 1 })} %`);

/** «Anuncio · Hobby Rieles» → «Hobby Rieles» (para sugerir el nombre). */
const nombreDesdeTitulo = (t: string) => t.replace(/^(anuncios?|publicidad)\s*[·:-]\s*/i, "").trim();

function Vence({ dias, fecha }: { dias: number | null; fecha?: string }) {
  if (dias === null || !fecha) return null;
  const f = new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${fecha}T12:00:00Z`));
  const [texto, cls] =
    dias < 0
      ? [`Venció el ${f}`, "bg-red-500/15 text-red-700 dark:text-red-300"]
      : dias === 0
        ? ["Vence hoy", "bg-red-500/15 text-red-700 dark:text-red-300"]
        : dias <= 7
          ? [`Vence en ${dias} ${dias === 1 ? "día" : "días"}`, "bg-amber-500/15 text-amber-800 dark:text-amber-300"]
          : [`Vigente hasta el ${f}`, "bg-terracota/15 text-terracota"];
  return <span className={`font-sans inline-block rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${cls}`}>{texto}</span>;
}

export default function PanelAnunciantes({ fichas, paginas }: { fichas: FichaAnunciante[]; paginas: PaginaElegible[] }) {
  const router = useRouter();
  const [form, setForm] = useState<Borrador | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [buscarPag, setBuscarPag] = useState("");

  // #nuevo (desde el menú lateral) abre el formulario.
  useEffect(() => {
    const leer = () => window.location.hash === "#nuevo" && setForm({ ...vacio });
    leer();
    window.addEventListener("hashchange", leer);
    return () => window.removeEventListener("hashchange", leer);
  }, []);

  const sinAnunciante = paginas.filter((p) => !p.asignada);
  const porEdicion = useMemo(() => {
    const q = buscarPag.trim().toLowerCase();
    const lista = paginas.filter((p) => !q || `${p.titulo} ${p.tema} ${p.edicion}`.toLowerCase().includes(q));
    const m = new Map<string, PaginaElegible[]>();
    for (const p of lista) m.set(p.edicion, [...(m.get(p.edicion) ?? []), p]);
    return [...m.entries()];
  }, [paginas, buscarPag]);

  const abrirNuevoDesde = (p: PaginaElegible) =>
    setForm({ ...vacio, nombre: nombreDesdeTitulo(p.titulo), anuncios: [clave(p)], enlaces: p.enlaces.join("\n") });
  const abrirEditar = (a: FichaAnunciante) =>
    setForm({ id: a.id, nombre: a.nombre, contacto: a.contacto ?? "", vence: a.vence ?? "", notas: a.notas ?? "", enlaces: a.enlaces.join("\n"), anuncios: a.anuncios.map(clave) });

  useEffect(() => {
    if (form) document.getElementById("form-anunciante")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [form?.id, form === null]); // eslint-disable-line react-hooks/exhaustive-deps

  async function guardar(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setGuardando(true);
    try {
      const cuerpo = {
        nombre: form.nombre,
        contacto: form.contacto,
        vence: form.vence,
        notas: form.notas,
        enlaces: form.enlaces.split(/[\n,]/),
        anuncios: form.anuncios.map((k) => ({ edicion: k.split("|")[0], pagina: Number(k.split("|")[1]) })),
      };
      const res = await fetch(form.id ? `/api/admin/anunciantes/${form.id}` : "/api/admin/anunciantes", {
        method: form.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(cuerpo),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? `Error ${res.status}`);
      setForm(null);
      if (window.location.hash) history.replaceState(null, "", window.location.pathname);
      router.refresh();
    } catch (err) {
      window.alert(err instanceof Error ? err.message : String(err));
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(a: FichaAnunciante) {
    if (!window.confirm(`¿Quitar a «${a.nombre}» de la lista de anunciantes? Sus anuncios en las ediciones no se tocan.`)) return;
    const res = await fetch(`/api/admin/anunciantes/${a.id}`, { method: "DELETE" });
    if (!res.ok) window.alert((await res.json().catch(() => ({}))).error ?? `Error ${res.status}`);
    router.refresh();
  }

  const totales = fichas.reduce((t, f) => ({ v: t.v + f.numeros.vistas.d30, c: t.c + f.numeros.clics.d30 }), { v: 0, c: 0 });
  const porVencer = fichas.filter((f) => f.numeros.venceEn !== null && f.numeros.venceEn <= 7);
  const inp = "font-sans mt-1 block w-full rounded border border-ink/30 bg-paper px-3 py-2 text-sm";
  const btn = "font-sans px-3 py-1.5 text-xs font-bold uppercase tracking-wider";

  return (
    <>
      <ul className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="Resumen de anunciantes">
        {[
          [numero(fichas.length), fichas.length === 1 ? "anunciante" : "anunciantes", `${numero(paginas.length - sinAnunciante.length)} páginas asignadas`],
          [numero(sinAnunciante.length), "páginas sin anunciante", "de la sección Publicidad"],
          [numero(totales.v), "vistas de sus anuncios", `últimos 30 días · ${numero(totales.c)} clics`],
          [numero(porVencer.length), "por vencer o vencidos", "en 7 días o menos"],
        ].map(([n, t, nota]) => (
          <li key={t} className="rounded-xl border border-ink/15 bg-paper-deep/40 p-4">
            <span className="font-display block text-4xl font-black leading-none text-terracota">{n}</span>
            <span className="font-sans mt-2 block text-sm font-bold">{t}</span>
            <span className="font-sans block text-xs text-ink-soft">{nota}</span>
          </li>
        ))}
      </ul>

      <div className="mt-6">
        <button type="button" onClick={() => setForm(form && !form.id ? null : { ...vacio })} className={`${btn} bg-ink text-paper hover:bg-terracota`}>
          {form && !form.id ? "✕ Cerrar" : "+ Nuevo anunciante"}
        </button>
      </div>

      {form && (
        <form id="form-anunciante" onSubmit={guardar} className="mt-6 scroll-mt-20 space-y-4 rounded-xl border border-ink/25 bg-paper-deep/40 p-5">
          <h2 className="font-display text-2xl font-black">{form.id ? `Editar «${form.nombre}»` : "Nuevo anunciante"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="font-sans block text-xs font-bold">
              Nombre del negocio
              <input required value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} className={inp} maxLength={80} />
            </label>
            <label className="font-sans block text-xs font-bold">
              Contacto <span className="font-normal text-ink-soft">(teléfono, WhatsApp, correo o persona)</span>
              <input value={form.contacto} onChange={(e) => setForm({ ...form, contacto: e.target.value })} className={inp} maxLength={160} />
            </label>
            <label className="font-sans block text-xs font-bold">
              Vence <span className="font-normal text-ink-soft">(último día de lo contratado; opcional)</span>
              <input type="date" value={form.vence} onChange={(e) => setForm({ ...form, vence: e.target.value })} className={inp} />
            </label>
            <label className="font-sans block text-xs font-bold">
              Sus enlaces <span className="font-normal text-ink-soft">(uno por línea; en páginas con varios anuncios, solo cuentan estos clics)</span>
              <textarea value={form.enlaces} onChange={(e) => setForm({ ...form, enlaces: e.target.value })} rows={3} className={inp} placeholder={"hobbyrieles.mx\nwa.me/5214170000000"} />
            </label>
          </div>
          <label className="font-sans block text-xs font-bold">
            Notas <span className="font-normal text-ink-soft">(qué contrató, precio acordado, recordatorios)</span>
            <textarea value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} className={inp} maxLength={1000} />
          </label>

          <fieldset>
            <legend className="font-sans text-xs font-bold">
              Sus anuncios <span className="font-normal text-ink-soft">· {form.anuncios.length} elegidas (páginas de la sección Publicidad)</span>
            </legend>
            <input value={buscarPag} onChange={(e) => setBuscarPag(e.target.value)} placeholder="Buscar página por título o edición…" className={`${inp} mt-2 max-w-sm`} />
            <div className="mt-2 max-h-80 overflow-y-auto rounded border border-ink/15 bg-paper p-2">
              {porEdicion.length === 0 && <p className="font-sans p-2 text-sm italic text-ink-soft">No hay páginas de publicidad que coincidan.</p>}
              {porEdicion.map(([ed, lista]) => (
                <div key={ed} className="mb-2">
                  <p className="font-sans px-1 pt-1 text-[0.7rem] font-bold uppercase tracking-wider text-ink-soft">
                    {lista[0].numero && lista[0].publicada ? `N.º ${lista[0].numero} · ` : ""}
                    {lista[0].tema}
                    {!lista[0].publicada ? " (borrador)" : ""}
                  </p>
                  {lista.map((p) => {
                    const k = clave(p);
                    const marcado = form.anuncios.includes(k);
                    return (
                      <label key={k} className="font-sans flex cursor-pointer items-center gap-2 rounded px-1 py-1 text-sm hover:bg-ink/[0.05]">
                        <input
                          type="checkbox"
                          checked={marcado}
                          onChange={() => setForm({ ...form, anuncios: marcado ? form.anuncios.filter((x) => x !== k) : [...form.anuncios, k] })}
                        />
                        <span className="w-10 shrink-0 text-right text-xs text-ink-soft">p. {p.pagina}</span>
                        <span className="truncate">{p.titulo}</span>
                        {p.asignada && !marcado && <span className="ml-auto shrink-0 text-[0.7rem] text-ink-soft">ya tiene anunciante</span>}
                      </label>
                    );
                  })}
                </div>
              ))}
            </div>
          </fieldset>
          <div className="flex flex-wrap gap-2">
            <button type="submit" disabled={guardando} className={`${btn} bg-ink text-paper hover:bg-terracota disabled:opacity-50`}>
              {guardando ? "Guardando…" : form.id ? "Guardar cambios" : "Crear anunciante"}
            </button>
            <button type="button" onClick={() => setForm(null)} className={`${btn} border border-ink hover:bg-ink hover:text-paper`}>
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Anunciantes */}
      <section className="mt-10" aria-label="Anunciantes">
        {fichas.length === 0 ? (
          <p className="font-sans rounded-xl border border-dashed border-ink/30 p-6 text-sm text-ink-soft">
            Aún no hay anunciantes. Crea uno con «+ Nuevo anunciante» o desde una de las páginas de publicidad de abajo.
          </p>
        ) : (
          <ul className="grid gap-4 md:grid-cols-2">
            {fichas.map((a) => (
              <li key={a.id} className="flex flex-col rounded-xl border border-ink/15 p-5">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h2 className="font-display text-2xl font-black leading-tight">{a.nombre}</h2>
                    {a.contacto && <p className="font-sans text-sm text-ink-soft">{a.contacto}</p>}
                  </div>
                  <Vence dias={a.numeros.venceEn} fecha={a.vence} />
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[
                    [numero(a.numeros.vistas.d30), "vistas", "30 días"],
                    [numero(a.numeros.clics.d30), "clics", "30 días"],
                    [porcentaje(a.numeros.tasa), "tasa de clics", "desde el inicio"],
                  ].map(([n, t, nota]) => (
                    <div key={t} className="rounded-lg bg-paper-deep/50 px-2 py-3">
                      <dd className="font-display text-2xl font-black text-terracota">{n}</dd>
                      <dt className="font-sans text-xs font-bold">{t}</dt>
                      <p className="font-sans text-[0.65rem] text-ink-soft">{nota}</p>
                    </div>
                  ))}
                </dl>
                <ul className="font-sans mt-4 flex-1 space-y-1 text-sm">
                  {a.numeros.anuncios.length === 0 && <li className="italic text-ink-soft">Sin páginas asignadas.</li>}
                  {a.numeros.anuncios.map((x) => (
                    <li key={clave(x)} className="flex items-baseline justify-between gap-2">
                      <span className="truncate">
                        <span className="text-ink-soft">{x.numero && x.publicada ? `N.º ${x.numero}` : x.edicion} · p. {x.pagina} ·</span> {x.titulo}
                        {!x.existe && <span className="ml-1 text-xs font-bold text-red-700 dark:text-red-300">(ya no existe)</span>}
                        {x.existe && !x.publicada && <span className="ml-1 text-xs text-ink-soft">(borrador: sin números)</span>}
                      </span>
                      <span className="shrink-0 text-xs text-ink-soft">
                        👁 {numero(x.vistas.total)} · ↗ {numero(x.clics.total)}
                      </span>
                    </li>
                  ))}
                </ul>
                {a.notas && <p className="font-sans mt-3 whitespace-pre-line rounded bg-paper-deep/50 p-2 text-xs text-ink-soft">{a.notas}</p>}
                <div className="mt-4 flex flex-wrap gap-2">
                  <a href={`/admin/anunciantes/${a.id}/reporte`} target="_blank" rel="noreferrer" className={`${btn} bg-ink text-paper hover:bg-terracota`}>
                    Reporte ↗
                  </a>
                  <button type="button" onClick={() => abrirEditar(a)} className={`${btn} border border-ink hover:bg-ink hover:text-paper`}>
                    Editar
                  </button>
                  <button type="button" onClick={() => quitar(a)} className={`${btn} border border-ink/30 text-ink-soft hover:border-ink hover:text-ink`}>
                    Quitar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Páginas de publicidad sin anunciante */}
      <section id="sin-anunciante" className="mt-12 scroll-mt-20" aria-label="Páginas de publicidad sin anunciante">
        <h2 className="font-display border-b border-ink pb-2 text-2xl font-black">
          Páginas de publicidad sin anunciante <span className="text-terracota">{sinAnunciante.length}</span>
        </h2>
        <p className="font-sans mt-2 text-xs text-ink-soft">
          Las de los borradores no tienen números todavía (las vistas y los clics solo se cuentan en ediciones publicadas). Los anuncios con negocios
          inventados son de muestra.
        </p>
        {sinAnunciante.length === 0 ? (
          <p className="font-sans py-4 text-sm italic text-ink-soft">Todas las páginas de publicidad tienen anunciante.</p>
        ) : (
          <ul className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {sinAnunciante.map((p) => (
              <li key={clave(p)} className="flex flex-col">
                <div className="shadow-[0_10px_24px_-12px_rgba(0,0,0,0.5)]">{p.miniatura ?? <div className="aspect-[800/1100] rounded-sm bg-ink/10" />}</div>
                <p className="font-sans mt-2 line-clamp-2 text-xs font-bold leading-snug">{p.titulo}</p>
                <p className="font-sans text-[0.7rem] text-ink-soft">
                  {p.numero && p.publicada ? `N.º ${p.numero}` : p.edicion} · p. {p.pagina}
                  {!p.publicada ? " · borrador" : ""}
                </p>
                <button type="button" onClick={() => abrirNuevoDesde(p)} className={`${btn} mt-2 self-start border border-ink hover:bg-ink hover:text-paper`}>
                  + Crear anunciante
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
