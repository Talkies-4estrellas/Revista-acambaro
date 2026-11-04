import Link from "next/link";
import { leerCrudo, listarEdicionesAdmin, marcaEdicion, type ResumenEdicion } from "@/lib/admin";
import { estadoEdicion, fechaLarga, getEdiciones } from "@/lib/ediciones";
import { leerVistas, vistasRecientes } from "@/lib/vistas";
import { clicsRecientes, leerClics } from "@/lib/clics";
import { leerSuscriptores } from "@/lib/suscriptores";
import { estadoGit, type EstadoGit } from "@/lib/git-estado";
import ContinuarEditando from "./ContinuarEditando";
import MenuPublicacion from "./MenuPublicacion";
import PortadaPerezosa from "./PortadaPerezosa";
import PortadaMini from "@/components/PortadaMini";
import BotonBorrar from "./BotonBorrar";
import FilaEdicion from "./FilaEdicion";
import NuevaEdicion from "./NuevaEdicion";
import ArmarResumen from "./ResumenEdicion";
import AccionesPanel from "./AccionesPanel";
import ListaEdiciones, { type EstadoFiltro } from "./ListaEdiciones";
import { PESO_NIVEL, revisarDatos } from "@/lib/revision";
import { revisarAccesibilidad } from "@/lib/accesibilidad";

