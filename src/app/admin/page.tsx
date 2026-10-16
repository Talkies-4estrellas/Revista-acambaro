import Link from "next/link";
import { listarEdicionesAdmin, type ResumenEdicion } from "@/lib/admin";
import { estadoEdicion, fechaLarga } from "@/lib/ediciones";
import BotonBorrar from "./BotonBorrar";
import NuevaEdicion from "./NuevaEdicion";

export default function Admin() {
  const ediciones = listarEdicionesAdmin();

  // Sugerencia de identificador (nombre del archivo): el siguiente libre. El número de edición es automático.
  const maxId = Math.max(0, ...ediciones.map((e) => (/^\d+$/.test(e.id) ? Number.parseInt(e.id, 10) : 0)));
  const sugerido = {
    id: String(maxId + 1).padStart(2, "0"),
    fecha: new Date().toISOString().slice(0, 10),
  };

  const porNumero = (a: ResumenEdicion, b: ResumenEdicion) => Number(b.numero ?? 0) - Number(a.numero ?? 0);
  // "Ediciones": publicadas, programadas y desactivadas (ya tuvieron número). "Borradores": nunca publicadas.
  const numeradas = ediciones.filter((e) => !e.error && (e.publicada || e.fijo)).sort(porNumero);
  const borradores = ediciones.filter((e) => e.error || !(e.publicada || e.fijo)).sort((a, b) => (a.error ? 1 : 0) - (b.error ? 1 : 0) || porNumero(a, b));

  const fila = (e: ResumenEdicion) => {
    const desactivada = !e.publicada && e.fijo;
    return (
      <li key={e.id} className="border-t border-ink py-4">
        <div className="grid grid-cols-[2.5rem_1fr] items-baseline gap-x-3 gap-y-3 sm:grid-cols-[3.5rem_1fr_auto] sm:gap-4">
          <span
            className={`font-display text-3xl font-black ${e.provisional || e.error ? "text-ink/30" : desactivada ? "text-terracota/50" : "text-terracota"}`}
            title={e.provisional ? "Número previsto: aún no cuenta como edición hasta que se publique" : undefined}
          >
            {e.error ? "—" : (e.numero ?? "?")}
          </span>
          <div className="min-w-0">
            <p className="font-display text-xl font-bold leading-snug sm:truncate">{e.tema ?? `Edición “${e.id}”`}</p>
            <p className="font-sans mt-0.5 text-xs text-ink-soft">
              {e.fecha && fechaLarga(e.fecha)} · {e.paginas ?? "?"} páginas · archivo {e.id}.json ·{" "}
              {e.error ? (
                <span className="font-bold text-terracota">con errores</span>
              ) : e.publicada && estadoEdicion({ publicada: true, publicarEn: e.publicarEn }) === "programada" ? (
                <span className="font-bold text-terracota">⏰ Programada · {e.publicarEn?.replace("T", " ")} (CDMX)</span>
              ) : e.publicada ? (
                <span className="font-bold text-oliva">Publicada{e.publicarEn ? ` · desde ${e.publicarEn.replace("T", " ")}` : ""}</span>
              ) : desactivada ? (
                <span className="font-bold">Desactivada · conserva la N.º {e.numero}</span>
              ) : (
                <span className="font-bold">Borrador · será la N.º {e.numero} al publicarse</span>
              )}
            </p>
          </div>
          <div className="font-sans col-span-2 flex flex-wrap justify-start gap-2 text-xs sm:col-span-1 sm:justify-end font-bold uppercase tracking-wider">
            <Link href={`/admin/${e.id}`} className="bg-ink px-3 py-1.5 text-paper hover:bg-terracota">
              Editar
            </Link>
            {!e.publicada && <BotonBorrar id={e.id} tema={e.tema} numero={desactivada ? e.numero : undefined} />}
            {!e.error && (
              <a href={`/ediciones/${e.id}/1`} target="_blank" rel="noreferrer" className="border border-ink px-3 py-1.5 hover:bg-ink hover:text-paper">
                Ver ↗
              </a>
            )}
          </div>
        </div>
        {e.error && <p className="font-sans mt-2 break-words text-xs text-terracota">{e.error}</p>}
      </li>
    );
  };

  return (
    <main className="mx-auto max-w-5xl px-5 py-10">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/brand/logo.svg" alt="ACOM-Di" className="mb-4 h-10 w-auto" />
      <p className="font-sans text-xs font-bold uppercase tracking-wider text-terracota">Panel de la revista</p>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display mt-1 text-5xl font-black italic">Ediciones</h1>
        <div className="flex gap-2">
          <Link href="/admin/clics" className="font-sans border border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-paper">
            ↗ Clics
          </Link>
          <Link href="/admin/newsletter" className="font-sans border border-ink px-3 py-1.5 text-xs font-bold uppercase tracking-wider hover:bg-ink hover:text-paper">
            ✉ Newsletter
          </Link>
        </div>
      </div>
      <p className="font-sans mt-2 max-w-2xl text-sm text-ink-soft">
        Los cambios se guardan como archivos en <code>content/ediciones</code> y los medios en <code>public/media</code>.
        Este panel solo existe en tu equipo; para publicar, sube los cambios (git push) y despliega.
      </p>

      {ediciones.length === 0 && <p className="font-sans mt-8 border-t border-ink py-4 text-sm italic text-ink-soft">Aún no hay ediciones.</p>}

      {/* Primero lo que ya se publicó (conserva su número aunque se desactive); después los borradores. */}
      {numeradas.length > 0 && (
        <section className="mt-8" aria-label="Ediciones">
          <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-ink-soft">Ediciones · {numeradas.length}</h2>
          <ol className="mt-2">{numeradas.map(fila)}</ol>
        </section>
      )}
      {borradores.length > 0 && (
        <section className="mt-10" aria-label="Borradores">
          <h2 className="font-sans text-xs font-bold uppercase tracking-wider text-ink-soft">Borradores · {borradores.length}</h2>
          <p className="font-sans mt-1 text-xs text-ink-soft">No cuentan como edición hasta que se publiquen; el número tenue es el que recibirían.</p>
          <ol className="mt-2">{borradores.map(fila)}</ol>
        </section>
      )}

      <div className="mt-10">
        <NuevaEdicion sugerido={sugerido} existentes={ediciones.map((e) => ({ id: e.id, tema: e.tema }))} />
      </div>
    </main>
  );
}
