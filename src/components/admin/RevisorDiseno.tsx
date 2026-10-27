"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { Pagina } from "@/lib/esquema";
import { revisarAccesibilidad } from "@/lib/accesibilidad";
import { PESO_NIVEL, listaAntesDePublicar, revisarDatos, type Aviso } from "@/lib/revision";
import { btnCls } from "./campos";

/* ---------------------------------------------------------------------------------------------------------------------
 * Revisor de diseño. Dos partes:
 *  1) Datos (instantánea, sobre lo que hay en pantalla): anuncios seguidos, enlaces y textos de ejemplo, imágenes sin descripción.
 *  2) Visual: abre cada página guardada en un marco invisible, con el ancho de una computadora y el de un celular (360 px),
 *     y mide lo que realmente se dibuja: textos que se encimen y letra demasiado chica para leerse en el celular.
 * --------------------------------------------------------------------------------------------------------------------- */

const ESPERA_MS = 0; // (la espera real es hasta que terminen las animaciones; ver medirPagina)
const CONCURRENCIA = 3; // páginas medidas a la vez
const MIN_LETRA_CELULAR = 9.5; // px reales en un celular de 360 px

type Linea = { left: number; right: number; top: number; bottom: number };

function medirPagina(edicionId: string, n: number, ancho: number, cancelado: () => boolean): Promise<Aviso[]> {
  return new Promise((resolver) => {
    const movil = ancho < 640;
    const f = document.createElement("iframe");
    f.setAttribute("aria-hidden", "true");
    f.tabIndex = -1;
    f.style.cssText = `position:fixed;left:0;top:0;width:${ancho}px;height:${movil ? 6000 : 1800}px;border:0;opacity:0;pointer-events:none;z-index:-1`;
    const terminar = (avisos: Aviso[]) => {
      f.remove();
      resolver(avisos);
    };
    const medir = async () => {
      const avisos: Aviso[] = [];
      try {
        const d = f.contentDocument;
        if (!d || cancelado()) return terminar([]);
        // La hoja que se ve: hijo directo de .pagina-lienzo (la de escritorio, que en páginas «escala» no lleva clase propia, o la columna del celular).
        const raices = ([...(d.querySelector(".pagina-lienzo")?.children ?? [])] as HTMLElement[]).filter((r) => r.getBoundingClientRect().width > 0 && getComputedStyle(r).display !== "none");
        const raiz = raices[0];
        if (!raiz) return terminar([]); // página que no es de lienzo
        const donde = movil ? "en el celular" : "en computadora";

        const leer = () => {
          // Un texto invisible (opacidad 0 o casi, display/visibility ocultos en él o en un ancestro) no puede chocar con nada.
          const visible = (t: HTMLElement) => {
            for (let e: HTMLElement | null = t; e && e !== raiz.parentElement; e = e.parentElement) {
              const c = getComputedStyle(e);
              if (c.display === "none" || c.visibility === "hidden" || parseFloat(c.opacity) < 0.05) return false;
            }
            return true;
          };
          const candidatos = [...raiz.querySelectorAll<HTMLElement>('div[style*="white-space:pre-wrap"]')].filter(visible);
          // Un texto con formato por partes dibuja un bloque por párrafo dentro del bloque del elemento: se miden solo los más internos,
          // si no, el elemento «chocaría» con sus propios párrafos.
          const textos = candidatos.filter((t) => !candidatos.some((o) => o !== t && t.contains(o))).map((t) => {
            const r = d.createRange();
            r.selectNodeContents(t);
            const tam = parseFloat(getComputedStyle(t).fontSize) || 0;
            // Range da la caja de la fuente (más alta que las letras); se encoge a la altura que realmente se ve para no marcar
            // bloques que solo se tocan por su interlineado.
            const lineas: Linea[] = [...r.getClientRects()]
              .filter((q) => q.width > 2 && q.height > 2)
              .map((q) => {
                const alto = Math.min(q.height, tam * 0.78);
                const centro = (q.top + q.bottom) / 2;
                return { left: q.left, right: q.right, top: centro - alto / 2, bottom: centro + alto / 2 };
              });
            return { s: (t.textContent ?? "").trim().replace(/[\s ]+/g, " "), lineas, tam };
          }).filter((t) => t.s);
          // Textos que se encimen
          const pares: string[] = [];
          for (let a = 0; a < textos.length; a++) {
            for (let b = a + 1; b < textos.length; b++) {
              if (textos[a].s === textos[b].s) continue; // el mismo texto repetido a propósito (sombra, eco)
              let peor = 0;
              for (const p of textos[a].lineas) {
                for (const q of textos[b].lineas) {
                  const ix = Math.min(p.right, q.right) - Math.max(p.left, q.left);
                  const iy = Math.min(p.bottom, q.bottom) - Math.max(p.top, q.top);
                  const minimo = Math.min(p.bottom - p.top, q.bottom - q.top);
                  if (ix > 6 && iy > Math.max(2.5, minimo * 0.3)) peor = Math.max(peor, iy);
                }
              }
              if (peor > 0) pares.push(`«${textos[a].s.slice(0, 26)}» con «${textos[b].s.slice(0, 26)}»`);
            }
          }
          return { textos, pares };
        };

        // Un choque solo se informa si sigue ahí en una segunda medición: así no se marcan textos que aún se estaban acomodando.
        const primera = leer();
        let choques = primera.pares;
        if (choques.length) {
          await new Promise((r) => setTimeout(r, 1500));
          if (cancelado()) return terminar([]);
          const confirmados = new Set(leer().pares);
          choques = choques.filter((c) => confirmados.has(c));
        }
        const textos = primera.textos;

        if (choques.length) {
          avisos.push({
            pagina: n,
            nivel: "aviso",
            tipo: `Posible choque de textos ${donde}`,
            texto: `${choques.length} par(es): ${choques.slice(0, 3).join("; ")}${choques.length > 3 ? "…" : ""}. Abre la página y confírmalo a ojo: la medición puede marcar textos que apenas se tocan. Si es real, sepáralos o agranda su caja.`,
          });
        }

        // 2) Letra demasiado chica en el celular
        if (movil) {
          const chicos = textos.filter((t) => t.tam > 0 && t.tam < MIN_LETRA_CELULAR).sort((x, y) => x.tam - y.tam);
          if (chicos.length) {
            avisos.push({
              pagina: n,
              nivel: chicos[0].tam < 6.5 ? "aviso" : "info",
              tipo: "Letra chica en el celular",
              texto: `${chicos.length} texto(s) miden menos de ${MIN_LETRA_CELULAR} px en un celular de 360 px (el menor, ${chicos[0].tam.toFixed(1)} px: «${chicos[0].s.slice(0, 30)}»). Si la página es "escala", considera pasarla a "apilar" o subir ese texto.`,
            });
          }
          if (d.documentElement.scrollWidth > ancho + 1) {
            avisos.push({ pagina: n, nivel: "error", tipo: "Se sale por los lados", texto: `La página es más ancha que la pantalla del celular (${d.documentElement.scrollWidth} px); hay que hacer scroll horizontal.` });
          }
        }
        terminar(avisos);
      } catch {
        terminar([]);
      }
    };
    // Espera a que las tipografías del sitio estén cargadas: con una fuente de respaldo los textos ocupan otro espacio
    // y se marcarían choques que en el sitio real no existen.
    f.onload = () => {
      const fuentesListas = f.contentDocument?.fonts?.ready ?? Promise.resolve();
      Promise.race([fuentesListas, new Promise((r) => setTimeout(r, 6000))]).then(async () => {
        await new Promise((r) => setTimeout(r, 700)); // las animaciones arrancan al entrar en pantalla
        // Mide con las animaciones de entrada ya terminadas (si no, los textos aún están desplazados)
        const limite = Date.now() + 7000;
        while (Date.now() < limite && !cancelado()) {
          const vivas = f.contentDocument?.getAnimations?.().some((a) => a.playState === "running" || a.pending) ?? false;
          if (!vivas) break;
          await new Promise((r) => setTimeout(r, 250));
        }
        setTimeout(medir, 400);
      });
    };
    f.onerror = () => terminar([]);
    f.src = `/ediciones/${edicionId}/${n}`;
    document.body.appendChild(f);
    setTimeout(() => f.isConnected && medir(), 15000); // por si la carga no avisa
  });
}

