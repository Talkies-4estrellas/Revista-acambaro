import Link from "next/link";
import { listarEdicionesAdmin, type ResumenEdicion } from "@/lib/admin";
import { estadoEdicion } from "@/lib/ediciones";

export const dynamic = "force-dynamic";

const ZONA = "America/Mexico_City";
const DIA = 86_400_000;
const DIAS_SEMANA = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

/** Hoy en el centro de México, «AAAA-MM-DD». */
const hoyMx = () => new Intl.DateTimeFormat("en-CA", { timeZone: ZONA, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const aIso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const ms = (iso: string) => Date.parse(`${iso}T12:00:00Z`);
/** Lunes de la semana de esa fecha. */
const lunes = (iso: string) => aIso(ms(iso) - ((new Date(ms(iso)).getUTCDay() + 6) % 7) * DIA);
const nombreMes = (ym: string) => {
  const s = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-15T12:00:00Z`)).replace(" de ", " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};
const fechaCorta = (iso: string) => new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "short", timeZone: "UTC" }).format(new Date(ms(iso)));
const mover = (ym: string, n: number) => {
  const d = new Date(`${ym}-15T12:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 7);
};

type Tipo = "publicada" | "programada" | "borrador" | "desactivada";
type EnCalendario = { e: ResumenEdicion; dia: string; tipo: Tipo; hora?: string };

const ESTILO: Record<Tipo, string> = {
  publicada: "bg-terracota/15 text-terracota",
  programada: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  borrador: "bg-ink/10 text-ink-soft",
  desactivada: "border border-ink/30 text-ink-soft",
};
const NOMBRE: Record<Tipo, string> = { publicada: "Publicada", programada: "Programada", borrador: "Borrador", desactivada: "Desactivada" };

/**
 * Calendario de publicación: el mes en cuadrícula (lunes a domingo) con cada edición en su día, si cada semana tiene edición, y las
 * próximas 8 semanas. Las programadas van en el día en que se publican (hora del centro de México); las demás, en su fecha.
 */
export default async function Calendario({ searchParams }: { searchParams: Promise<{ mes?: string }> }) {
  const { mes: pedido } = await searchParams;
  const hoy = hoyMx();
  const mes = pedido && /^\d{4}-(0[1-9]|1[0-2])$/.test(pedido) ? pedido : hoy.slice(0, 7);

  const eventos: EnCalendario[] = listarEdicionesAdmin()
    .filter((e) => !e.error && !e.muestra && e.fecha)
    .map((e) => {
      const programada = !!e.publicada && estadoEdicion({ publicada: true, publicarEn: e.publicarEn }) === "programada";
      const tipo: Tipo = programada ? "programada" : e.publicada ? "publicada" : e.fijo ? "desactivada" : "borrador";
      const dia = programada && e.publicarEn ? e.publicarEn.slice(0, 10) : e.fecha!;
      return { e, dia, tipo, hora: programada ? e.publicarEn?.slice(11, 16) : undefined };
    });
  const porDia = new Map<string, EnCalendario[]>();
  for (const x of eventos) porDia.set(x.dia, [...(porDia.get(x.dia) ?? []), x]);

  // Semanas que tocan el mes (de lunes a domingo).
  const primero = `${mes}-01`;
  const ultimo = aIso(Date.parse(`${mover(mes, 1)}-01T12:00:00Z`) - DIA);
  const semanas: string[][] = [];
  for (let l = lunes(primero); l <= ultimo; l = aIso(ms(l) + 7 * DIA)) semanas.push(Array.from({ length: 7 }, (_, i) => aIso(ms(l) + i * DIA)));

  /** Lo que sale (publicada o programada) en una semana, y si solo hay borradores. */
  const resumenSemana = (dias: string[]) => {
    const lista = dias.flatMap((d) => porDia.get(d) ?? []);
    const salen = lista.filter((x) => x.tipo === "publicada" || x.tipo === "programada");
    return { salen, borradores: lista.filter((x) => x.tipo === "borrador") };
  };

  const proximas = Array.from({ length: 8 }, (_, i) => {
    const l = aIso(ms(lunes(hoy)) + i * 7 * DIA);
    return { lunes: l, dias: Array.from({ length: 7 }, (_, k) => aIso(ms(l) + k * DIA)) };
  });
  const vaciasProximas = proximas.filter((s) => resumenSemana(s.dias).salen.length === 0).length;

  const Chip = ({ x }: { x: EnCalendario }) => (
    <Link
      href={`/admin/${x.e.id}`}
      title={`${NOMBRE[x.tipo]}${x.e.numero ? ` · N.º ${x.e.numero}` : ""} · ${x.e.tema ?? x.e.id}${x.hora ? ` · se publica a las ${x.hora}` : ""}`}
      className={`font-sans block truncate rounded px-1.5 py-0.5 text-[0.7rem] font-bold leading-snug hover:underline ${ESTILO[x.tipo]}`}
    >
      {x.e.numero ? `${x.e.numero} · ` : ""}
      {x.hora ? `${x.hora} · ` : ""}
      {x.e.tema ?? x.e.id}
    </Link>
  );

  return (
    <main className="mx-auto max-w-6xl px-5 py-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-5xl font-black italic">Calendario</h1>
          <p className="font-sans mt-2 max-w-2xl text-sm text-ink-soft">
            Qué sale cada semana y qué semanas quedan vacías. Las programadas aparecen el día en que se publican (hora del centro de México); las demás,
            en su fecha. Toca una edición para abrirla.
          </p>
        </div>
        <nav aria-label="Cambiar de mes" className="font-sans flex items-center gap-1 text-xs font-bold">
          <Link href={`/admin/calendario?mes=${mover(mes, -1)}`} className="rounded-full border border-ink/25 px-3 py-1.5 hover:border-ink">
            ← {nombreMes(mover(mes, -1))}
          </Link>
          {mes !== hoy.slice(0, 7) && (
            <Link href="/admin/calendario" className="rounded-full border border-ink bg-ink px-3 py-1.5 text-paper hover:bg-terracota">
              Hoy
            </Link>
          )}
          <Link href={`/admin/calendario?mes=${mover(mes, 1)}`} className="rounded-full border border-ink/25 px-3 py-1.5 hover:border-ink">
            {nombreMes(mover(mes, 1))} →
          </Link>
        </nav>
      </div>

      <h2 className="font-display mt-8 text-3xl font-black">{nombreMes(mes)}</h2>
      <div className="font-sans mt-2 flex flex-wrap gap-2 text-[0.7rem] font-bold">
        {(Object.keys(NOMBRE) as Tipo[]).map((t) => (
          <span key={t} className={`rounded-full px-2.5 py-0.5 ${ESTILO[t]}`}>
            {NOMBRE[t]}
          </span>
        ))}
      </div>

      {/* Mes en cuadrícula: 7 días y, a la derecha, si la semana tiene edición */}
      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[44rem]">
          <div className="font-sans grid grid-cols-[repeat(7,minmax(0,1fr))_8.5rem] gap-px text-center text-[0.7rem] font-bold uppercase tracking-wider text-ink-soft">
            {DIAS_SEMANA.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
            <span className="py-1">Semana</span>
          </div>
          <div className="grid gap-px overflow-hidden rounded-xl border border-ink/15 bg-ink/15">
            {semanas.map((dias) => {
              const { salen, borradores } = resumenSemana(dias);
              const pasada = dias[6] < hoy;
              return (
                <div key={dias[0]} className="grid grid-cols-[repeat(7,minmax(0,1fr))_8.5rem] gap-px">
                  {dias.map((d) => {
                    const fuera = !d.startsWith(mes);
                    return (
                      <div key={d} className={`min-h-[6.5rem] p-1.5 ${fuera ? "bg-paper-deep/40" : "bg-paper"} ${d === hoy ? "ring-2 ring-inset ring-terracota" : ""}`}>
                        <span className={`font-sans block text-xs font-bold ${fuera ? "text-ink-soft/80" : d === hoy ? "text-terracota" : "text-ink-soft"}`}>{Number(d.slice(8))}</span>
                        <div className="mt-1 space-y-1">
                          {(porDia.get(d) ?? []).map((x) => (
                            <Chip key={x.e.id} x={x} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                  <div className={`font-sans flex flex-col justify-center gap-1 p-2 text-xs ${salen.length ? "bg-terracota/[0.08]" : pasada ? "bg-paper-deep/60" : "bg-amber-500/[0.10]"}`}>
                    {salen.length ? (
                      <span className="font-bold text-terracota">
                        ✓ {salen.length === 1 ? "1 edición" : `${salen.length} ediciones`}
                      </span>
                    ) : (
                      <span className={`font-bold ${pasada ? "text-ink-soft" : "text-amber-800 dark:text-amber-300"}`}>{pasada ? "Sin edición" : "⚠ Sin edición"}</span>
                    )}
                    {borradores.length > 0 && <span className="text-ink-soft">{borradores.length === 1 ? "1 borrador" : `${borradores.length} borradores`}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Próximas 8 semanas */}
      <section aria-labelledby="proximas-t" className="mt-12">
        <h2 id="proximas-t" className="font-display text-2xl font-black">
          Las próximas 8 semanas
        </h2>
        <p className="font-sans mt-1 text-sm text-ink-soft">
          {vaciasProximas === 0 ? "Todas tienen una edición publicada o programada." : `${vaciasProximas} de 8 ${vaciasProximas === 1 ? "semana queda" : "semanas quedan"} sin edición publicada ni programada.`}
        </p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {proximas.map((s, i) => {
            const { salen, borradores } = resumenSemana(s.dias);
            return (
              <li key={s.lunes} className={`rounded-xl border p-4 ${salen.length ? "border-ink/15" : "border-amber-500/50 bg-amber-500/[0.07]"}`}>
                <p className="font-sans text-xs font-bold uppercase tracking-wider text-ink-soft">
                  {i === 0 ? "Esta semana" : i === 1 ? "La próxima" : `En ${i} semanas`} · {fechaCorta(s.dias[0])} – {fechaCorta(s.dias[6])}
                </p>
                <div className="mt-2 space-y-1">
                  {salen.map((x) => (
                    <Chip key={x.e.id} x={x} />
                  ))}
                  {borradores.map((x) => (
                    <Chip key={x.e.id} x={x} />
                  ))}
                  {salen.length === 0 && (
                    <p className="font-sans text-sm font-bold text-amber-800 dark:text-amber-300">
                      ⚠ Sin edición
                      {borradores.length > 0 && <span className="block text-xs font-normal text-ink-soft">Hay borrador: publícalo o prográmalo desde la lista.</span>}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </section>
    </main>
  );
}
