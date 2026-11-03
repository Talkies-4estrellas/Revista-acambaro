"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";

export type EstadoFiltro = "publicada" | "programada" | "borrador" | "desactivada" | "muestra" | "error";

export type ItemLista = {
  id: string;
  /** Las tres formas de verla: renglón compacto, fila con portada y tarjeta de la cuadrícula. */
  renglon: ReactNode;
  fila: ReactNode;
  tarjeta: ReactNode;
  /** Texto donde se busca: tema, archivo, número y fecha. */
  buscar: string;
  /** Títulos de sus páginas (el buscador también mira dentro de la edición). */
  paginas: string[];
  /** Número de edición (null en muestras y con errores). */
  numero: number | null;
  fecha: string;
  tema: string;
  /** Última vez que se guardó (ms). */
  editada: number;
  estado: EstadoFiltro;
  /** El revisor encontró errores o avisos de diseño (los de accesibilidad no cuentan aquí). */
  conAvisos: boolean;
  /** Tiene cambios sin commit (git). */
  sinSubir: boolean;
};

export type SeccionLista = { clave: string; titulo: string; nota?: string; items: ItemLista[] };

type Vista = "compacta" | "lista" | "portadas";
type Orden = "normal" | "numero-desc" | "numero-asc" | "fecha-desc" | "fecha-asc" | "tema" | "editada";
const PREF = { vista: "acomdi-admin-vista", porPagina: "acomdi-admin-por-pagina", orden: "acomdi-admin-orden" };
const POR_PAGINA = [10, 20, 50, 100] as const;

type Filtro = "todas" | "publicada" | "programada" | "borrador" | "avisos" | "sinSubir" | "muestra";
const FILTROS: { id: Filtro; texto: string; cumple: (i: ItemLista) => boolean }[] = [
  { id: "todas", texto: "Todas", cumple: () => true },
  { id: "publicada", texto: "Publicadas", cumple: (i) => i.estado === "publicada" },
  { id: "programada", texto: "Programadas", cumple: (i) => i.estado === "programada" },
  { id: "borrador", texto: "Borradores", cumple: (i) => i.estado === "borrador" || i.estado === "desactivada" || i.estado === "error" },
  { id: "avisos", texto: "⚠ Por revisar", cumple: (i) => i.conAvisos },
  { id: "sinSubir", texto: "● Sin subir", cumple: (i) => i.sinSubir },
  { id: "muestra", texto: "Muestras", cumple: (i) => i.estado === "muestra" },
];
const esFiltro = (v: string | null): v is Filtro => FILTROS.some((f) => f.id === v);

const ORDENES: { id: Orden; texto: string }[] = [
  { id: "normal", texto: "Publicadas primero" },
  { id: "numero-desc", texto: "Número (mayor primero)" },
  { id: "numero-asc", texto: "Número (menor primero)" },
  { id: "fecha-desc", texto: "Fecha (más reciente)" },
  { id: "fecha-asc", texto: "Fecha (más antigua)" },
  { id: "tema", texto: "Tema (A–Z)" },
  { id: "editada", texto: "Editada hace menos" },
];

