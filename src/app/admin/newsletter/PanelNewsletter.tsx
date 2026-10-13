"use client";

import { useEffect, useMemo, useState } from "react";
import { Campo, btnCls, inputCls } from "@/components/admin/campos";
import { asuntoSugerido, htmlCorreo } from "@/lib/newsletter";

type EdicionResumen = {
  id: string;
  numero: string;
  tema: string;
  periodo: string;
  estado: "borrador" | "programada" | "publicada";
  imagen?: string;
  paginas: { n: number; titulo: string }[];
};

const CLAVE_BASE = "revista-newsletter-base";
const ENLACE_BAJA = "{{enlace_baja}}";

export default function PanelNewsletter({
  suscriptores: inicial,
  ediciones,
}: {
  suscriptores: { email: string; fecha: string }[];
  ediciones: EdicionResumen[];
}) {
  const [lista, setLista] = useState(inicial);
  const [filtro, setFiltro] = useState("");
  const [base, setBase] = useState("https://");
  const [edId, setEdId] = useState(ediciones.find((e) => e.estado !== "borrador")?.id ?? ediciones[0]?.id ?? "");
  const [intro, setIntro] = useState("Ya está lista la nueva edición de Acámbaro. Entra y échale un vistazo.");
  const [conImagen, setConImagen] = useState(true);
  const [aviso, setAviso] = useState<string | null>(null);

  // La dirección del sitio se recuerda entre visitas (se lee en un efecto para no desajustar la hidratación).
  useEffect(() => {
    try {
      const g = localStorage.getItem(CLAVE_BASE);
      if (g) setBase(g);
    } catch {}
  }, []);
  const cambiarBase = (v: string) => {
    setBase(v);
    try {
      localStorage.setItem(CLAVE_BASE, v);
    } catch {}
  };

  const ed = ediciones.find((e) => e.id === edId);
  const baseValida = /^https?:\/\/[^\s/]+\.[^\s/]+/.test(base) || /^https?:\/\/localhost(:\d+)?$/.test(base);
  const html = useMemo(
    () =>
      ed
        ? htmlCorreo({
            numero: ed.numero,
            tema: ed.tema,
            periodo: ed.periodo,
            intro,
            baseUrl: base,
            edicionId: ed.id,
            imagen: conImagen ? ed.imagen : undefined,
            paginas: ed.paginas,
            enlaceBaja: ENLACE_BAJA,
          })
        : "",
    [ed, intro, base, conImagen],
  );

  const mostrar = (t: string) => {
    setAviso(t);
    setTimeout(() => setAviso(null), 3500);
  };
  const copiar = async (texto: string, ok: string) => {
    try {
      await navigator.clipboard.writeText(texto);
      mostrar(ok);
    } catch {
      mostrar("No se pudo copiar; usa Descargar.");
    }
  };
  const descargar = () => {
    const url = URL.createObjectURL(new Blob([html], { type: "text/html;charset=utf-8" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `newsletter-${ed?.id ?? "edicion"}.html` });
    a.click();
    URL.revokeObjectURL(url);
  };

  async function quitar(email: string) {
    if (!confirm(`¿Quitar ${email} de la lista?`)) return;
    const r = await fetch("/api/admin/suscriptores", {
      method: "DELETE",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (r.ok) setLista((l) => l.filter((s) => s.email !== email));
    else mostrar((await r.json().catch(() => ({}))).error ?? "No se pudo quitar.");
  }

  const visibles = lista.filter((s) => s.email.includes(filtro.trim().toLowerCase()));
  const csvHref = `/api/admin/suscriptores${baseValida ? `?base=${encodeURIComponent(base.replace(/\/+$/, ""))}` : ""}`;

  return (
    <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
      {/* Suscriptores */}
      <section aria-label="Suscriptores">
        <div className="flex items-baseline justify-between gap-3 border-b border-ink pb-2">
          <h2 className="font-display text-2xl font-black">
            Suscriptores <span className="text-terracota">{lista.length}</span>
          </h2>
          <a href={csvHref} className={btnCls} download>
            Exportar CSV
          </a>
        </div>
        {lista.length === 0 ? (
          <p className="font-sans mt-4 text-sm italic text-ink-soft">Aún no hay suscriptores.</p>
        ) : (
          <>
            <input
              className={`${inputCls} mt-3`}
              placeholder="Buscar correo…"
              aria-label="Buscar correo"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value)}
            />
            <ul className="mt-2 max-h-96 overflow-y-auto border border-ink/20">
              {visibles.map((s) => (
                <li key={s.email} className="font-sans flex items-center gap-2 border-b border-ink/10 px-3 py-1.5 text-sm">
                  <span className="min-w-0 flex-1 truncate">{s.email}</span>
                  <span className="shrink-0 text-xs text-ink-soft">{s.fecha.slice(0, 10)}</span>
                  <button type="button" className={`${btnCls} !border-0 !px-1.5`} aria-label={`Quitar ${s.email}`} onClick={() => quitar(s.email)}>
                    ✕
                  </button>
                </li>
              ))}
              {visibles.length === 0 && <li className="font-sans px-3 py-2 text-sm italic text-ink-soft">Sin coincidencias.</li>}
            </ul>
          </>
        )}
        <p className="font-sans mt-3 text-xs leading-relaxed text-ink-soft">
          El CSV trae una columna <code>enlace_baja</code> personal para cada persona (si ya escribiste la dirección del sitio a la
          derecha). Si tu herramienta de correo admite campos combinados, úsala en lugar de {ENLACE_BAJA}.
        </p>
      </section>

      {/* Correo */}
      <section aria-label="Correo de la edición" className="space-y-3">
        <h2 className="font-display border-b border-ink pb-2 text-2xl font-black">Correo de la edición</h2>
        {ediciones.length === 0 ? (
          <p className="font-sans text-sm italic text-ink-soft">Crea una edición primero.</p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-2">
              <Campo label="Edición">
                <select className={inputCls} value={edId} onChange={(e) => setEdId(e.target.value)}>
                  {ediciones.map((e) => (
                    <option key={e.id} value={e.id}>
                      N.º {e.numero} · {e.tema}
                      {e.estado === "borrador" ? " (borrador)" : e.estado === "programada" ? " (programada)" : ""}
                    </option>
                  ))}
                </select>
              </Campo>
              <Campo label="Dirección pública del sitio">
                <input className={inputCls} value={base} onChange={(e) => cambiarBase(e.target.value)} placeholder="https://tu-revista.com" />
              </Campo>
            </div>
            {!baseValida && (
              <p role="alert" className="font-sans text-xs font-bold text-terracota">
                Escribe la dirección donde está publicada la revista (con https://) para que los enlaces del correo funcionen.
              </p>
            )}
            {ed && ed.estado !== "publicada" && (
              <p className="font-sans text-xs text-ink-soft">
                Esta edición {ed.estado === "borrador" ? "es un borrador" : "aún no es pública"}: no envíes el correo antes de que se publique.
              </p>
            )}
            <Campo label="Texto de presentación (separa párrafos con una línea en blanco)">
              <textarea className={`${inputCls} min-h-24`} value={intro} onChange={(e) => setIntro(e.target.value)} />
            </Campo>
            {ed?.imagen && (
              <label className="font-sans flex items-center gap-2 text-xs">
                <input type="checkbox" checked={conImagen} onChange={(e) => setConImagen(e.target.checked)} />
                Usar como cabecera la primera imagen de la portada
              </label>
            )}
            {ed && (
              <div className="font-sans flex flex-wrap items-center gap-2 text-xs">
                <span className="font-bold uppercase tracking-wider text-ink-soft">Asunto:</span>
                <code className="min-w-0 flex-1 truncate">{asuntoSugerido(ed)}</code>
                <button type="button" className={btnCls} onClick={() => copiar(asuntoSugerido(ed), "Asunto copiado")}>
                  Copiar asunto
                </button>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" className={btnCls} onClick={() => copiar(html, "HTML copiado")}>
                Copiar HTML
              </button>
              <button type="button" className={btnCls} onClick={descargar}>
                Descargar .html
              </button>
              {aviso && (
                <span role="status" className="font-sans text-xs font-bold text-oliva">
                  {aviso}
                </span>
              )}
            </div>
            <iframe
              title="Vista previa del correo"
              sandbox=""
              srcDoc={html}
              className="h-[34rem] w-full border border-ink/30 bg-white"
            />
          </>
        )}
      </section>
    </div>
  );
}