/** «hace 5 min», «hace 3 h», «ayer», «hace 4 días»; más atrás, la fecha. */
function haceCuanto(ms: number, ahora = Date.now()) {
  if (!ms) return "";
  const min = Math.round((ahora - ms) / 60_000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  if (d === 1) return "ayer";
  if (d < 7) return `hace ${d} días`;
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short" }).format(new Date(ms));
}

const numero = (n: number) => new Intl.NumberFormat("es-MX").format(n);
/** «9 nov 2026». */
const fechaCorta = (fecha: string) => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${fecha}T12:00:00Z`));

/** Estado de una edición como etiqueta de color. */
function Estado({ e }: { e: ResumenEdicion }) {
  const desactivada = !e.publicada && e.fijo;
  const [texto, cls, titulo] = e.error
    ? ["Con errores", "bg-red-500/15 text-red-700 dark:text-red-300"]
    : e.muestra
      ? ["Muestra", "bg-sky-500/15 text-sky-700 dark:text-sky-300", "No cuenta como edición: se hojea en /bienvenida"]
      : e.publicada && estadoEdicion({ publicada: true, publicarEn: e.publicarEn }) === "programada"
        ? [`⏰ Programada · ${e.publicarEn?.replace("T", " ")}`, "bg-amber-500/15 text-amber-800 dark:text-amber-300", "Hora del centro de México"]
        : e.publicada
          ? ["Publicada", "bg-terracota/15 text-terracota"]
          : desactivada
            ? [`Desactivada · N.º ${e.numero}`, "border border-ink/30 text-ink-soft", "Conserva su número"]
            : [`Borrador · será la N.º ${e.numero}`, "bg-ink/10 text-ink-soft", "No cuenta como edición hasta que se publique"];
  return (
    <span title={titulo} className={`font-sans inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold ${cls}`}>
      {texto}
    </span>
  );
}

/** Lo que todavía no llega al sitio publicado: cambios sin commit y commits sin push (solo informa; no hace nada en git). */
function CambiosSinSubir({ git, temaDe }: { git: EstadoGit; temaDe: Map<string, string> }) {
  const eds = [...git.ediciones];
  const pendiente = eds.length > 0 || git.medios > 0 || git.otros > 0 || (git.sinPush ?? 0) > 0;
  if (!pendiente) {
    return (
      <div className="flex h-full items-center gap-3 rounded-xl border border-ink/15 bg-paper-deep/40 p-4">
        <span aria-hidden className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-terracota/15 text-lg text-terracota">✓</span>
        <span className="font-sans text-sm">
          <b className="block">Todo está subido</b>
          <span className="text-xs text-ink-soft">No hay cambios sin commit ni commits sin push en la rama {git.rama}.</span>
        </span>
      </div>
    );
  }
  const partes = [
    git.medios > 0 && `${git.medios} ${git.medios === 1 ? "archivo" : "archivos"} de fotos y medios`,
    git.otros > 0 && `${git.otros} ${git.otros === 1 ? "archivo" : "archivos"} de código o documentación`,
  ].filter(Boolean);
  return (
    <div className="h-full rounded-xl border border-violet-500/40 bg-violet-500/[0.07] p-4">
      <p className="font-sans text-xs font-bold uppercase tracking-wider text-violet-700 dark:text-violet-300">● Cambios sin subir al sitio</p>
      <ul className="font-sans mt-2 space-y-1 text-sm">
        {eds.length > 0 && (
          <li>
            <b>
              {eds.length} {eds.length === 1 ? "edición" : "ediciones"}:
            </b>{" "}
            {eds
              .slice(0, 4)
              .map(([id, tipo]) => `«${temaDe.get(id) ?? id}»${tipo === "nueva" ? " (nueva)" : tipo === "borrada" ? " (borrada)" : ""}`)
              .join(", ")}
            {eds.length > 4 ? ` y ${eds.length - 4} más` : ""}
          </li>
        )}
        {partes.length > 0 && <li>{partes.join(" · ")}</li>}
        {(git.sinPush ?? 0) > 0 && (
          <li>
            <b>
              {git.sinPush} {git.sinPush === 1 ? "commit" : "commits"} sin push
            </b>{" "}
            en {git.rama}
          </li>
        )}
      </ul>
      <p className="font-sans mt-2 text-xs text-ink-soft">
        El sitio publicado aún no los tiene: haz commit y push (por ejemplo desde GitKraken) y se verán al desplegar.
      </p>
    </div>
  );
}

export default function Admin() {
  const ediciones = listarEdicionesAdmin();
  const validas = new Map(getEdiciones().map((e) => [e.id, e]));

  // Vistas y clics de los últimos 7 días, por edición y en total.
  const vistas7 = new Map<string, number>();
  let vistasTotal7 = 0;
  let vistasSiempre = 0;
  for (const r of leerVistas()) {
    const n = vistasRecientes(r, 7);
    vistas7.set(r.edicion, (vistas7.get(r.edicion) ?? 0) + n);
    vistasTotal7 += n;
    vistasSiempre += r.total;
  }
  const clics7 = new Map<string, number>();
  let clicsTotal7 = 0;
  let clicsSiempre = 0;
  for (const r of leerClics()) {
    const n = clicsRecientes(r, 7);
    clics7.set(r.edicion, (clics7.get(r.edicion) ?? 0) + n);
    clicsTotal7 += n;
    clicsSiempre += r.total;
  }
  const suscriptores = leerSuscriptores().length;

  // Sugerencia de identificador (nombre del archivo): el siguiente libre. El número de edición es automático.
  const maxId = Math.max(0, ...ediciones.map((e) => (/^\d+$/.test(e.id) ? Number.parseInt(e.id, 10) : 0)));
  const sugerido = {
    id: String(maxId + 1).padStart(2, "0"),
    fecha: new Date().toISOString().slice(0, 10),
  };

  // Para «Armar edición resumida»: títulos y secciones de las páginas de cada edición (sin errores)
  const origenes = ediciones
    .filter((e) => !e.error)
    .map((e) => ({
      id: e.id,
      tema: e.tema,
      paginas: (leerCrudo(e.id)?.paginas ?? []).map((pg) => ({ titulo: pg.titulo, seccion: pg.seccion })),
    }));
  // Títulos de las páginas de cada edición: el buscador de la lista también busca dentro de las ediciones.
  const titulosDe = new Map(origenes.map((o) => [o.id, o.paginas.map((p) => p.titulo ?? "")]));

  const porNumero = (a: ResumenEdicion, b: ResumenEdicion) => Number(b.numero ?? 0) - Number(a.numero ?? 0);
  // "Ediciones": publicadas, programadas y desactivadas (ya tuvieron número). "Borradores": nunca publicadas.
  // «Muestras»: ediciones que no son de la revista (p. ej. la que se hojea en la bienvenida); no llevan número.
  const muestras = ediciones.filter((e) => e.muestra);
  const numeradas = ediciones.filter((e) => !e.muestra && !e.error && (e.publicada || e.fijo)).sort(porNumero);
  const borradores = ediciones.filter((e) => !e.muestra && (e.error || !(e.publicada || e.fijo))).sort((a, b) => (a.error ? 1 : 0) - (b.error ? 1 : 0) || porNumero(a, b));
  const publicadas = numeradas.filter((e) => e.publicada).length;

  const editada = new Map(ediciones.map((e) => [e.id, marcaEdicion(e.id)]));
  // La edición que se tocó por última vez (para «Continuar donde lo dejaste»).
  const ultimaEditada = ediciones.filter((e) => !e.error && validas.has(e.id)).sort((a, b) => (editada.get(b.id) ?? 0) - (editada.get(a.id) ?? 0))[0];
  // Lo que falta subir al sitio publicado (git).
  const git = estadoGit();
  const temaDe = new Map(ediciones.map((e) => [e.id, e.tema ?? e.id]));

  // Revisión de datos y accesibilidad de cada edición (la misma del revisor del editor; las «info» no cuentan).
  const publicadasMap = new Map(ediciones.map((e) => [e.id, !!e.publicada]));
  // «Por revisar»: errores (de cualquier tipo) y avisos de diseño (textos o enlaces de ejemplo, fotos sin descripción…).
  // Los avisos de accesibilidad (contraste, botones pequeños) son muchos y menos urgentes: van aparte, en gris.
  const revision = new Map<string, { errores: number; avisos: number; accesibilidad: number; ejemplos: string[] }>();
  for (const e of ediciones) {
    if (e.error) continue;
    const crudo = leerCrudo(e.id);
    if (!crudo) continue;
    const hallazgos = [...revisarDatos(crudo.paginas, crudo.fecha, { publicadas: publicadasMap }), ...revisarAccesibilidad(crudo)].filter((a) => a.nivel !== "info");
    const errores = hallazgos.filter((a) => a.nivel === "error");
    const avisos = hallazgos.filter((a) => a.nivel === "aviso" && a.grupo !== "accesibilidad");
    revision.set(e.id, {
      errores: errores.length,
      avisos: avisos.length,
      accesibilidad: hallazgos.length - errores.length - avisos.length,
      ejemplos: [...new Set([...errores, ...avisos].sort((a, b) => PESO_NIVEL[a.nivel] - PESO_NIVEL[b.nivel]).map((a) => `p. ${a.pagina} · ${a.tipo}`))].slice(0, 6),
    });
  }

  const item = (e: ResumenEdicion) => {
    const desactivada = !e.publicada && e.fijo;
    const ed = !e.error ? validas.get(e.id) : undefined;
    const num = e.error || e.muestra ? "—" : (e.numero ?? "?");
    const colorNum = e.provisional || e.error ? "text-ink/30" : desactivada ? "text-terracota/50" : "text-terracota";
    const v = vistas7.get(e.id) ?? 0;
    const c = clics7.get(e.id) ?? 0;
    const datos = (
      <>
        {e.paginas ?? "?"} págs.
        {e.publicada && !e.muestra && (
          <>
            {" "}· <span title="Vistas de página en los últimos 7 días">👁 {numero(v)}</span> · <span title="Clics en enlaces en los últimos 7 días">↗ {numero(c)}</span>
          </>
        )}
        {editada.get(e.id) ? <> · editada {haceCuanto(editada.get(e.id)!)}</> : null}
      </>
    );
    const rev = revision.get(e.id);
    const porRevisar = rev ? rev.errores + rev.avisos : 0;
    const programada = !!e.publicada && estadoEdicion({ publicada: true, publicarEn: e.publicarEn }) === "programada";
    const acciones = (
      <>
        <Link href={`/admin/${e.id}`} className="bg-ink px-3 py-1.5 text-paper hover:bg-terracota">
          Editar
        </Link>
        {!e.error && !e.muestra && (
          <MenuPublicacion
            id={e.id}
            tema={e.tema}
            estado={programada ? "programada" : e.publicada ? "publicada" : desactivada ? "desactivada" : "borrador"}
            publicarEn={e.publicarEn}
            porRevisar={porRevisar}
            numero={e.numero}
          />
        )}
        {!e.publicada && <BotonBorrar id={e.id} tema={e.tema} numero={desactivada ? e.numero : undefined} />}
        {!e.error && (
          <a href={`/ediciones/${e.id}/1`} target="_blank" rel="noreferrer" className="border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper">
            Ver ↗
          </a>
        )}
      </>
    );
    const comunes = { id: e.id, tema: e.tema, borrable: !e.publicada, numeroDesactivada: desactivada ? e.numero : undefined, conError: !!e.error };
    const cambioGit = git?.ediciones.get(e.id);
    const insignia = (cambioGit || (rev && (porRevisar > 0 || rev.accesibilidad > 0))) && (
      <>
        {cambioGit && (
          <span
            title={cambioGit === "nueva" ? "Edición nueva que todavía no está en git: no saldrá en el sitio publicado hasta hacer commit y push." : "Tiene cambios sin commit: el sitio publicado todavía muestra la versión anterior."}
            className="font-sans inline-block whitespace-nowrap rounded-full bg-violet-500/15 px-2.5 py-0.5 text-[0.7rem] font-bold text-violet-700 dark:text-violet-300"
          >
            ● {cambioGit === "nueva" ? "nueva, sin subir" : "sin subir"}
          </span>
        )}
        {rev && porRevisar > 0 && (
          <Link
            href={`/admin/${e.id}#revisar`}
            title={`Abrir el revisor de diseño:\n${rev.ejemplos.join("\n")}${porRevisar > rev.ejemplos.length ? "\n…" : ""}`}
            className={`font-sans inline-block whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.7rem] font-bold hover:underline ${rev.errores ? "bg-red-500/15 text-red-700 dark:text-red-300" : "bg-amber-500/15 text-amber-800 dark:text-amber-300"}`}
          >
            ⚠ {porRevisar} por revisar
          </Link>
        )}
        {rev && rev.accesibilidad > 0 && (
          <Link
            href={`/admin/${e.id}#revisar`}
            title="Avisos de accesibilidad (contraste de colores, botones pequeños para el dedo, letra muy chica). Ábrelos en el revisor de diseño."
            className="font-sans inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[0.7rem] text-ink-soft hover:bg-ink/10 hover:text-ink"
          >
            ♿ {rev.accesibilidad}
          </Link>
        )}
      </>
    );

    const fila = (
      <FilaEdicion key={e.id} {...comunes}>
        <div className="grid grid-cols-[3rem_1fr] items-center gap-x-4 gap-y-3 sm:grid-cols-[3.5rem_3rem_1fr_auto]">
          <Link href={`/admin/${e.id}`} aria-label={`Editar ${e.tema ?? e.id}`} className="block aspect-[800/1100] w-12 overflow-hidden rounded-sm shadow-[0_6px_16px_-8px_rgba(0,0,0,0.6)] sm:w-14">
            {ed ? <PortadaPerezosa id={e.id} /> : <div className="aspect-[800/1100] bg-ink/10" />}
          </Link>
          <span className={`font-display hidden text-3xl font-black sm:block ${colorNum}`} title={e.provisional ? "Número previsto: aún no cuenta como edición hasta que se publique" : undefined}>
            {num}
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl font-bold leading-snug sm:truncate">
              <span className={`font-black sm:hidden ${colorNum}`}>{num} </span>
              {e.tema ?? `Edición “${e.id}”`}
            </p>
            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Estado e={e} />
              {insignia}
              <span className="font-sans text-xs text-ink-soft">
                {e.fecha && fechaLarga(e.fecha)} · {datos}
              </span>
            </div>
            <p className="font-sans mt-0.5 text-[0.7rem] text-ink-soft/80">archivo {e.id}.json</p>
          </div>
          <div className="font-sans col-span-2 flex flex-wrap justify-start gap-2 text-xs font-bold uppercase tracking-wider sm:col-span-1 sm:justify-end">{acciones}</div>
        </div>
        {e.error && <p className="font-sans mt-2 break-words text-xs text-terracota">{e.error}</p>}
      </FilaEdicion>
    );

    const tarjeta = (
      <FilaEdicion key={e.id} {...comunes} className="flex flex-col">
        <Link href={`/admin/${e.id}`} aria-label={`Editar ${e.tema ?? e.id}`} className="group relative block aspect-[800/1100] overflow-hidden rounded-md shadow-[0_14px_30px_-14px_rgba(0,0,0,0.6)]">
          {ed ? <PortadaPerezosa id={e.id} className="transition-transform duration-300 group-hover:scale-[1.02]" /> : <div className="grid aspect-[800/1100] place-items-center bg-ink/10 p-4 text-center text-xs text-ink-soft">{e.error ? "Con errores" : "Sin portada"}</div>}
        </Link>
        <p className="font-display mt-3 text-lg font-bold leading-snug">
          <span className={`font-black ${colorNum}`}>{num} </span>
          {e.tema ?? `Edición “${e.id}”`}
        </p>
        <div className="mt-1 flex flex-wrap gap-1">
          <Estado e={e} />
          {insignia}
        </div>
        <p className="font-sans mt-1 text-xs text-ink-soft">{datos}</p>
        <div className="font-sans mt-3 flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wider">{acciones}</div>
      </FilaEdicion>
    );
    const estado: EstadoFiltro = e.error
      ? "error"
      : e.muestra
        ? "muestra"
        : e.publicada && estadoEdicion({ publicada: true, publicarEn: e.publicarEn }) === "programada"
          ? "programada"
          : e.publicada
            ? "publicada"
            : desactivada
              ? "desactivada"
              : "borrador";
    // Renglón de la vista compacta: un renglón por edición, sin portada (para cuando hay muchas).
    const renglon = (
      <FilaEdicion key={e.id} {...comunes} className="border-b border-ink/15 py-2.5">
        <div className="grid grid-cols-[2.75rem_1fr] items-center gap-x-3 gap-y-2 md:grid-cols-[2.75rem_minmax(0,1fr)_7.5rem_3.5rem_auto]">
          <span className={`font-display text-xl font-black ${colorNum}`} title={e.provisional ? "Número previsto: aún no cuenta como edición hasta que se publique" : undefined}>
            {num}
          </span>
          <div className="min-w-0">
            <Link href={`/admin/${e.id}`} className="font-display block truncate text-base font-bold leading-snug hover:underline">
              {e.tema ?? `Edición “${e.id}”`}
            </Link>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <Estado e={e} />
              {insignia}
              <span className="font-sans text-[0.7rem] text-ink-soft">
                {e.id}.json{editada.get(e.id) ? ` · editada ${haceCuanto(editada.get(e.id)!)}` : ""}
                <span className="md:hidden">{e.fecha ? ` · ${fechaCorta(e.fecha)}` : ""} · {e.paginas ?? "?"} págs.</span>
              </span>
            </div>
          </div>
          <span className="font-sans hidden text-xs text-ink-soft md:block">{e.fecha && fechaCorta(e.fecha)}</span>
          <span className="font-sans hidden text-right text-xs text-ink-soft md:block" title="Páginas">
            {e.paginas ?? "?"} p.
          </span>
          <div className="font-sans col-span-2 flex flex-wrap items-center justify-start gap-1.5 text-[0.7rem] font-bold uppercase tracking-wider md:col-span-1 md:justify-end max-sm:[&>a]:inline-flex max-sm:[&>a]:min-h-10 max-sm:[&>a]:items-center max-sm:[&>a]:px-2.5 max-sm:[&>button]:!px-2.5 max-sm:[&>button]:!text-[0.7rem] max-sm:[&>div>button]:min-h-10 max-sm:[&>div>button]:px-2.5">{acciones}</div>
        </div>
        {e.error && <p className="font-sans mt-1 break-words text-xs text-terracota">{e.error}</p>}
      </FilaEdicion>
    );
    return {
      id: e.id,
      fila,
      tarjeta,
      renglon,
      buscar: [e.tema, e.id, e.numero && `n.º ${e.numero}`, e.numero, e.fecha && fechaLarga(e.fecha)].filter(Boolean).join(" "),
      paginas: titulosDe.get(e.id) ?? [],
      numero: e.error || e.muestra ? null : Number(e.numero) || null,
      fecha: e.fecha ?? "",
      tema: e.tema ?? e.id,
      editada: editada.get(e.id) ?? 0,
      estado,
      conAvisos: porRevisar > 0,
      sinSubir: !!cambioGit,
    };
  };

  const tarjetas: { valor: string; texto: string; nota?: string; href?: string }[] = [
    { valor: numero(publicadas), texto: publicadas === 1 ? "edición publicada" : "ediciones publicadas", nota: `${numeradas.length - publicadas > 0 ? `${numeradas.length - publicadas} desactivada(s) · ` : ""}${muestras.length} muestra(s)` },
    { valor: numero(borradores.length), texto: borradores.length === 1 ? "borrador" : "borradores", nota: "sin publicar" },
    { valor: numero(vistasTotal7), texto: "vistas de página", nota: `últimos 7 días · ${numero(vistasSiempre)} en total`, href: "/admin/clics" },
    { valor: numero(clicsTotal7), texto: "clics en enlaces", nota: `últimos 7 días · ${numero(clicsSiempre)} en total`, href: "/admin/clics" },
    { valor: numero(suscriptores), texto: suscriptores === 1 ? "suscriptor" : "suscriptores", nota: "al newsletter", href: "/admin/newsletter" },
  ];

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <p className="font-sans text-xs font-bold uppercase tracking-wider text-terracota">Panel de la revista</p>
      <div className="flex flex-wrap items-end justify-between gap-x-3 gap-y-4">
        <h1 className="font-display mt-1 text-5xl font-black italic">Ediciones</h1>
        <AccionesPanel
          nueva={<NuevaEdicion sugerido={sugerido} existentes={ediciones.map((e) => ({ id: e.id, tema: e.tema }))} />}
          resumen={<ArmarResumen origenes={origenes} sugerido={sugerido} />}
        />
      </div>
      <p className="font-sans mt-3 max-w-2xl text-sm text-ink-soft">
        Los cambios se guardan como archivos en <code>content/ediciones</code> y los medios en <code>public/media</code>.
      </p>

      {/* Continuar donde lo dejaste · Cambios sin subir */}
      <div className="mt-8 grid gap-3 md:grid-cols-2">
        {ultimaEditada && (
          <ContinuarEditando
            id={ultimaEditada.id}
            tema={ultimaEditada.tema ?? ultimaEditada.id}
            cuando={haceCuanto(editada.get(ultimaEditada.id) ?? 0)}
            paginas={ultimaEditada.paginas ?? 1}
            portada={<PortadaMini ed={validas.get(ultimaEditada.id)!} />}
          />
        )}
        {git && <CambiosSinSubir git={git} temaDe={temaDe} />}
      </div>

      {/* Resumen */}
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5" aria-label="Resumen">
        {tarjetas.map((t) => {
          const contenido = (
            <>
              <span className="font-display block text-4xl font-black leading-none text-terracota">{t.valor}</span>
              <span className="font-sans mt-2 block text-sm font-bold">{t.texto}</span>
              {t.nota && <span className="font-sans block text-xs text-ink-soft">{t.nota}</span>}
            </>
          );
          return (
            <li key={t.texto}>
              {t.href ? (
                <Link href={t.href} className="block h-full rounded-xl border border-ink/15 bg-paper-deep/40 p-4 transition-colors hover:border-terracota">
                  {contenido}
                </Link>
              ) : (
                <div className="h-full rounded-xl border border-ink/15 bg-paper-deep/40 p-4">{contenido}</div>
              )}
            </li>
          );
        })}
      </ul>

      {ediciones.length === 0 && <p className="font-sans mt-8 border-t border-ink py-4 text-sm italic text-ink-soft">Aún no hay ediciones.</p>}

      {/* Primero lo que ya se publicó (conserva su número aunque se desactive); después los borradores y las muestras. */}
      <ListaEdiciones
        secciones={[
          { clave: "ediciones", titulo: "Ediciones", items: numeradas.map(item) },
          { clave: "borradores", titulo: "Borradores", nota: "No cuentan como edición hasta que se publiquen; el número tenue es el que recibirían.", items: borradores.map(item) },
          { clave: "muestras", titulo: "Muestras", nota: "No son ediciones de la revista: no llevan número ni salen en el archivo. La de la presentación se hojea en /bienvenida.", items: muestras.map(item) },
        ]}
      />
    </main>
  );
}