/** Minúsculas y sin acentos, para buscar sin importar cómo se escriba. */
const normalizar = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const nombreMes = (ym: string) => {
  const s = new Intl.DateTimeFormat("es-MX", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${ym}-15T12:00:00Z`)).replace(" de ", " ");
  return s.charAt(0).toUpperCase() + s.slice(1);
};

function leerPref<T extends string | number>(clave: string, validos: readonly T[], defecto: T): T {
  try {
    const v = localStorage.getItem(clave);
    if (v === null) return defecto;
    const x = (typeof defecto === "number" ? Number(v) : v) as T;
    return validos.includes(x) ? x : defecto;
  } catch {
    return defecto;
  }
}
const guardarPref = (clave: string, v: string | number) => {
  try {
    localStorage.setItem(clave, String(v));
  } catch {}
};

/**
 * La lista de ediciones del panel, pensada para cuando haya muchas (100 o más): buscador (también dentro de las páginas),
 * filtros, mes, orden, «Ir a la N.º», páginas de resultados y tres vistas (compacta, con portada y cuadrícula).
 */
export default function ListaEdiciones({ secciones }: { secciones: SeccionLista[] }) {
  const params = useSearchParams();
  const router = useRouter();
  const deUrl = params.get("f");
  const filtro: Filtro = esFiltro(deUrl) ? deUrl : "todas";
  const setFiltro = (f: Filtro) => router.replace(f === "todas" && !deUrl ? "/admin" : `/admin?f=${f}`, { scroll: false });

  const [vista, setVistaEstado] = useState<Vista>("compacta");
  const [porPagina, setPorPaginaEstado] = useState<number>(20);
  const [orden, setOrdenEstado] = useState<Orden>("normal");
  const [consulta, setConsulta] = useState("");
  const [mes, setMes] = useState("");
  const [pagina, setPagina] = useState(1);
  const [irA, setIrA] = useState("");
  const [avisoIrA, setAvisoIrA] = useState("");
  const buscador = useRef<HTMLInputElement>(null);
  const arriba = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVistaEstado(leerPref<Vista>(PREF.vista, ["compacta", "lista", "portadas"], "compacta"));
    setPorPaginaEstado(leerPref<number>(PREF.porPagina, [...POR_PAGINA, 0], 20));
    setOrdenEstado(leerPref<Orden>(PREF.orden, ORDENES.map((o) => o.id), "normal"));
    // «/» lleva al buscador (si no se está escribiendo en otro campo).
    const tecla = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey || t?.closest("input, textarea, select, [contenteditable]")) return;
      e.preventDefault();
      buscador.current?.focus();
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);
  const setVista = (v: Vista) => (setVistaEstado(v), guardarPref(PREF.vista, v));
  const setPorPagina = (n: number) => (setPorPaginaEstado(n), guardarPref(PREF.porPagina, n), setPagina(1));
  const setOrden = (o: Orden) => (setOrdenEstado(o), guardarPref(PREF.orden, o), setPagina(1));

  // Todas, en el orden de las secciones (publicadas, borradores, muestras), con su sección.
  const todos = useMemo(() => secciones.flatMap((s) => s.items.map((i) => ({ ...i, seccion: s }))), [secciones]);
  const cuantos = Object.fromEntries(FILTROS.map((f) => [f.id, todos.filter(f.cumple).length]));
  const meses = useMemo(() => {
    const m = new Map<string, number>();
    for (const i of todos) if (/^\d{4}-\d{2}/.test(i.fecha)) m.set(i.fecha.slice(0, 7), (m.get(i.fecha.slice(0, 7)) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));
  }, [todos]);

  const palabras = normalizar(consulta).split(/\s+/).filter(Boolean);
  const cumpleFiltro = FILTROS.find((f) => f.id === filtro)!.cumple;
  /** Páginas de la edición cuyo título tiene todas las palabras (para decir dónde coincide). */
  const paginasQueCoinciden = (i: ItemLista) =>
    palabras.length === 0 ? [] : i.paginas.map((t, n) => ({ t, n: n + 1 })).filter(({ t }) => t && palabras.every((p) => normalizar(t).includes(p)));

  const visibles = useMemo(() => {
    const lista = todos.filter(
      (i) =>
        cumpleFiltro(i) &&
        (!mes || i.fecha.startsWith(mes)) &&
        palabras.every((p) => normalizar(i.buscar).includes(p) || i.paginas.some((t) => normalizar(t).includes(p))),
    );
    const num = (i: ItemLista) => i.numero ?? -1;
    const cmp: Record<Orden, ((a: ItemLista, b: ItemLista) => number) | null> = {
      normal: null,
      "numero-desc": (a, b) => num(b) - num(a),
      "numero-asc": (a, b) => (a.numero ?? Infinity) - (b.numero ?? Infinity),
      "fecha-desc": (a, b) => b.fecha.localeCompare(a.fecha),
      "fecha-asc": (a, b) => a.fecha.localeCompare(b.fecha),
      tema: (a, b) => a.tema.localeCompare(b.tema, "es"),
      editada: (a, b) => b.editada - a.editada,
    };
    return cmp[orden] ? [...lista].sort(cmp[orden]!) : lista;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [todos, filtro, mes, consulta, orden]);

  const total = visibles.length;
  const tam = porPagina || Math.max(1, total);
  const paginas = Math.max(1, Math.ceil(total / tam));
  const actual = Math.min(pagina, paginas);
  const enPagina = visibles.slice((actual - 1) * tam, actual * tam);
  const filtrando = palabras.length > 0 || filtro !== "todas" || !!mes;

  // Al cambiar el filtro, la búsqueda o el mes se vuelve a la primera página.
  useEffect(() => setPagina(1), [filtro, consulta, mes]);

  // «Ir a la N.º»: cuando la edición ya está en la lista (con los filtros quitados si la ocultaban), se abre la página de
  // resultados donde quedó; ya dibujada, se lleva a la vista y se resalta un momento.
  const [objetivo, setObjetivo] = useState<string | null>(null);
  useEffect(() => {
    if (!objetivo) return;
    const idx = visibles.findIndex((i) => i.id === objetivo);
    if (idx < 0) return; // todavía no: se están quitando los filtros
    const p = Math.floor(idx / tam) + 1;
    if (p !== actual) {
      setPagina(p);
      return;
    }
    setObjetivo(null);
    const el = document.querySelector<HTMLElement>(`[data-edicion="${CSS.escape(objetivo)}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const marca = ["ring-2", "ring-terracota", "ring-offset-4", "ring-offset-paper", "rounded"];
    el.classList.add(...marca);
    setTimeout(() => el.classList.remove(...marca), 2600);
  }, [objetivo, visibles, tam, actual]);

  function irANumero(e: React.FormEvent) {
    e.preventDefault();
    const n = Number(irA.replace(/[^\d]/g, ""));
    if (!n) return;
    const buscada = todos.find((i) => i.numero === n);
    if (!buscada) {
      setAvisoIrA(`No hay una edición N.º ${String(n).padStart(2, "0")}.`);
      return;
    }
    setAvisoIrA("");
    if (!visibles.some((i) => i.id === buscada.id)) {
      setConsulta("");
      setMes("");
      if (filtro !== "todas") setFiltro("todas");
    }
    setObjetivo(buscada.id);
  }

  const cambiarPagina = (p: number) => {
    setPagina(p);
    arriba.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const Paginador = () =>
    paginas <= 1 ? null : (
      <nav aria-label="Páginas de resultados" className="font-sans flex flex-wrap items-center gap-1 text-xs font-bold">
        <button type="button" onClick={() => cambiarPagina(actual - 1)} disabled={actual === 1} className="rounded-full border border-ink/25 px-3 py-1.5 hover:border-ink disabled:opacity-30">
          ← Anterior
        </button>
        {Array.from({ length: paginas }, (_, i) => i + 1)
          .filter((p) => p === 1 || p === paginas || Math.abs(p - actual) <= 2)
          .map((p, i, arr) => (
            <span key={p} className="flex items-center gap-1">
              {i > 0 && p - arr[i - 1] > 1 && <span className="px-1 text-ink-soft">…</span>}
              <button
                type="button"
                aria-current={p === actual ? "page" : undefined}
                onClick={() => cambiarPagina(p)}
                className={`min-w-[2rem] rounded-full border px-2 py-1.5 ${p === actual ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink"}`}
              >
                {p}
              </button>
            </span>
          ))}
        <button type="button" onClick={() => cambiarPagina(actual + 1)} disabled={actual === paginas} className="rounded-full border border-ink/25 px-3 py-1.5 hover:border-ink disabled:opacity-30">
          Siguiente →
        </button>
      </nav>
    );

  const control = "font-sans rounded-full border border-ink/25 bg-paper px-3 py-1.5 text-xs";
  let seccionAnterior: string | null = null;

  return (
    <div id="lista" ref={arriba} className="mt-10 scroll-mt-16">
      {/* Barra de búsqueda: se queda arriba al bajar */}
      <div className="-mx-5 border-b border-ink/10 bg-paper/95 px-5 py-3 backdrop-blur md:sticky md:top-14 md:z-20">
        <div className="flex flex-wrap items-center gap-2">
          <label className="relative min-w-[14rem] flex-1">
            <span className="sr-only">Buscar ediciones</span>
            <span aria-hidden className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-soft">
              ⌕
            </span>
            <input
              ref={buscador}
              type="search"
              value={consulta}
              onChange={(e) => setConsulta(e.target.value)}
              placeholder="Buscar por tema, número, fecha o título de una página…  ( / )"
              className="font-sans w-full rounded-full border border-ink/25 bg-paper py-2 pl-8 pr-4 text-sm outline-none focus:border-terracota"
            />
          </label>
          <form onSubmit={irANumero} className="flex items-center gap-1" title="Escribe un número y pulsa Enter">
            <label className="font-sans text-xs font-bold" htmlFor="ir-a">
              Ir a la N.º
            </label>
            <input id="ir-a" inputMode="numeric" value={irA} onChange={(e) => (setIrA(e.target.value), setAvisoIrA(""))} placeholder="57" className={`${control} w-16 text-center`} />
            <button type="submit" className={`${control} font-bold hover:border-ink`}>
              Ir
            </button>
          </form>
          <div role="group" aria-label="Cómo ver las ediciones" className="font-sans inline-flex rounded-full border border-ink/25 p-1 text-xs font-bold">
            {(
              [
                ["compacta", "☰ Compacta"],
                ["lista", "▤ Con portada"],
                ["portadas", "▦ Portadas"],
              ] as const
            ).map(([v, t]) => (
              <button key={v} type="button" aria-pressed={vista === v} onClick={() => setVista(v)} className={`rounded-full px-3 py-1 ${vista === v ? "bg-ink text-paper" : "text-ink-soft hover:text-ink"}`}>
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filtrar por estado" className="font-sans flex flex-wrap gap-1.5 text-xs font-bold">
            {FILTROS.map((f) => (
              <button
                key={f.id}
                type="button"
                aria-pressed={filtro === f.id}
                onClick={() => setFiltro(f.id)}
                disabled={f.id !== "todas" && cuantos[f.id] === 0}
                className={`rounded-full border px-2.5 py-1 disabled:opacity-40 ${filtro === f.id ? "border-ink bg-ink text-paper" : "border-ink/25 hover:border-ink"}`}
              >
                {f.texto} <span className="opacity-70">{cuantos[f.id]}</span>
              </button>
            ))}
          </div>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <select value={mes} onChange={(e) => setMes(e.target.value)} aria-label="Mes" className={control}>
              <option value="">Todos los meses</option>
              {meses.map(([m, n]) => (
                <option key={m} value={m}>
                  {nombreMes(m)} ({n})
                </option>
              ))}
            </select>
            <select value={orden} onChange={(e) => setOrden(e.target.value as Orden)} aria-label="Ordenar" className={control}>
              {ORDENES.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.texto}
                </option>
              ))}
            </select>
            <select value={porPagina} onChange={(e) => setPorPagina(Number(e.target.value))} aria-label="Ediciones por página" className={control}>
              {POR_PAGINA.map((n) => (
                <option key={n} value={n}>
                  {n} por página
                </option>
              ))}
              <option value={0}>Todas</option>
            </select>
          </div>
        </div>
        <div className="font-sans mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-soft" aria-live="polite">
          <span>
            {total === 0
              ? "Ninguna edición coincide."
              : `${total} ${total === 1 ? "edición" : "ediciones"}${paginas > 1 ? ` · mostrando ${(actual - 1) * tam + 1}–${Math.min(actual * tam, total)}` : ""}`}
          </span>
          {avisoIrA && <span className="font-bold text-red-700 dark:text-red-300">{avisoIrA}</span>}
          {filtrando && (
            <button
              type="button"
              onClick={() => {
                setConsulta("");
                setMes("");
                setFiltro("todas");
              }}
              className="underline hover:text-ink"
            >
              Quitar filtros
            </button>
          )}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <Paginador />
      </div>

      {vista === "portadas" ? (
        <ol className="mt-4 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 lg:grid-cols-4">{enPagina.map((i) => i.tarjeta)}</ol>
      ) : (
        <ol className={vista === "compacta" ? "mt-2 border-t border-ink" : "mt-2"}>
          {enPagina.map((i) => {
            // En el orden normal se marca dónde empieza cada sección (Ediciones, Borradores, Muestras).
            const titulo = orden === "normal" && !filtrando && i.seccion.clave !== seccionAnterior ? i.seccion : null;
            seccionAnterior = i.seccion.clave;
            const coinciden = paginasQueCoinciden(i);
            return (
              <SinEnvoltorio key={i.id}>
                {titulo && (
                  <li className="font-sans list-none pb-1 pt-6 first:pt-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-ink-soft">
                      {titulo.titulo} · {titulo.items.length}
                    </span>
                    {titulo.nota && <span className="block text-xs text-ink-soft">{titulo.nota}</span>}
                  </li>
                )}
                {vista === "compacta" ? i.renglon : i.fila}
                {coinciden.length > 0 && (
                  <li className="font-sans -mt-1 list-none pb-2 pl-[3.5rem] text-xs text-ink-soft">
                    En sus páginas:{" "}
                    {coinciden.slice(0, 3).map(({ t, n }, k) => (
                      <span key={n}>
                        {k > 0 && " · "}
                        <a href={`/admin/${i.id}#p=${n}`} className="text-terracota hover:underline">
                          p. {n} «{t}»
                        </a>
                      </span>
                    ))}
                    {coinciden.length > 3 && ` y ${coinciden.length - 3} más`}
                  </li>
                )}
              </SinEnvoltorio>
            );
          })}
        </ol>
      )}

      <div className="mt-6 flex justify-center">
        <Paginador />
      </div>
    </div>
  );
}

/** Agrupa varios <li> sin agregar un elemento (para poner el título de sección y las coincidencias junto a cada edición). */
function SinEnvoltorio({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