const ETIQUETA_NIVEL: Record<Aviso["nivel"], string> = { error: "Corregir", aviso: "Revisar", info: "Sugerencia" };
const COLOR_NIVEL: Record<Aviso["nivel"], string> = {
  error: "bg-terracota text-paper",
  aviso: "bg-ocre/60 text-ink",
  info: "bg-ink/10 text-ink-soft",
};

export default function RevisorDiseno({
  edicionId,
  paginas,
  fecha,
  tema,
  publicadas,
  sucio,
  paginaActual,
  onIr,
  onArreglar,
  onCerrar,
}: {
  edicionId: string;
  paginas: Pagina[];
  /** Fecha de la edición (AAAA-MM-DD): los datos con fecha se miden contra ella. */
  fecha?: string;
  tema?: string;
  /** Qué ediciones están publicadas (id → sí/no), para avisar de enlaces a ediciones que no existen. */
  publicadas?: Map<string, boolean>;
  /** Hay cambios sin guardar: la revisión visual mira la última versión guardada. */
  sucio: boolean;
  /** Índice (desde 0) de la página abierta en el editor. */
  paginaActual: number;
  onIr: (indice: number) => void;
  /** Aplica el arreglo de un aviso (si lo trae) a la edición. */
  onArreglar?: (aviso: Aviso) => void;
  onCerrar: () => void;
}) {
  const datosAvisos = useMemo(() => [...revisarDatos(paginas, fecha, { publicadas }), ...revisarAccesibilidad({ paginas })], [paginas, fecha, publicadas]);
  const [grupo, setGrupo] = useState<"todo" | "diseno" | "accesibilidad">("todo");
  const [visuales, setVisuales] = useState<Aviso[]>([]);
  const [progreso, setProgreso] = useState<{ hecho: number; total: number } | null>(null);
  const [terminado, setTerminado] = useState(false);
  const cancelar = useRef(false);

  useEffect(() => () => void (cancelar.current = true), []);

  /** Revisa todas las páginas, o solo la indicada (índice desde 0): en ese caso sustituye los hallazgos visuales de esa página. */
  async function revisarVisual(solo?: number) {
    cancelar.current = false;
    if (solo === undefined) setVisuales([]);
    setTerminado(false);
    const indices = solo === undefined ? paginas.map((_, i) => i) : [solo];
    let acumulado: Aviso[] = solo === undefined ? [] : visuales.filter((a) => a.pagina !== solo + 1);
    let siguiente = 0;
    let hechas = 0;
    setProgreso({ hecho: 0, total: indices.length });
    // Varias páginas a la vez (cada una en su marco oculto) para que una edición larga no tarde minutos de más.
    const trabajador = async () => {
      while (!cancelar.current) {
        const k = siguiente++;
        if (k >= indices.length) return;
        const r: Aviso[] = [];
        for (const ancho of [900, 360]) r.push(...(await medirPagina(edicionId, indices[k] + 1, ancho, () => cancelar.current)));
        if (cancelar.current) return;
        acumulado = [...acumulado, ...r];
        hechas++;
        setVisuales(acumulado);
        setProgreso({ hecho: hechas, total: indices.length });
      }
    };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCIA, indices.length) }, trabajador));
    if (cancelar.current) return;
    setProgreso(null);
    setTerminado(true);
  }

  const todos = useMemo(
    () => [...datosAvisos, ...visuales].sort((a, b) => a.pagina - b.pagina || PESO_NIVEL[a.nivel] - PESO_NIVEL[b.nivel]),
    [datosAvisos, visuales],
  );
  const lista = useMemo(() => listaAntesDePublicar({ tema, fecha }, datosAvisos, terminado ? visuales : undefined), [tema, fecha, datosAvisos, visuales, terminado]);
  const pendientes = lista.filter((p) => !p.ok && !p.opcional).length;
  const visibles = todos.filter((a) => grupo === "todo" || (a.grupo ?? "diseno") === grupo);
  const cuentaGrupo = (g: "diseno" | "accesibilidad") => todos.filter((a) => (a.grupo ?? "diseno") === g).length;
  const cuenta = (n: Aviso["nivel"]) => visibles.filter((a) => a.nivel === n).length;
  const corriendo = progreso !== null;

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-ink/60 p-4 sm:p-8" onMouseDown={(e) => e.target === e.currentTarget && onCerrar()}>
      <div role="dialog" aria-modal="true" aria-label="Revisor de diseño" className="w-full max-w-3xl border-2 border-ink bg-paper shadow-2xl">
        <header className="flex items-center justify-between gap-3 border-b border-ink/30 bg-paper-deep px-5 py-3">
          <h2 className="font-display text-2xl font-black">Revisor, accesibilidad y lista antes de publicar</h2>
          <button type="button" className={btnCls} onClick={() => { cancelar.current = true; onCerrar(); }}>✕ Cerrar</button>
        </header>

        <section className="border-b border-ink/20 px-5 py-4" aria-label="Lista antes de publicar">
          <p className={`font-sans text-xs font-bold uppercase tracking-wider ${pendientes === 0 ? "text-oliva" : "text-terracota"}`}>
            {pendientes === 0 ? "✓ Lista para publicar" : `Antes de publicar: ${pendientes} pendiente${pendientes === 1 ? "" : "s"}`}
          </p>
          <ul className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
            {lista.map((p) => (
              <li key={p.clave} className="font-sans flex items-start gap-2 text-xs">
                <span aria-hidden className={`mt-px shrink-0 font-bold ${p.ok ? "text-oliva" : p.opcional ? "text-ink-soft" : "text-terracota"}`}>
                  {p.ok ? "✓" : p.opcional ? "○" : "✗"}
                </span>
                <span className="min-w-0">
                  <span className={p.ok ? "text-ink-soft" : "font-semibold"}>{p.titulo}</span>
                  {!p.ok && p.detalle && <span className="block text-ink-soft">{p.detalle}</span>}
                </span>
              </li>
            ))}
          </ul>
          <p className="font-sans mt-2 text-[0.7rem] text-ink-soft">✗ conviene resolverlo antes de publicar · ○ es una sugerencia; no impide publicar.</p>
        </section>

        <section className="border-b border-ink/20 px-5 py-4">
          <p className="font-sans text-xs leading-relaxed text-ink-soft">
            Busca problemas antes de publicar. La revisión de <strong>datos</strong> es inmediata. La <strong>visual</strong> abre cada página guardada con ancho de
            computadora y de celular y mide el resultado (textos encimados, letra muy chica, páginas que se salen de la pantalla); tarda unos segundos por página.
          </p>
          {sucio && (
            <p className="font-sans mt-2 border-l-4 border-ocre bg-ocre/15 px-3 py-1.5 text-xs">
              Hay cambios sin guardar: la revisión visual usa la <strong>última versión guardada</strong>. Guarda (Ctrl+S) para incluirlos.
            </p>
          )}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button type="button" className={`${btnCls} !bg-ink !px-4 !text-paper`} onClick={() => revisarVisual()} disabled={corriendo}>
              {terminado ? "↻ Revisar de nuevo todas" : "▶ Revisar el diseño de las páginas"}
            </button>
            <button type="button" className={btnCls} onClick={() => revisarVisual(paginaActual)} disabled={corriendo} title="Solo la página que tienes abierta (más rápido)">
              Revisar solo la página {paginaActual + 1}
            </button>
            {corriendo && (
              <>
                <span role="status" className="font-sans text-xs text-ink-soft">
                  Revisadas {progreso.hecho} de {progreso.total} páginas…
                </span>
                <button type="button" className={btnCls} onClick={() => { cancelar.current = true; setProgreso(null); }}>
                  Detener
                </button>
              </>
            )}
            {terminado && <span className="font-sans text-xs font-bold text-oliva">✓ Revisión visual terminada</span>}
          </div>
          {corriendo && (
            <div className="mt-3 h-1.5 w-full bg-ink/10" aria-hidden>
              <div className="h-full bg-terracota transition-all" style={{ width: `${(progreso.hecho / progreso.total) * 100}%` }} />
            </div>
          )}
        </section>

        <section className="px-5 py-4">
          <p className="font-sans mb-3 text-xs font-bold uppercase tracking-wider text-ink-soft">
            {visibles.length === 0 ? "Sin hallazgos por ahora" : `${visibles.length} hallazgo(s) · ${cuenta("error")} por corregir · ${cuenta("aviso")} por revisar · ${cuenta("info")} sugerencias`}
          </p>
          <div className="mb-3 flex flex-wrap gap-1.5" role="tablist" aria-label="Tipo de hallazgo">
            {(
              [
                ["todo", `Todo (${todos.length})`],
                ["diseno", `Diseño y contenido (${cuentaGrupo("diseno")})`],
                ["accesibilidad", `Accesibilidad (${cuentaGrupo("accesibilidad")})`],
              ] as const
            ).map(([id, etiqueta]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={grupo === id}
                onClick={() => setGrupo(id)}
                className={`font-sans rounded-full border px-3 py-1 text-xs font-semibold ${grupo === id ? "border-ink bg-ink text-paper" : "border-ink/30 text-ink-soft hover:border-ink"}`}
              >
                {etiqueta}
              </button>
            ))}
          </div>
          <ul className="space-y-2">
            {visibles.map((a, i) => (
              <li key={i} className="flex items-start gap-3 border border-ink/20 bg-white/50 px-3 py-2 dark:bg-white/5">
                <span className={`font-sans mt-0.5 shrink-0 px-1.5 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider ${COLOR_NIVEL[a.nivel]}`}>{ETIQUETA_NIVEL[a.nivel]}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-sans text-xs font-bold">
                    Página {a.pagina}
                    <span className="font-normal text-ink-soft"> · {paginas[a.pagina - 1]?.titulo ?? ""}</span> · {a.tipo}{a.grupo === "accesibilidad" && <span className="ml-1.5 rounded bg-indigo/10 px-1 text-[0.6rem] font-bold uppercase text-ink-soft">accesibilidad</span>}
                  </p>
                  <p className="font-sans mt-0.5 break-words text-xs text-ink-soft">{a.texto}</p>
                </div>
                <div className="flex shrink-0 flex-col gap-1">
                  <button type="button" className={btnCls} onClick={() => { onIr(a.pagina - 1); onCerrar(); }}>
                    Ir →
                  </button>
                  {a.arreglo && onArreglar && (
                    <button type="button" className={`${btnCls} !border-oliva !text-oliva`} onClick={() => onArreglar(a)} title={a.arreglo.descripcion}>
                      ✓ Arreglar
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
